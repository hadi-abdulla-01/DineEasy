

'use client';
import { cn } from "@/lib/utils";
import { Users, MoreVertical, FileText, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState, type CSSProperties, useRef, useMemo } from "react";
import type { Table, Order } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { DndContext, useDraggable, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { updateTablePositionAction, updateOrderStatusAction } from "@/lib/actions";
import { Button } from "./ui/button";
import { useRestaurantData } from '@/lib/client-data';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
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
    onClick
}: {
    table: TablePosition,
    onCancelOrder: (orderId: string) => void,
    onClick: (table: TableWithOrders, orderId?: string) => void,
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
                 <DropdownMenuTrigger asChild>
                    <div className="flex flex-col items-center gap-2 group cursor-pointer">
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
                                onClick={(e) => { e.stopPropagation(); onClick(table) }}
                            >
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
                            <DropdownMenuItem key={order.id} onSelect={(e) => { e.preventDefault(); onClick(table, order.id) }} className="justify-between cursor-pointer">
                                <div>
                                    <p className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/>{order.customerName}</p>
                                    <p className="text-xs text-muted-foreground pl-6">{order.invoiceNumber ? `Inv #${order.invoiceNumber}` : `ID: ...${order.id.slice(-4)}`}</p>
                                </div>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={(e) => handleCancelClick(e, order.id)}>
                                    <Trash2 className="h-4 w-4 mr-1"/> Cancel
                                </Button>
                            </DropdownMenuItem>
                         ))}
                         <DropdownMenuSeparator />
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
    const { toast } = useToast();
    const router = useRouter();
    const previousOrderIds = useRef(new Set<string>());
    const [isDragging, setIsDragging] = useState(false);
    const { getTables, getActiveOrders, restaurantId } = useRestaurantData();

    const parentRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        if (!branchId || !restaurantId) return;
        const fetchedTables = await getTables(branchId);
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
    };

    useEffect(() => {
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

    function handleDragStart(event: DragStartEvent) {
        setIsDragging(true);
    }

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
        setTimeout(() => setIsDragging(false), 50);
    }

    const handleCancelOrder = async (orderId: string) => {
        const formData = new FormData();
        formData.append('status', 'cancelled');
        formData.append('restaurantId', restaurantId);

        await updateOrderStatusAction(orderId, formData);
        
        toast({
            title: "Order Cancelled",
            description: `The selected order has been cancelled.`,
        });
        fetchData();
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


    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} sensors={sensors} modifiers={[restrictToParentElement]}>
            <div ref={parentRef} className="relative h-[80vh] w-full rounded-lg border border-dashed bg-muted/50 overflow-hidden">
                {filteredTables.map((table) => (
                    <DraggableTable 
                        key={table.id} 
                        table={table} 
                        onCancelOrder={handleCancelOrder}
                        onClick={(clickedTable, orderId) => {
                            if (isDragging) return;
                            if (!clickedTable.isOccupied || onTableSelect) {
                                handleTableClick(clickedTable, orderId);
                            }
                        }}
                    />
                ))}
                 {filteredTables.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-muted-foreground">No tables found for this floor.</p>
                    </div>
                )}
            </div>
        </DndContext>
    );
}
