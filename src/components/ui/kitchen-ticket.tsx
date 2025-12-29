
'use client';
import type { Order, RestaurantSettings } from "@/lib/definitions";
import { format } from "date-fns";
import React from "react";

export function KitchenTicket({ order, settings }: { order: Order, settings: RestaurantSettings }) {
    
    const getOrderTitle = (order: Order) => {
        switch (order.orderType) {
            case 'Dine-in':
                return order.table ? `Table ${order.table.number}`: 'Dine-in';
            case 'Online':
                return 'Online Order';
            case 'Take-away':
                return 'Take-Away';
            default:
                return `Order #${order.id.slice(-4)}`;
        }
    };
    
    const printSize = settings.printSettings?.kitchenTicketPrintSize || 'thermal80mm';
    
    let containerWidth = '100%';
    let baseFontSize = '12pt';
    let stylePreset = 'a4';

    if (printSize === 'thermal80mm') {
        containerWidth = '80mm';
        stylePreset = 'thermal';
    } else if (printSize === 'custom' && settings.printSettings?.kitchenTicketCustomWidth) {
        containerWidth = `${settings.printSettings.kitchenTicketCustomWidth}mm`;
        stylePreset = 'thermal';
    }

    const a4Styles = {
        fontFamily: 'sans-serif',
        padding: '20px',
        color: 'black',
        width: containerWidth,
        border: '1px solid black',
    };

    const thermalStyles = {
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
                <h2 style={{ fontSize: stylePreset === 'a4' ? '2rem' : '1.8rem', fontWeight: 'bold', margin: 0 }}>{getOrderTitle(order)}</h2>
                <p style={{ fontSize: stylePreset === 'a4' ? '1rem' : '0.9rem', margin: 0 }}>{format(new Date(order.createdAt), "PPpp")}</p>
                <p style={{ fontSize: stylePreset === 'a4' ? '0.8rem' : '0.7rem' }}>Order ID: {order.id}</p>
            </div>
            
            <hr style={{ border: 'none', borderTop: '2px dashed black', margin: '10px 0' }}/>

            <div style={{ marginBottom: '10px' }}>
                <p style={{margin: '2px 0'}}><strong>Customer:</strong> {order.customerName}</p>
            </div>

            {order.notes && (
                <div style={{ marginBottom: '10px', padding: '8px', border: '2px dashed black' }}>
                    <p style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: stylePreset === 'a4' ? '1rem': '0.9rem', margin: 0}}>Order Notes:</p>
                    <p style={{ fontWeight: '600', fontSize: stylePreset === 'a4' ? '1.1rem': '1rem', margin: 0}}>{order.notes}</p>
                </div>
            )}
            
            <hr style={{ border: 'none', borderTop: '2px dashed black', margin: '10px 0' }}/>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: stylePreset === 'a4' ? '1.2rem' : '1rem' }}>
                {order.items.map(item => (
                    <li key={item.orderItemId} style={{ marginBottom: '15px' }}>
                        <p style={{ fontSize: stylePreset === 'a4' ? '1.5rem' : '1.4rem', fontWeight: 'bold', margin: 0}}>{item.quantity}x {item.name}</p>
                        {item.notes && (
                            <div style={{ paddingLeft: '15px', fontStyle: 'italic', fontSize: stylePreset === 'a4' ? '1.1rem' : '1rem' }}>
                                 {item.notes.split(';').map(note => note.trim()).filter(note => note).map((note, index) => {
                                    const [group, option] = note.split(':');
                                    return (
                                        <div key={index}>
                                            <span style={{fontWeight: 600}}>{group}:</span> {option}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
