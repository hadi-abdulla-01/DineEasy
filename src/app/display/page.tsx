
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Table, RestaurantSettings } from '@/lib/definitions';
import { QRCode } from '@/components/qr-code';
import { LoaderCircle } from 'lucide-react';
import Logo from '@/components/logo';
import KioskHeader from '@/components/kiosk-header';
import { getSettings } from '@/lib/data';
import { useFirebase } from '@/firebase/provider';
import { doc, onSnapshot } from 'firebase/firestore';

function DisplayContent() {
    const searchParams = useSearchParams();
    const tableId = searchParams.get('tableId');
    const restaurantIdFromUrl = searchParams.get('restaurantId');
    const { firestore } = useFirebase();

    const [table, setTable] = useState<Table | null>(null);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!tableId || !restaurantIdFromUrl) {
            setError(tableId ? "No restaurant ID provided in the URL." : "No table ID provided in the URL.");
            setIsLoading(false);
            return;
        }

        if (!firestore) {
            // This can happen briefly on first load, so we don't set an error immediately.
            // The loading state will cover it.
            return;
        }

        // Fetch non-realtime settings once
        getSettings(undefined, restaurantIdFromUrl)
            .then(setSettings)
            .catch(err => {
                console.error("Error fetching settings:", err);
                setError("Could not load restaurant settings.");
            });

        // Set up real-time listener for the table
        const tableRef = doc(firestore, 'restaurants', restaurantIdFromUrl, 'tables', tableId);

        const unsubscribe = onSnapshot(tableRef, (docSnap) => {
            if (docSnap.exists()) {
                const tableData = { id: docSnap.id, ...docSnap.data() } as Table;
                // Important: ensure restaurantId is present for QR code generation
                if (!tableData.restaurantId) {
                    tableData.restaurantId = restaurantIdFromUrl;
                }
                setTable(tableData);
                setError('');
            } else {
                setError(`Table with ID "${tableId}" could not be found.`);
                setTable(null);
            }
            setIsLoading(false);
        }, (err) => {
            console.error("Error listening to table document:", err);
            setError("An error occurred while fetching table data.");
            setIsLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [tableId, restaurantIdFromUrl, firestore]);

    if (isLoading) {
        return (
             <div className="flex-1 bg-gray-200 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                     <p className="text-muted-foreground">Loading QR Code...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="flex-1 bg-gray-200 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                    <h1 className="text-xl font-bold text-destructive mb-2">Error</h1>
                    <p className="text-muted-foreground">{error}</p>
                </div>
            </div>
        )
    }

    if (!table) {
        return (
             <div className="flex-1 bg-gray-200 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                    <h1 className="text-xl font-bold text-destructive mb-2">Error</h1>
                    <p className="text-muted-foreground">Table could not be loaded.</p>
                </div>
            </div>
        )
    }


    return (
        <div className="flex-1 bg-gray-200 flex items-center justify-center p-4">
             <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl shadow-2xl max-w-md mx-auto">
                <h1 className="text-5xl font-bold text-gray-800 mb-2">
                    Table {table.number}
                </h1>
                <p className="text-lg text-gray-500 mb-8">Scan the code below to place your order</p>
                <div className="p-6 bg-gray-100 rounded-xl">
                    {settings ? (
                        <QRCode key={table.qrToken || table.id} table={table} settings={settings} />
                    ) : (
                        <div className="h-[150px] w-[150px] bg-gray-300 animate-pulse rounded-md" />
                    )}
                </div>
                <div className="mt-8 flex items-center gap-3 text-gray-400">
                    <Logo className="h-6 w-auto" />
                    <p>Powered by DineEzee</p>
                </div>
            </div>
        </div>
    );
}

export default function DisplayPage() {
    return (
        <div className="min-h-screen bg-muted flex flex-col">
            <KioskHeader />
            <Suspense fallback={<div className="flex-1 flex items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin"/></div>}>
                <DisplayContent />
            </Suspense>
        </div>
    )
}
