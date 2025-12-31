
'use client';
import type { Order, RemoteOrder, RestaurantSettings } from "@/lib/definitions";
import React from 'react';
import { formatInTimezone } from '@/lib/format-date';

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
    const printSize = settings.printSettings?.invoicePrintSize || 'a4';

    let containerWidth = '100%';
    let baseFontSize = '14px';
    let stylePreset = 'a4';

    if (printSize === 'thermal80mm') {
        containerWidth = '80mm';
        baseFontSize = '10pt';
        stylePreset = 'thermal';
    } else if (printSize === 'custom' && settings.printSettings?.invoiceCustomWidth) {
        containerWidth = `${settings.printSettings.invoiceCustomWidth}mm`;
        baseFontSize = '10pt';
        stylePreset = 'thermal';
    }

    const a4Styles: React.CSSProperties = {
        fontFamily: 'sans-serif',
        padding: '20px',
        color: 'black',
        width: containerWidth,
    };

    const thermalStyles: React.CSSProperties = {
        fontFamily: 'monospace, sans-serif',
        color: 'black',
        width: containerWidth,
        padding: '2mm',
        fontSize: baseFontSize,
    };

    const styles = stylePreset === 'a4' ? a4Styles : thermalStyles;

    return (
        <div style={styles}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <h1 style={{ fontSize: stylePreset === 'a4' ? '24px' : '16pt', margin: '0', fontWeight: 'bold' }}>Invoice</h1>
                <h2 style={{ fontSize: stylePreset === 'a4' ? '18px' : '12pt', margin: '5px 0' }}>{settings.restaurantName}</h2>
                <p style={{ margin: '0', fontSize: stylePreset === 'a4' ? '14px' : '9pt' }}>{settings.restaurantAddress}</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '9pt' }}>- - - - - - - - - - - - - - - - - -</p>
                <p style={{ margin: '0', fontSize: stylePreset === 'a4' ? '12px' : '9pt' }}>Date: {formatInTimezone(order.createdAt, 'PPpp', settings.timezone)}</p>
                {order.invoiceNumber && <p style={{ margin: '0', fontSize: stylePreset === 'a4' ? '12px' : '9pt' }}>Invoice #: {order.invoiceNumber}</p>}
                <p style={{ margin: '0', fontSize: stylePreset === 'a4' ? '12px' : '9pt' }}>Order ID: {order.id}</p>
                {isDineInOrder(order) && order.table && <p style={{ margin: '0', fontSize: stylePreset === 'a4' ? '12px' : '9pt' }}>Table: {order.table.number}</p>}
                <p style={{ margin: '0', fontSize: stylePreset === 'a4' ? '12px' : '9pt', textTransform: 'capitalize' }}>Order Type: {order.orderType}</p>
            </div>
            <p style={{ margin: '10px 0 0 0', fontSize: '9pt', textAlign: 'center' }}>- - - - - - - - - - - - - - - - - -</p>
            <div style={{ marginTop: '10px' }}>
                <h3 style={{ fontSize: stylePreset === 'a4' ? '16px' : '11pt', fontWeight: 'bold' }}>Customer:</h3>
                <p style={{ margin: '2px 0' }}>{customerName} ({customerPhone})</p>
                {isRemoteOrder(order) && order.orderType === 'Online' && (
                    <>
                        <p style={{ margin: '2px 0' }}>Address: {order.customerDetails.address}</p>
                        <p style={{ margin: '2px 0' }}>Platform: {order.customerDetails.platform}</p>
                    </>
                )}
            </div>
            <p style={{ margin: '10px 0', fontSize: '9pt', textAlign: 'center' }}>- - - - - - - - - - - - - - - - - -</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: stylePreset === 'a4' ? '14px' : '9pt' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', padding: '5px', borderBottom: '1px solid black' }}>Item</th>
                        <th style={{ textAlign: 'right', padding: '5px', borderBottom: '1px solid black' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '5px', borderBottom: '1px solid black' }}>Price</th>
                        <th style={{ textAlign: 'right', padding: '5px', borderBottom: '1px solid black' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item, index) => (
                        <tr key={index}>
                            <td style={{ padding: '5px' }}>{item.name}</td>
                            <td style={{ textAlign: 'right', padding: '5px' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '5px' }}>{item.price.toFixed(currencyDecimalPlaces)}</td>
                            <td style={{ textAlign: 'right', padding: '5px' }}>{(item.quantity * item.price).toFixed(currencyDecimalPlaces)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p style={{ margin: '10px 0', fontSize: '9pt', textAlign: 'center' }}>- - - - - - - - - - - - - - - - - -</p>
            <div style={{ marginTop: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: stylePreset === 'a4' ? '14px' : '9pt' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '2px 5px', textAlign: 'right' }}>Subtotal:</td>
                            <td style={{ width: '80px', padding: '2px 5px', textAlign: 'right' }}>{currencySymbol}{order.subtotal.toFixed(currencyDecimalPlaces)}</td>
                        </tr>
                        {Array.isArray(order.taxes) && order.taxes.map((tax, index) => (
                            <tr key={index}>
                                <td style={{ padding: '2px 5px', textAlign: 'right' }}>{tax.name} ({tax.rate}%):</td>
                                <td style={{ width: '80px', padding: '2px 5px', textAlign: 'right' }}>{currencySymbol}{tax.amount.toFixed(currencyDecimalPlaces)}</td>
                            </tr>
                        ))}
                        <tr>
                            <td style={{ padding: '5px', textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid black', borderBottom: '1px solid black' }}>Total:</td>
                            <td style={{ width: '80px', padding: '5px', textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid black', borderBottom: '1px solid black' }}>{currencySymbol}{order.total.toFixed(currencyDecimalPlaces)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: stylePreset === 'a4' ? '12px' : '9pt' }}>
                <p>Thank you for your business!</p>
            </div>
        </div>
    );
}
