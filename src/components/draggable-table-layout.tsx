
'use client';
import { cn } from "@/lib/utils";
import { Users, MoreVertical, FileText, PlusCircle, Trash2, Move, LoaderCircle } from "lucide-react";
import { useEffect, useState, type CSSProperties, useRef, useMemo } from "react";
import type { Table, Order } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { DndContext, useDraggable, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { updateTablePositionAction, updateOrderStatusAction } from "@/lib/actions";
import { Button } from "./ui/button";
import { useRestaurantData } from '@/lib/client-data';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChangeTableDialog } from "./change-table-dialog";
import React from "react";

type TableWithOrders = Table & {
  orders: Order[];
  isOccupied: boolean;
};

type Position = { x: number; y: number };
type TablePosition = TableWithOrders & { pos: Position };

type DraggableTableLayoutProps = {
  branchId?: string;
  floorFilter?: string;
  onTableSelect?: (table: TableWithOrders) => void;
};


function DraggableTable({
    table,
    onCancelOrder,
    onClick,
    onMoveOrder
}: {
    table: TablePosition,
    onCancelOrder: (orderId: string) => void,
    onClick: (table: TableWithOrders, orderId?: string) => void,
    onMoveOrder: (order: Order) => void
}) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: table.id });
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

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
    
    const handleCancelClick = (e: React.MouseEvent, orderId: string) => {
        e.stopPropagation();
        setOrderToCancel(orderId);
        setIsAlertOpen(true);
    };

    const confirmCancel = () => {
        if(orderToCancel) {
            onCancelOrder(orderToCancel);
        }
        setIsAlertOpen(false);
        setOrderToCancel(null);
    };

    return (
        <>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will cancel the selected order. This cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setOrderToCancel(null)}>Back</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmCancel} className="bg-destructive hover:bg-destructive/90">
                        Yes, Cancel Order
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>


        <div ref={setNodeRef} style={style} className="w-32 group/table">
            <DropdownMenu>
                 <DropdownMenuTrigger
                    asChild
                    onClick={(e) => {
                      if (!table.isOccupied) {
                        e.preventDefault();
                        onClick(table);
                      }
                    }}
                 >
                    <div className="flex flex-col items-center gap-2 group cursor-pointer">
                        <div
                            className={cn(
                                "relative flex items-center justify-center h-20 w-full rounded-lg border-4 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg",
                                table.isOccupied ? "bg-red-500/20 border-red-500" : "bg-green-500/20 border-green-500"
                            )}
                        >
                            <span className="font-headline text-3xl font-bold text-foreground p-4 select-none">
                                {table.number}
                            </span>
                             {table.isOccupied && (
                                <>
                                <div className="absolute -top-3 -right-3 bg-background p-1 rounded-full shadow-md">
                                    <Users className="h-5 w-5 text-foreground" />
                                </div>
                                <div className="absolute -top-2 -left-2 bg-background p-1 rounded-full shadow-md">
                                    <MoreVertical className="h-5 w-5 text-muted-foreground"/>
                                </div>
                                </>
                            )}
                             <div {...listeners} {...attributes} className="absolute bottom-0 right-0 p-1 cursor-grab active:cursor-grabbing opacity-25 hover:opacity-100 transition-opacity">
                                <Move className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-sm">{table.isOccupied ? 'Occupied' : 'Available'}</p>
                            {table.isOccupied && table.orders.length > 0 ? (
                                <p className="text-xs text-muted-foreground">{table.orders.length} order(s)</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">&nbsp;</p>
                            )}
                        </div>
                    </div>
                </DropdownMenuTrigger>

                 {table.isOccupied && (
                     <DropdownMenuContent onClick={(e) => e.stopPropagation()} className="w-64">
                         {table.orders.map(order => (
                            <DropdownMenuSub key={order.id}>
                                <DropdownMenuSubTrigger>
                                    <FileText className="h-4 w-4 mr-2 text-muted-foreground"/>
                                    <span>Invoice #{order.invoiceNumber || order.id.slice(-6)}</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem onSelect={() => onClick(table, order.id)}>
                                            <PlusCircle className="h-4 w-4 mr-2"/>
                                            Add Items
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onMoveOrder(order)}>
                                            <Move className="h-4 w-4 mr-2"/>
                                            Move Table
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleCancelClick(e, order.id);}} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <Trash2 className="h-4 w-4 mr-2"/>
                                            Cancel Order
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                         ))}
                          {table.orders.length > 0 && <DropdownMenuSeparator />}
                         <DropdownMenuItem onSelect={() => onClick(table)} className="cursor-pointer">
                            <PlusCircle className="h-4 w-4 mr-2"/>
                            Start New Order
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                 )}
            </DropdownMenu>
        </div>
        </>
    );
}


export default function DraggableTableLayout({ branchId, floorFilter, onTableSelect }: DraggableTableLayoutProps) {
    const [tables, setTables] = useState<TablePosition[]>([]);
    const [allTablesInBranch, setAllTablesInBranch] = useState<Table[]>([]);
    const [orderToMove, setOrderToMove] = useState<Order | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const previousOrderIds = useRef(new Set<string>());
    const { getTables, getActiveOrders, restaurantId } = useRestaurantData();
    const [isLoading, setIsLoading] = useState(true);

    const parentRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        if (!branchId || !restaurantId) {
            setIsLoading(false);
            return;
        }
        const fetchedTables = await getTables(branchId);
        setAllTablesInBranch(fetchedTables);
        const allActiveOrders = await getActiveOrders(branchId);

        const currentOrderIds = new Set(allActiveOrders.map(o => o.id));

        if (previousOrderIds.current.size > 0) {
            currentOrderIds.forEach(orderId => {
                if (!previousOrderIds.current.has(orderId)) {
                    const newOrder = allActiveOrders.find(o => o.id === orderId);
                    toast({
                        title: "New Order Received!",
                        description: `A new ${newOrder?.orderType} order was just placed.`,
                    });
                }
            });
        }

        previousOrderIds.current = currentOrderIds;

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
        setIsLoading(false);
    };

    useEffect(() => {
        setIsLoading(true);
        fetchData();
        const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branchId, restaurantId]);

    const handleTableClick = (table: TableWithOrders, orderId?: string) => {
        if (onTableSelect) {
            onTableSelect(table);
            return;
        }

        let url = `/admin/tables/${table.id}/order`;
        if (orderId) {
            url += `?add_items=true&order_id=${orderId}`;
        }
        router.push(url);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 5,
            },
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, delta } = event;

        const tableIdToMove = active.id as string;

        setTables(currentTables =>
            currentTables.map(t =>
                t.id === tableIdToMove ? { ...t, pos: { x: t.pos.x + delta.x, y: t.pos.y + delta.y } } : t
            )
        );

        const finalTable = tables.find(t => t.id === tableIdToMove);
        if (finalTable) {
            const newPos = {
                x: finalTable.pos.x + delta.x,
                y: finalTable.pos.y + delta.y
            }
            updateTablePositionAction(tableIdToMove, newPos, restaurantId);
        }
    }

    const handleCancelOrder = async (orderId: string) => {
        const formData = new FormData();
        formData.append('orderId', orderId);
        formData.append('status', 'cancelled');
        formData.append('restaurantId', restaurantId);

        await updateOrderStatusAction(formData);
        
        toast({
            title: "Order Cancelled",
            description: `The selected order has been cancelled.`,
        });
        fetchData();
    };

    const handleMoveOrder = (order: Order) => {
        const tableForOrder = tables.find(t => t.id === order.tableId);
        setOrderToMove({ ...order, table: tableForOrder });
    };

    const filteredTables = useMemo(() => {
        if (!floorFilter || floorFilter === 'all') {
            return tables;
        }
        if (floorFilter === '__none__') {
            return tables.filter(table => !table.floor || table.floor === '');
        }
        return tables.filter(table => table.floor === floorFilter);
    }, [tables, floorFilter]);

    if (isLoading) {
        return (
            <div className="relative h-[80vh] w-full rounded-lg border border-dashed bg-muted/50 overflow-hidden flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading tables...</p>
                </div>
            </div>
        );
    }


    return (
        <DndContext onDragEnd={handleDragEnd} sensors={sensors} modifiers={[restrictToParentElement]}>
            <div ref={parentRef} className="relative h-[80vh] w-full rounded-lg border border-dashed bg-muted/50 overflow-hidden">
                {filteredTables.map((table) => (
                    <DraggableTable 
                        key={table.id} 
                        table={table} 
                        onCancelOrder={handleCancelOrder}
                        onMoveOrder={handleMoveOrder}
                        onClick={handleTableClick}
                    />
                ))}
                 {filteredTables.length === 0 && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-muted-foreground">No tables found for this floor.</p>
                    </div>
                )}
            </div>
            {orderToMove && (
                <ChangeTableDialog
                    order={orderToMove}
                    tables={allTablesInBranch}
                    isOpen={!!orderToMove}
                    onOpenChange={(isOpen) => { if (!isOpen) setOrderToMove(null); }}
                    restaurantId={restaurantId}
                    onTableChanged={fetchData}
                />
            )}
        </DndContext>
    );
}
