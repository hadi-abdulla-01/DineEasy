
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Order, OrderStatus, RestaurantSettings } from '@/lib/definitions';
import { getOrderById } from '@/lib/data';
import svgPaths from './svg-paths';
import { Printer } from 'lucide-react';
import Link from 'next/link';
import { Invoice } from './ui/invoice';
import { doc, onSnapshot } from 'firebase/firestore';
import { getClientFirebase } from '@/firebase/client';

const statusSteps: { status: OrderStatus; label: string }[] = [
    { status: 'received', label: 'Order Taken' },
    { status: 'preparing', label: 'Preparing' },
    { status: 'ready', label: 'Ready' },
];

export function OrderStatusView({ initialOrder, settings, tableId, restaurantId }: { initialOrder: Order, settings: RestaurantSettings, tableId: string, restaurantId: string }) {
    const [order, setOrder] = useState(initialOrder);
    const invoiceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (order.status === 'completed' || order.status === 'cancelled') {
            return;
        }

        const { firestore } = getClientFirebase();
        const orderRef = doc(firestore, `restaurants/${restaurantId}/orders`, order.id);

        const unsubscribe = onSnapshot(orderRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                // Convert Firestore Timestamps to ISO strings
                if (data) {
                    for (const key in data) {
                        if (data[key]?.toDate && typeof data[key].toDate === 'function') {
                            data[key] = data[key].toDate().toISOString();
                        }
                    }
                }

                const updatedOrder = { id: docSnap.id, ...data } as Order;
                console.log('[OrderStatusView] Order updated:', updatedOrder.status);
                setOrder(updatedOrder);
            }
        }, (error) => {
            console.error("Error watching order status:", error);
        });

        return () => unsubscribe();
    }, [order.id, order.status, restaurantId]);

    const handlePrint = () => {
        const content = invoiceRef.current;
        if (!content) return;

        const printWindow = window.open('', '', 'height=800,width=600');
        if (printWindow) {
            const printSize = settings.printSettings?.invoicePrintSize || 'a4';
            const bodyStyle = printSize === 'a4' ? 'padding: 20px;' : 'padding: 0;';

            printWindow.document.write('<html><head><title>Invoice</title>');

            const styles = Array.from(document.styleSheets).map(sheet => {
                try {
                    if (sheet.href) {
                        return `<link rel="stylesheet" href="${sheet.href}">`;
                    }
                    if (sheet.cssRules) {
                        return `<style>${Array.from(sheet.cssRules).map(rule => rule.cssText).join('')}</style>`;
                    }
                } catch (e) {
                    console.warn('Could not copy stylesheet for printing:', e);
                }
                return '';
            }).join('\n');
            
            printWindow.document.head.innerHTML += styles;
            printWindow.document.write(`</head><body style="${bodyStyle}">`);
            printWindow.document.write(content.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    const currentStepIndex = statusSteps.findIndex(step => step.status === order.status);
    const isOrderActive = order.status === 'received' || order.status === 'preparing' || order.status === 'ready';
    const currencySymbol = settings.currencySymbol || '$';
    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

    return (
        <div className="relative w-full sm:max-w-[393px] min-h-screen bg-[var(--order-status-bg)] sm:rounded-[20px] overflow-hidden shadow-lg" style={{ fontFamily: "'League Spartan', sans-serif" }}>
            <div className="hidden">
                <div ref={invoiceRef}>
                    <Invoice order={order} settings={settings} />
                </div>
            </div>
            {/* Yellow Header Background */}
            <div className="absolute inset-0">
                <svg className="block w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 393 852">
                    <rect fill="var(--order-status-yellow)" height="852" rx="20" width="393" />
                    <path d={svgPaths.p3816e100} fill="var(--order-status-bg)" />
                </svg>
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="pt-[73px] pb-8 text-center">
                    <h1 className="text-[28px] font-bold text-white">Order Status</h1>
                </div>

                {/* Thank You Message */}
                <div className="text-center mb-2">
                    <h2 className="text-[24px] font-bold text-[var(--order-status-text)] capitalize">
                        Thank You, {order.customerName}!
                    </h2>
                </div>

                {/* Invoice Number */}
                <div className="text-center mb-12">
                    <p className="text-[20px] font-medium text-[var(--order-status-text-muted)]">
                        {order.invoiceNumber ? `Invoice #${order.invoiceNumber}` : `Order #${order.id.slice(-6)}`}
                    </p>
                </div>

                {/* Progress Indicator */}
                <div className="px-8 mb-16">
                    <div className="flex flex-col items-center">
                        {/* Circles and Lines Row */}
                        <div className="flex items-center justify-center mb-3">
                            {statusSteps.map((step, index) => {
                                const isActive = index <= currentStepIndex;
                                const isLastStep = index === statusSteps.length - 1;

                                return (
                                    <div key={step.status} className="flex items-center">
                                        {/* Circle */}
                                        <div className="w-[53px] h-[53px] rounded-full flex items-center justify-center" style={{ backgroundColor: isActive ? 'var(--order-status-red)' : '#E0E0E0' }}>
                                            {/* Clock Icon - Order Taken */}
                                            {index === 0 && isActive && (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                            )}

                                            {/* Chef Hat Icon - Preparing */}
                                            {index === 1 && isActive && (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                                                    <line x1="6" y1="17" x2="18" y2="17" />
                                                </svg>
                                            )}

                                            {/* Checkmark Icon - Ready */}
                                            {index === 2 && isActive && (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Connecting Line */}
                                        {!isLastStep && (
                                            <div
                                                className="h-[5px]"
                                                style={{
                                                    width: '50px',
                                                    backgroundColor: isActive && index < currentStepIndex ? 'var(--order-status-red)' : '#E0E0E0'
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Labels Row */}
                        <div className="flex items-start justify-center" style={{ width: '100%', maxWidth: '350px' }}>
                            {statusSteps.map((step, index) => (
                                <div
                                    key={step.status}
                                    className="flex-1 text-center"
                                    style={{
                                        marginLeft: index === 0 ? '0' : '-10px',
                                        marginRight: index === statusSteps.length - 1 ? '0' : '-10px'
                                    }}
                                >
                                    <p className="text-[14px] font-light text-[var(--order-status-text)] whitespace-nowrap">
                                        {step.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status Messages */}
                    {order.status === 'cancelled' && (
                        <p className="text-center text-red-600 mt-4 text-sm">This order has been cancelled.</p>
                    )}
                    {order.status === 'completed' && (
                        <p className="text-center text-green-600 font-semibold mt-4 text-sm">Your order is complete. Thank you!</p>
                    )}
                </div>

                {/* Separator Line */}
                <div className="px-[53px] mb-4">
                    <div className="h-[2px] bg-[var(--order-status-line)]" style={{ transform: 'rotate(0.374deg)' }}></div>
                </div>

                {/* Order Summary */}
                <div className="px-[53px] mb-6">
                    <h3 className="text-[16px] font-medium text-[var(--order-status-text)] mb-4" style={{ textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}>
                        Order Summary
                    </h3>

                    {/* Order Items */}
                    {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between mb-2">
                            <span className={`text-[14px] font-light text-[var(--order-status-text)] ${item.status === 'cancelled' ? 'line-through' : ''}`}>
                                {item.quantity}x {item.name}
                            </span>
                            {item.status !== 'cancelled' && (
                                <span className="text-[14px] font-light text-[var(--order-status-text)]">
                                    {currencySymbol}{(item.price * item.quantity).toFixed(currencyDecimalPlaces)}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Separator Line */}
                <div className="px-[53px] mb-4">
                    <div className="h-[2px] bg-[var(--order-status-line)]" style={{ transform: 'rotate(0.374deg)' }}></div>
                </div>

                {/* Pricing Details */}
                <div className="px-[53px] mb-4">
                    <div className="flex justify-between mb-2">
                        <span className="text-[14px] font-light text-[var(--order-status-text)]">Subtotal</span>
                        <span className="text-[14px] font-light text-[var(--order-status-text)]">
                            {currencySymbol}{order.subtotal.toFixed(currencyDecimalPlaces)}
                        </span>
                    </div>

                    {order.taxes.map((tax, index) => (
                        <div key={index} className="flex justify-between mb-2">
                            <span className="text-[14px] font-light text-[var(--order-status-text)]">
                                {tax.name} ({tax.rate}%)
                            </span>
                            <span className="text-[14px] font-light text-[var(--order-status-text)]">
                                {currencySymbol}{tax.amount.toFixed(currencyDecimalPlaces)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Dashed Separator */}
                <div className="px-[39px] mb-4">
                    <svg className="w-full h-[2px]" preserveAspectRatio="none" viewBox="0 0 320 2">
                        <line x1="0" y1="1" x2="320" y2="1" stroke="var(--order-status-line-dashed)" strokeDasharray="2 2" />
                    </svg>
                </div>

                {/* Total */}
                <div className="px-[53px] mb-8">
                    <div className="flex justify-between">
                        <span className="text-[16px] font-medium text-[var(--order-status-text)]" style={{ textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}>
                            Total
                        </span>
                        <span className="text-[14px] font-light text-[var(--order-status-text)]">
                            {currencySymbol}{order.total.toFixed(currencyDecimalPlaces)}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-8 pb-8 space-y-3">
                    {(order.status === 'ready' || order.status === 'completed') && (
                        <button
                            onClick={handlePrint}
                            className="w-full bg-white border-2 border-[var(--order-status-red)] text-[var(--order-status-red)] py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-[var(--order-status-red)] hover:text-white transition-colors"
                        >
                            <Printer className="h-4 w-4" />
                            Print Invoice
                        </button>
                    )}

                    {isOrderActive && (
                        <Link
                            href={`/order/${tableId}/?add_items=true&order_id=${order.id}`}
                            className="block w-full bg-[var(--order-status-red)] text-white py-3 px-4 rounded-lg font-medium text-sm text-center hover:bg-[var(--order-status-orange)] transition-colors"
                        >
                            Add More Items
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
