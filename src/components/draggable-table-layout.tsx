

'use client';
import { getTables, getActiveOrders } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Users, XCircle } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import type { Table, Order } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { DndContext, useDraggable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { updateTablePositionAction, updateTableStatusAction } from "@/lib/actions";
import { Button } from "./ui/button";

type TableWithOrders = Table & {
  orders: Order[];
  isOccupied: boolean;
};

type Position = { x: number; y: number };
type TablePosition = TableWithOrders & { pos: Position };

function DraggableTable({ table, onCancel }: { table: TablePosition, onCancel: (tableId: string) => void }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: table.id });
    
    const style: CSSProperties = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        position: 'absolute',
        left: table.pos.x,
        top: table.pos.y,
    } : {
        position: 'absolute',
        left: table.pos.x,
        top: table.pos.y,
    };

    return (
        <div ref={setNodeRef} style={style} className="w-32 group/table">
            <Link 
              href={`/admin/tables/${table.id}/order`} 
              className="flex flex-col items-center gap-2 group"
            >
                <div
                    className={cn(
                        "relative flex items-center justify-center h-20 w-full rounded-lg border-4 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg",
                        table.isOccupied ? "bg-red-500/20 border-red-500" : "bg-green-500/20 border-green-500"
                    )}
                >
                    <span 
                      {...listeners} 
                      {...attributes} 
                      className="font-headline text-3xl font-bold text-foreground cursor-grab active:cursor-grabbing p-4"
                      onClick={(e) => e.preventDefault()} // Prevent link navigation when grabbing handle
                    >
                      {table.number}
                    </span>
                    {table.isOccupied && (
                        <div className="absolute -top-2 -right-2 bg-background p-1 rounded-full shadow">
                            <Users className="h-5 w-5 text-foreground" />
                        </div>
                    )}
                </div>
                <div className="text-center">
                    <p className="font-semibold text-sm">{table.isOccupied ? 'Occupied' : 'Available'}</p>
                    {table.isOccupied && table.orders.length > 0 ? (
                        <p className="text-xs text-muted-foreground">{table.orders.reduce((acc, order) => acc + order.items.length, 0)} items</p>
                    ) : (
                        <p className="text-xs text-muted-foreground">&nbsp;</p>
                    )}
                </div>
            </Link>
            {table.isOccupied && (
                <form action={() => onCancel(table.id)} className="absolute top-0 right-0 opacity-0 group-hover/table:opacity-100 transition-opacity">
                    <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                        className="h-7 px-2 rounded-full"
                        onClick={(e) => {
                            e.preventDefault(); 
                            if(confirm(`Are you sure you want to cancel all orders for Table ${table.number}? This cannot be undone.`)) {
                                onCancel(table.id)
                            }
                        }}
                    >
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancel
                    </Button>
                </form>
            )}
        </div>
    );
}


export default function DraggableTableLayout({ branchId }: { branchId?: string }) {
  const [tables, setTables] = useState<TablePosition[]>([]);
  const { toast } = useToast();
  const previousOrderIds = useState(new Set<string>())[0];
  const [isDragging, setIsDragging] = useState(false);

  const fetchData = async () => {
    if (!branchId) return;
    const fetchedTables = await getTables(branchId);
    const allActiveOrders = await getActiveOrders(branchId);

    const currentOrderIds = new Set(allActiveOrders.map(o => o.id));

    if (previousOrderIds.size > 0) {
      currentOrderIds.forEach(orderId => {
        if (!previousOrderIds.has(orderId)) {
          const newOrder = allActiveOrders.find(o => o.id === orderId);
          toast({
            title: "New Order Received!",
            description: `A new ${newOrder?.orderType} order was just placed.`,
          });
        }
      });
    }

    allActiveOrders.forEach(o => previousOrderIds.add(o.id));

    setTables(currentTables => {
        const updatedTables = fetchedTables.map((table, index) => {
          const ordersForTable = allActiveOrders.filter(order => order.tableId === table.id);
          const isOccupiedByOrder = ordersForTable.length > 0;
          
          const existingTable = currentTables.find(t => t.id === table.id);
          
          const defaultPosition = { x: (index % 5) * 160 + 20, y: Math.floor(index / 5) * 200 + 20 };
          const currentPosition = existingTable?.pos || table.position || defaultPosition;

          return {
            ...table,
            orders: ordersForTable,
            isOccupied: isOccupiedByOrder || table.status === 'occupied',
            pos: currentPosition
          };
        });
        
        return updatedTables;
    });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);
  
  function handleDragStart(event: DragStartEvent) {
    setIsDragging(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;
  
    if (delta.x === 0 && delta.y === 0) {
      setIsDragging(false);
      return; 
    }
  
    const tableIdToMove = active.id as string;
  
    setTables(currentTables =>
      currentTables.map(t =>
        t.id === tableIdToMove ? { ...t, pos: { x: t.pos.x + delta.x, y: t.pos.y + delta.y } } : t
      )
    );
  
    const finalTable = tables.find(t => t.id === tableIdToMove);
    if(finalTable) {
        const newPos = {
            x: finalTable.pos.x + delta.x,
            y: finalTable.pos.y + delta.y
        }
        updateTablePositionAction(tableIdToMove, newPos);
    }
    setIsDragging(false);
  }

  const handleCancelOrder = async (tableId: string) => {
    await updateTableStatusAction(tableId, 'available');
    toast({
        title: "Orders Cancelled",
        description: `All active orders for the table have been cancelled.`,
    });
    fetchData(); // Immediately refetch data
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="relative h-[80vh] w-full rounded-lg border border-dashed bg-muted/50 overflow-hidden">
          {tables.map((table) => (
            <DraggableTable key={table.id} table={table} onCancel={handleCancelOrder} />
          ))}
        </div>
    </DndContext>
  );
}
