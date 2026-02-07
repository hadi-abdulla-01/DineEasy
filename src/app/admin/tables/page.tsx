

'use client';
import { createTableAction, toggleTableDynamicQRAction, updateTableFloorAction, resetTableQRTokenAction, updateTableShapeAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import type { Table, RestaurantSettings, Branch } from "@/lib/definitions";
import { Printer, Trash2, QrCode, Move, RefreshCw, LoaderCircle } from "lucide-react";
import { QRCode } from "@/components/qr-code";
import { useAuth } from "../auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteTableAction } from "@/lib/actions";
import { useRestaurantData } from "@/lib/client-data";
import { useFirebase } from '@/firebase/provider';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";


function BulkQRCodePrintLayout({ tables, settings }: { tables: Table[], settings: RestaurantSettings | null }) {
    if (!settings) return null;

    const restaurantLogoUrl = settings.printSettings?.restaurantPrintLogo;

    return (
        <div id="bulk-print-area">
            <div className="print-container">
                {tables.map(table => (
                    <div key={table.id} className="print-card">
                        {restaurantLogoUrl && (
                            <img src={restaurantLogoUrl} alt="Restaurant Logo" />
                        )}
                        <h3>Table {table.number}</h3>
                        <div className="qr-container">
                            <QRCode table={table} settings={settings} />
                        </div>
                        <p>Scan To Order</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TableList({ tables, settings, restaurantId, onFloorChange, onToggleDynamicQR, onResetQR, onShapeChange }: { tables: Table[], settings: RestaurantSettings | null, restaurantId: string, onFloorChange: (tableId: string, floor: string) => void, onToggleDynamicQR: (tableId: string, isDynamic: boolean) => void, onResetQR: (tableId: string) => void, onShapeChange: (tableId: string, shape: 'rectangle' | 'square' | 'circle') => void }) {
    const handleDelete = async (tableId: string) => {
        if (confirm('Are you sure you want to delete this table?')) {
            await deleteTableAction(tableId, restaurantId);
        }
    };

    const handlePrint = (tableId: string, tableNumber: string) => {
        const qrCodeWrapper = document.getElementById(`qr-code-wrapper-${tableId}`);
        if (!qrCodeWrapper) {
            console.error("QR code wrapper not found for printing.");
            return;
        }
        const qrCodeCanvas = qrCodeWrapper.querySelector('canvas');
        if (!qrCodeCanvas) {
            console.error('QR Code canvas not rendered yet. Please try again.');
            return;
        }
        const qrCodeDataUrl = qrCodeCanvas.toDataURL();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const restaurantLogoUrl = settings?.printSettings?.restaurantPrintLogo;
            const logoHtml = restaurantLogoUrl ? `<img src="${restaurantLogoUrl}" alt="Logo" style="max-height: 80px; margin-bottom: 20px;" />` : '';

            const printStyles = `
              @media print {
                  @page {
                      size: A4 portrait;
                      margin: 0;
                  }
                  body {
                      margin: 0;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      height: 100vh;
                      font-family: sans-serif;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                  }
                  .print-card {
                      width: 100%;
                      height: 100%;
                      border: none;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      text-align: center;
                      box-sizing: border-box;
                  }
                  .qr-container {
                      border: 1px solid #eee;
                      padding: 10px;
                      border-radius: 8px;
                  }
              }
            `;

            printWindow.document.write(`
                <html>
                  <head>
                    <title>Table ${tableNumber} QR Code</title>
                    <style>${printStyles}</style>
                  </head>
                  <body>
                      <div class="print-card">
                          ${logoHtml}
                          <h3 style="font-size: 2rem; font-weight: bold; margin: 0 0 15px 0;">Table ${tableNumber}</h3>
                          <div class="qr-container">
                            <img src="${qrCodeDataUrl}" style="width: 250px; height: 250px;" />
                          </div>
                          <p style="font-size: 1.2rem; font-weight: 600; margin-top: 15px;">Scan To Order</p>
                      </div>
                      <script>window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 500); }</script>
                  </body>
                </html>
              `);
            printWindow.document.close();
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => {
                const displayHref = `/display?tableId=${table.id}&restaurantId=${table.restaurantId}${table.isDynamicQR && table.qrToken ? `&token=${table.qrToken}` : ''}`;
                return (
                    <div key={table.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow border dark:border-gray-700 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Table {table.number}</h3>
                            <div className="flex gap-2">
                                <Link href={displayHref} target="_blank" title="Display QR Code">
                                    <Button variant="ghost" size="icon" className="text-blue-600 dark:text-blue-400 hover:bg-blue-50">
                                        <QrCode size={18} />
                                    </Button>
                                </Link>
                                <button
                                    onClick={() => handlePrint(table.id, table.number)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Print QR Code"
                                >
                                    <Printer size={18} className="text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                    onClick={() => handleDelete(table.id)}
                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete Table"
                                >
                                    <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                                </button>
                            </div>
                        </div>

                        {settings?.multiFloorEnabled && (settings.floors?.length ?? 0) > 0 && (
                            <div>
                                <Select
                                    value={table.floor || '__none__'}
                                    onValueChange={(value) => onFloorChange(table.id, value === '__none__' ? '' : value)}
                                >
                                    <SelectTrigger className="w-full text-xs h-9">
                                        <SelectValue placeholder="Assign to a floor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">No Floor</SelectItem>
                                        {settings.floors?.map(floor => (
                                            <SelectItem key={floor} value={floor}>{floor}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div>
                            <Label htmlFor={`shape-select-${table.id}`} className="text-xs font-medium">Table Shape</Label>
                            <Select
                                value={table.shape || 'square'}
                                onValueChange={(value: 'rectangle' | 'square' | 'circle') => onShapeChange(table.id, value)}
                            >
                                <SelectTrigger id={`shape-select-${table.id}`} className="w-full text-xs h-9 mt-1">
                                    <SelectValue placeholder="Table Shape" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="square">Square</SelectItem>
                                    <SelectItem value="rectangle">Rectangle</SelectItem>
                                    <SelectItem value="circle">Circle</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>


                        <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                            <Label htmlFor={`dynamic-qr-${table.id}`} className="text-sm font-medium flex-1 cursor-pointer">
                                Dynamic QR Code
                            </Label>
                            <div className="flex items-center gap-2">
                                {table.isDynamicQR && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 text-blue-600 border-blue-600/50 hover:bg-blue-50"
                                        title="Reset QR Token"
                                        onClick={() => onResetQR(table.id)}
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                )}
                                <Switch
                                    id={`dynamic-qr-${table.id}`}
                                    checked={table.isDynamicQR}
                                    onCheckedChange={(checked) => onToggleDynamicQR(table.id, checked)}
                                />
                            </div>
                        </div>

                        <div id={`qr-code-wrapper-${table.id}`} className="flex flex-col items-center justify-center py-4 bg-white dark:bg-gray-700 rounded-xl border dark:border-gray-600">
                            {settings ? (
                                <QRCode key={`${table.id}-${table.qrToken}`} table={table} settings={settings} />
                            ) : (
                                <div className="w-32 h-32 bg-gray-200 dark:bg-gray-600 animate-pulse rounded" />
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    );
}


export default function TableManagementPage() {
    const { user } = useAuth();
    const { getSettings, getMainBranch, getBranches, restaurantId } = useRestaurantData();
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [allBranches, setAllBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(undefined);
    const [tables, setTables] = useState<Table[]>([]);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [tableNumber, setTableNumber] = useState('');
    const [floorFilter, setFloorFilter] = useState('all');
    const formRef = useRef<HTMLFormElement>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';

    // Effect to determine the initial branch to display
    useEffect(() => {
        if (!user || !restaurantId) {
            return;
        }

        async function initializeBranch() {
            if (isGlobalAdmin) {
                const [fetchedBranches, main] = await Promise.all([getBranches(), getMainBranch()]);
                setAllBranches(fetchedBranches);
                // Set initial branch selection only if it's not already set
                if (!selectedBranchId) {
                    setSelectedBranchId(main?.id || fetchedBranches[0]?.id);
                }
            } else {
                setSelectedBranchId(user.branchId);
            }
        }
        initializeBranch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, restaurantId, isGlobalAdmin]);

    // Effect to fetch settings and subscribe to tables when a branch is selected
    useEffect(() => {
        if (!selectedBranchId || !restaurantId || !firestore) {
            setTables([]);
            setSettings(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        getSettings(selectedBranchId).then(setSettings);

        const tablesRef = collection(firestore, `restaurants/${restaurantId}/tables`);
        const q = query(tablesRef, where('branchId', '==', selectedBranchId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTables = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), restaurantId } as Table));
            fetchedTables.sort((a, b) => String(a.number).localeCompare(String(b.number), undefined, { numeric: true }));
            setTables(fetchedTables);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching tables in real-time:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBranchId, restaurantId, firestore]);


    const handleAddTable = async (formData: FormData) => {
        if (!selectedBranchId) {
            console.error("No branch ID found for creating a table.");
            return;
        }
        formData.append('branchId', selectedBranchId);
        formData.append('restaurantId', restaurantId);

        if (settings?.multiFloorEnabled && floorFilter !== 'all' && floorFilter !== '__none__') {
            formData.append('floor', floorFilter);
        }

        await createTableAction(formData);
        setTableNumber('');
        formRef.current?.reset();
    };

    const handleFloorChange = async (tableId: string, floor: string) => {
        await updateTableFloorAction(tableId, floor, restaurantId);
    };

    const handleToggleDynamicQR = async (tableId: string, isDynamic: boolean) => {
        if (!restaurantId) return;
        await toggleTableDynamicQRAction(tableId, isDynamic, restaurantId);
    };

    const handleResetQR = async (tableId: string) => {
        if (!restaurantId) return;
        const result = await resetTableQRTokenAction(tableId, restaurantId);
        if (result.success) {
            toast({
                title: "QR Code Reset",
                description: "A new dynamic QR code has been generated for this table.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.message || "Failed to reset QR code. Please try again.",
            });
        }
    };

    const handleShapeChange = async (tableId: string, shape: 'rectangle' | 'square' | 'circle') => {
        await updateTableShapeAction(tableId, shape, restaurantId);
        toast({
            title: "Table Shape Updated",
        });
    };

    const handleBulkPrint = () => {
        const printContentNode = printRef.current;
        if (!printContentNode) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write('<html><head><title>Table QR Codes</title>');

        // Inject all current stylesheets into the new window
        const styles = Array.from(document.styleSheets).map(sheet => {
            try {
                if (sheet.href) {
                    return `<link rel="stylesheet" href="${sheet.href}">`;
                }
                const rules = Array.from(sheet.cssRules).map(rule => rule.cssText).join('');
                return `<style>${rules}</style>`;
            } catch (e) {
                console.warn('Could not copy stylesheet for printing:', e);
                return '';
            }
        }).join('\n');

        const printSpecificStyles = `
            body, html {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            @page {
                size: 4in 6in; /* portrait */
                margin: 5mm;
            }
            .print-page {
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-template-rows: 1fr 1fr;
                gap: 5mm;
                width: calc(4in - 10mm);
                height: calc(6in - 10mm);
                page-break-inside: avoid;
            }
            .print-card {
                border: 1px solid #ccc;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                box-sizing: border-box;
                padding: 5px;
                overflow: hidden;
            }
            .print-card img[alt="Restaurant Logo"] {
                max-height: 20px !important;
                margin-bottom: 5px !important;
            }
            .print-card h3 {
                font-size: 0.7rem !important;
                font-weight: bold;
                margin: 0 0 5px 0 !important;
            }
            .print-card .qr-container {
                padding: 4px; 
                background-color: white; 
                border: 1px solid #eee; 
                border-radius: 4px;
            }
            .print-card .qr-container img {
                width: 60px !important;
                height: 60px !important;
            }
            .print-card p {
                font-size: 0.5rem !important;
                font-weight: 600;
                margin-top: 5px !important;
            }
        `;

        printWindow.document.head.innerHTML = styles + `<style>${printSpecificStyles}</style>`;

        const printContentClone = printContentNode.cloneNode(true) as HTMLElement;

        const originalCanvases = printContentNode.querySelectorAll('canvas');
        const clonedCanvases = printContentClone.querySelectorAll('canvas');

        originalCanvases.forEach((canvas, index) => {
            const dataUrl = canvas.toDataURL('image/png');
            const img = document.createElement('img');
            img.src = dataUrl;

            img.style.width = '60px';
            img.style.height = '60px';

            if (clonedCanvases[index] && clonedCanvases[index].parentNode) {
                clonedCanvases[index].parentNode.replaceChild(img, clonedCanvases[index]);
            }
        });

        const allCardsHtml = Array.from(printContentClone.querySelectorAll('.print-card')).map(card => card.outerHTML);
        const pages = [];
        for (let i = 0; i < allCardsHtml.length; i += 4) { // 4 cards per page
            pages.push(allCardsHtml.slice(i, i + 4));
        }

        const pagesHtml = pages.map(pageCards =>
            `<div class="print-page">${pageCards.join('')}</div>`
        ).join('');

        printWindow.document.write('</head><body>');
        printWindow.document.write(pagesHtml);
        printWindow.document.write(`<script>window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 500); }</script>`);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
    };

    const filteredTables = floorFilter === 'all'
        ? tables
        : tables.filter(table => {
            if (floorFilter === '__none__') {
                return !table.floor || table.floor === '';
            }
            return table.floor === floorFilter;
        });

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <>
            <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
                <div ref={printRef}>
                    <BulkQRCodePrintLayout tables={filteredTables} settings={settings} />
                </div>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="font-headline">Table Management</CardTitle>
                                <CardDescription>Add or manage tables for a branch.</CardDescription>
                            </div>
                            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                                {isGlobalAdmin && (
                                    <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select a branch" /></SelectTrigger>
                                        <SelectContent>{allBranches.map(branch => (<SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>))}</SelectContent>
                                    </Select>
                                )}
                                {settings?.multiFloorEnabled && (
                                    <Select value={floorFilter} onValueChange={setFloorFilter}>
                                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by floor" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Floors</SelectItem>
                                            <SelectItem value="__none__">No Floor</SelectItem>
                                            {settings.floors?.map(floor => (<SelectItem key={floor} value={floor}>{floor}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row items-end gap-4 justify-between mt-6">
                            <form action={handleAddTable} ref={formRef} className="flex items-end gap-2 flex-grow sm:flex-grow-0">
                                <div className="flex-grow">
                                    <Label htmlFor="tableNumberInput" className="text-sm font-medium">New Table Number</Label>
                                    <Input id="tableNumberInput" name="tableNumber" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="e.g., 10 or F1" className="mt-1" />
                                </div>
                                <Button type="submit">Add Table</Button>
                            </form>
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <Button onClick={handleBulkPrint} variant="outline" className="w-full sm:w-auto">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print All QR Codes
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {isLoading ? (
                    <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                        <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredTables.length > 0 ? (
                    <TableList
                        tables={filteredTables}
                        settings={settings}
                        restaurantId={restaurantId || ''}
                        onFloorChange={handleFloorChange}
                        onToggleDynamicQR={handleToggleDynamicQR}
                        onResetQR={handleResetQR}
                        onShapeChange={handleShapeChange}
                    />
                ) : (
                    <Card>
                        <CardContent className="p-12 text-center text-muted-foreground">
                            No tables found for the selected branch/floor.
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

    
