
'use client';
import type { Order, RemoteOrder, RestaurantSettings } from "@/lib/definitions";
import React from 'react';
import { formatInTimezone } from '@/lib/format-date';
import Logo from '@/components/logo';

type CombinedOrder = Order | RemoteOrder;

function isRemoteOrder(order: CombinedOrder): order is RemoteOrder {
    return 'customerDetails' in order;
}

function isDineInOrder(order: CombinedOrder): order is Order {
    return 'table' in order && 'tableId' in order;
}

export function Invoice({ order, settings }: { order: CombinedOrder, settings: RestaurantSettings }) {
    const customerName = isRemoteOrder(order) ? order.customerDetails.name : order.customerName;
    const customerPhone = isRemoteOrder(order) ? order.customerDetails.phone : order.customerPhone;
    const currencySymbol = settings.currencySymbol || '$';
    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;
    
    const { 
        invoicePrintSize,
        invoiceCustomWidth,
        invoiceFooterText,
        invoiceTitle,
        showInvoiceTitle,
        showInvoiceFooter,
        showRestaurantAddress,
        showCustomerDetails,
        showLogoInInvoice,
        itemHeaderFontSize,
        itemBodyFontSize,
        showDineEzeeWatermark,
        invoiceLogo,
        showThankYouMessage,
        invoiceThankYouMessage
    } = settings.printSettings || {};

    const { taxName, taxNumber } = settings;

    const logoUrl = invoiceLogo;

    const printSize = invoicePrintSize || 'a4';
    const isThermal = printSize === 'thermal80mm' || printSize === 'custom';

    let containerWidth = '100%';
    if (isThermal) {
        if (printSize === 'custom' && invoiceCustomWidth) {
            containerWidth = `${invoiceCustomWidth}mm`;
        } else {
            containerWidth = '76mm'; // Slightly less than 80mm for margin
        }
    }
    
    const styles: React.CSSProperties = {
        fontFamily: isThermal ? 'monospace, sans-serif' : 'sans-serif',
        color: 'black',
        width: containerWidth,
        fontSize: isThermal ? '9pt' : '12px', // Reduced base font size for thermal
        boxSizing: 'border-box',
        margin: '0 auto',
        padding: isThermal ? '2mm' : '20px', // Reduced padding for thermal
    };

    const separatorStyle: React.CSSProperties = {
        margin: isThermal ? '5px 0' : '10px 0',
        fontSize: '9pt',
        textAlign: 'center',
        lineHeight: '1',
    };

    return (
        <div style={styles}>
            {showLogoInInvoice && logoUrl && (
                <div style={{ textAlign: 'center', marginBottom: isThermal ? '5px' : '10px' }}>
                    <img src={logoUrl} alt="Restaurant Logo" style={{ maxHeight: isThermal ? '60px' : '80px', maxWidth: '150px', margin: '0 auto' }} />
                </div>
            )}
            <div style={{ textAlign: 'center', marginBottom: isThermal ? '5px' : '10px' }}>
                {(showInvoiceTitle ?? true) && <h1 style={{ fontSize: isThermal ? '14pt' : '24px', margin: '0 0 5px 0', fontWeight: 'bold' }}>{invoiceTitle || 'Invoice'}</h1>}
                <h2 style={{ fontSize: isThermal ? '11pt' : '18px', margin: '2px 0' }}>{settings.restaurantName}</h2>
                {showRestaurantAddress !== false && <p style={{ margin: '0', fontSize: isThermal ? '8pt' : '12px' }}>{settings.restaurantAddress}</p>}
                
                {taxName && taxNumber && (
                    <p style={{ margin: '3px 0 0 0', fontSize: isThermal ? '8pt' : '12px', fontWeight: 'bold' }}>
                        {taxName}: {taxNumber}
                    </p>
                )}

                <p style={separatorStyle}>- - - - - - - - - - - - - - - - - -</p>
                <p style={{ margin: '0', fontSize: isThermal ? '8pt' : '12px' }}>Date: {formatInTimezone(order.createdAt, "PPpp", settings.timezone)}</p>
                {order.invoiceNumber && <p style={{ margin: '0', fontSize: isThermal ? '8pt' : '12px' }}>Invoice #: {order.invoiceNumber}</p>}
                <p style={{ margin: '0', fontSize: isThermal ? '8pt' : '12px' }}>Order ID: {order.id}</p>
                {isDineInOrder(order) && order.table && <p style={{ margin: '0', fontSize: isThermal ? '8pt' : '12px' }}>Table: {order.table.number}</p>}
                <p style={{ margin: '0', fontSize: isThermal ? '8pt' : '12px', textTransform: 'capitalize' }}>Order Type: {order.orderType}</p>
            </div>
            
            {showCustomerDetails !== false && (
                <>
                    <p style={separatorStyle}>- - - - - - - - - - - - - - - - - -</p>
                    <div style={{ marginTop: isThermal ? '5px' : '10px' }}>
                        <h3 style={{ fontSize: isThermal ? '10pt' : '16px', fontWeight: 'bold', margin: '0 0 2px 0' }}>Customer:</h3>
                        <p style={{ margin: '0', fontSize: isThermal ? '8pt' : '12px' }}>{customerName} ({customerPhone})</p>
                        {isRemoteOrder(order) && order.orderType === 'Online' && (
                            <>
                                <p style={{ margin: '0', fontSize: isThermal ? '8pt' : '12px' }}>Address: {order.customerDetails.address}</p>
                                <p style={{ margin: '0', fontSize: isThermal ? '8pt' : '12px' }}>Platform: {order.customerDetails.platform}</p>
                            </>
                        )}
                    </div>
                </>
            )}
            
            <p style={separatorStyle}>- - - - - - - - - - - - - - - - - -</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isThermal ? `${itemBodyFontSize || 8}pt` : '12px' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', padding: '2px', borderBottom: '1px solid black', fontSize: isThermal ? `${itemHeaderFontSize || 9}pt` : '12px' }}>Item</th>
                        <th style={{ textAlign: 'right', padding: '2px', borderBottom: '1px solid black', fontSize: isThermal ? `${itemHeaderFontSize || 9}pt` : '12px' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '2px', borderBottom: '1px solid black', fontSize: isThermal ? `${itemHeaderFontSize || 9}pt` : '12px' }}>Price</th>
                        <th style={{ textAlign: 'right', padding: '2px', borderBottom: '1px solid black', fontSize: isThermal ? `${itemHeaderFontSize || 9}pt` : '12px' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item, index) => (
                        <tr key={index}>
                            <td style={{ padding: '2px', verticalAlign: 'top' }}>{item.name}</td>
                            <td style={{ textAlign: 'right', padding: '2px', verticalAlign: 'top' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '2px', verticalAlign: 'top' }}>{item.price.toFixed(currencyDecimalPlaces)}</td>
                            <td style={{ textAlign: 'right', padding: '2px', verticalAlign: 'top' }}>{(item.quantity * item.price).toFixed(currencyDecimalPlaces)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <p style={separatorStyle}>- - - - - - - - - - - - - - - - - -</p>
            
            <div style={{ marginTop: isThermal ? '5px' : '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isThermal ? '8pt' : '12px' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '1px 2px', textAlign: 'right' }}>Subtotal:</td>
                            <td style={{ width: '80px', padding: '1px 2px', textAlign: 'right' }}>{currencySymbol}{order.subtotal.toFixed(currencyDecimalPlaces)}</td>
                        </tr>
                        {order.discount > 0 && (
                             <tr>
                                <td style={{ padding: '1px 2px', textAlign: 'right' }}>Discount:</td>
                                <td style={{ width: '80px', padding: '1px 2px', textAlign: 'right' }}>-{currencySymbol}{order.discount.toFixed(currencyDecimalPlaces)}</td>
                            </tr>
                        )}
                        {Array.isArray(order.taxes) && order.taxes.map((tax, index) => (
                            <tr key={index}>
                                <td style={{ padding: '1px 2px', textAlign: 'right' }}>{tax.name} ({tax.rate}%):</td>
                                <td style={{ width: '80px', padding: '1px 2px', textAlign: 'right' }}>{currencySymbol}{tax.amount.toFixed(currencyDecimalPlaces)}</td>
                            </tr>
                        ))}
                        <tr>
                            <td style={{ padding: '3px 2px', textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid black', borderBottom: '1px solid black' }}>Total:</td>
                            <td style={{ width: '80px', padding: '3px 2px', textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid black', borderBottom: '1px solid black' }}>{currencySymbol}{order.total.toFixed(currencyDecimalPlaces)}</td>
                        </tr>
                        {order.paymentMethod && (
                            <tr>
                                <td style={{ padding: '3px 2px', textAlign: 'right', fontWeight: 'bold' }}>Payment Method:</td>
                                <td style={{ width: '80px', padding: '3px 2px', textAlign: 'right', fontWeight: 'bold', textTransform: 'capitalize' }}>{order.paymentMethod}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {(showInvoiceFooter ?? true) && invoiceFooterText && (
                <div style={{ marginTop: isThermal ? '8px' : '20px', textAlign: 'center', fontSize: isThermal ? '8pt' : '12px', whiteSpace: 'pre-wrap' }}>
                    {invoiceFooterText}
                </div>
            )}
            {(showThankYouMessage ?? true) && (
                <div style={{ marginTop: isThermal ? '8px' : '20px', textAlign: 'center', fontSize: isThermal ? '8pt' : '12px' }}>
                    <p>{invoiceThankYouMessage ?? 'Thank you for your business!'}</p>
                </div>
            )}
            {showDineEzeeWatermark && (
                <div style={{ marginTop: isThermal ? '15px' : '30px', textAlign: 'center', opacity: 0.5 }}>
                    <p style={{ fontSize: '8px', marginBottom: '2px' }}>Powered by</p>
                    <Logo style={{ width: '60px', height: 'auto', margin: '0 auto' }} />
                </div>
            )}
        </div>
    );
}
