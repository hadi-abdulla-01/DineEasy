import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChefHat, Clock, HelpCircle, XCircle } from "lucide-react";

type StatusInfo = {
  label: string;
  color: string;
  icon: React.ReactNode;
};

const statusMap: Record<OrderStatus, StatusInfo> = {
  received: {
    label: "Taken",
    color: "bg-blue-500",
    icon: <Clock className="h-3 w-3" />,
  },
  preparing: {
    label: "Preparing",
    color: "bg-yellow-500",
    icon: <ChefHat className="h-3 w-3" />,
  },
  ready: {
    label: "Ready",
    color: "bg-orange-500",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  completed: {
    label: "Completed",
    color: "bg-green-500",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500",
    icon: <XCircle className="h-3 w-3" />,
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, color, icon } = statusMap[status] || {
    label: "Unknown",
    color: "bg-gray-500",
    icon: <HelpCircle className="h-3 w-3" />,
  };

  return (
    <Badge
      className={cn(
        "flex w-fit items-center gap-1.5 border-transparent text-white",
        color
      )}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </Badge>
  );
}
