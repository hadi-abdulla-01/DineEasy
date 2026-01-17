

'use client';
import { createTableAction, updateTableFloorAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef, useCallback } from "react";
import type { Table, RestaurantSettings, Branch } from "@/lib/definitions";
import { Printer, Trash2 } from "lucide-react";
import { QRCode } from "@/components/qr-code";
import { useAuth } from "../auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteTableAction } from "@/lib/actions";
import { useRestaurantData } from "@/lib/client-data";


function TableList({ tables, settings, restaurantId, onDelete, onFloorChange }: { tables: Table[], settings: RestaurantSettings | null, restaurantId: string, onDelete: (tableId: string) => void, onFloorChange: (tableId: string, floor: string) => void }) {
  const handleDelete = async (tableId: string) => {
    if (confirm('Are you sure you want to delete this table?')) {
      await deleteTableAction(tableId, restaurantId);
      onDelete(tableId); // Trigger refetch
    }
  };

  const handlePrint = (tableId: string, tableNumber: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const qrCodeWrapper = document.getElementById(`qr-code-wrapper-${tableId}`);
      if (!qrCodeWrapper) {
        printWindow.document.write('QR Code container not found.');
        printWindow.document.close();
        return;
      }

      // A small delay is needed to ensure canvas is rendered before we try to grab it.
      setTimeout(() => {
        const qrCodeCanvas = qrCodeWrapper.querySelector('canvas');
        const qrCodeDataUrl = qrCodeCanvas?.toDataURL();

        printWindow.document.write(`
              <html>
                <head>
                  <title>Table ${tableNumber} QR Code</title>
                  <style>
                    body {
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      height: 100vh;
                      margin: 0;
                      font-family: sans-serif;
                    }
                    .qr-container {
                      text-align: center;
                    }
                    img {
                      width: 300px;
                      height: 300px;
                    }
                    h1 {
                      margin-bottom: 20px;
                      font-size: 2rem;
                    }
                    p {
                      margin-top: 10px;
                      font-size: 1.2rem;
                      color: #666;
                    }
                  </style>
                </head>
                <body>
                  <div class="qr-container">
                    <h1>Table ${tableNumber}</h1>
                    ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" />` : 'QR Code not found'}
                    <p>Scan to order</p>
                  </div>
                  <script>
                    window.onload = () => {
                      window.print();
                      window.close();
                    }
                  </script>
                </body>
              </html>
            `);
        printWindow.document.close();
      }, 100);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tables.map((table) => (
        <div key={table.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow border dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Table {table.number}</h3>
            <div className="flex gap-2">
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

          <div id={`qr-code-wrapper-${table.id}`} className="flex flex-col items-center justify-center py-4 bg-white dark:bg-gray-700 rounded-xl border dark:border-gray-600">
            {settings ? (
              <>
                <QRCode tableId={table.id} settings={settings} />
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Scan to order</p>
              </>
            ) : (
              <div className="w-32 h-32 bg-gray-200 dark:bg-gray-600 animate-pulse rounded" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TableManagementPage() {
  const { user } = useAuth();
  const { getTables, getSettings, getMainBranch, getBranches, restaurantId } = useRestaurantData();
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(user?.branchId);
  const [tables, setTables] = useState<Table[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [mainBranch, setMainBranch] = useState<Branch | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [floorFilter, setFloorFilter] = useState('all');
  const formRef = useRef<HTMLFormElement>(null);

  const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';

  const fetchBranchData = useCallback(async () => {
    if (selectedBranchId) {
      const [tables, settings] = await Promise.all([
        getTables(selectedBranchId),
        getSettings(selectedBranchId)
      ]);
      setTables(tables);
      setSettings(settings);
    }
  }, [selectedBranchId, getTables, getSettings]);

  useEffect(() => {
    async function fetchInitialData() {
      if (!user) return;

      const fetchedMainBranch = await getMainBranch();
      setMainBranch(fetchedMainBranch);

      if (isGlobalAdmin) {
        if (!selectedBranchId && fetchedMainBranch) {
          setSelectedBranchId(fetchedMainBranch.id);
        }
        const branches = await getBranches();
        setAllBranches(branches);
      } else {
        if (selectedBranchId !== user.branchId) {
          setSelectedBranchId(user.branchId);
        }
      }
    }
    fetchInitialData();
  }, [user, isGlobalAdmin, selectedBranchId, getMainBranch, getBranches]);

  useEffect(() => {
    fetchBranchData();

    const interval = setInterval(fetchBranchData, 5000);
    return () => clearInterval(interval);

  }, [fetchBranchData]);

  const handleAddTable = async (formData: FormData) => {
    if (!selectedBranchId) {
      console.error("No branch ID found for creating a table.");
      return;
    }
    formData.append('branchId', selectedBranchId);
    formData.append('restaurantId', restaurantId);
    
    // If a floor is selected in the filter, pre-assign the new table to it
    if(settings?.multiFloorEnabled && floorFilter !== 'all' && floorFilter !== '__none__') {
      formData.append('floor', floorFilter);
    }

    await createTableAction(formData);
    // Refetch tables after adding a new one
    await fetchBranchData();
    setTableNumber('');
    formRef.current?.reset();
  };
  
  const handleFloorChange = async (tableId: string, floor: string) => {
    await updateTableFloorAction(tableId, floor, restaurantId);
    fetchBranchData();
  };

  const handleDelete = async (tableId: string) => {
    await deleteTableAction(tableId, restaurantId);
    await fetchBranchData();
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
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold dark:text-gray-100">Table Management</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add or manage tables for a branch.</p>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            {isGlobalAdmin && (
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {allBranches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
             {settings?.multiFloorEnabled && (
              <Select value={floorFilter} onValueChange={setFloorFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors</SelectItem>
                  <SelectItem value="__none__">No Floor</SelectItem>
                  {settings.floors?.map(floor => (
                    <SelectItem key={floor} value={floor}>{floor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <form action={handleAddTable} ref={formRef} className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-2 sm:inline sm:mr-4 dark:text-gray-300">Table Number</label>
            <input
              type="text"
              name="tableNumber"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g., 10 or F1"
              className="w-full sm:w-48 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-2.5 bg-[#cb1e1d] text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Add Table
          </button>
        </form>
      </div>

      <TableList tables={filteredTables} settings={settings} restaurantId={restaurantId} onDelete={handleDelete} onFloorChange={handleFloorChange} />
    </div>
  );
}
