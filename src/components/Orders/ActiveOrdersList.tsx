import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, Clock, ChefHat, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Json } from "@/integrations/supabase/types";
import OrderDetailsDialog from "./OrderDetailsDialog";
import { Button } from "@/components/ui/button";

interface OrderItem {
  name: string;
  quantity: number;
  notes?: string[];
}

interface ActiveOrder {
  id: string;
  source: string;
  status: "new" | "preparing" | "ready";
  items: OrderItem[];
  created_at: string;
}

const ActiveOrdersList = () => {
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ActiveOrder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchActiveOrders = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.restaurant_id) return;

      const { data: orders } = await supabase
        .from("kitchen_orders")
        .select("*")
        .eq("restaurant_id", profile.restaurant_id)
        .not("status", "eq", "completed")
        .order("created_at", { ascending: false });

      if (orders) {
        const formattedOrders: ActiveOrder[] = orders.map(order => ({
          id: order.id,
          source: order.source,
          status: order.status as "new" | "preparing" | "ready",
          items: parseOrderItems(order.items),
          created_at: order.created_at
        }));
        
        setActiveOrders(formattedOrders);
      }
    };

    fetchActiveOrders();

    function parseOrderItems(items: Json): OrderItem[] {
      if (!items) return [];
      
      try {
        if (Array.isArray(items)) {
          return items.map(item => {
            const itemObj = item as Record<string, any>;
            return {
              name: typeof itemObj.name === 'string' ? itemObj.name : "Unknown Item",
              quantity: typeof itemObj.quantity === 'number' ? itemObj.quantity : 1,
              notes: Array.isArray(itemObj.notes) ? itemObj.notes : []
            };
          });
        }
        
        const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
        
        if (Array.isArray(parsedItems)) {
          return parsedItems.map(item => {
            const itemObj = item as Record<string, any>;
            return {
              name: typeof itemObj.name === 'string' ? itemObj.name : "Unknown Item",
              quantity: typeof itemObj.quantity === 'number' ? itemObj.quantity : 1,
              notes: Array.isArray(itemObj.notes) ? itemObj.notes : []
            };
          });
        }
        
        return [];
      } catch (error) {
        console.error("Error parsing order items:", error);
        return [];
      }
    }

    const channel = supabase
      .channel("kitchen-orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kitchen_orders",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new;
            const formattedOrder: ActiveOrder = {
              id: newOrder.id,
              source: newOrder.source,
              status: newOrder.status as "new" | "preparing" | "ready",
              items: parseOrderItems(newOrder.items),
              created_at: newOrder.created_at
            };
            
            setActiveOrders((prev) => [formattedOrder, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new;
            
            setActiveOrders((prev) =>
              prev.map((order) =>
                order.id === updatedOrder.id 
                  ? {
                      ...order,
                      status: updatedOrder.status as "new" | "preparing" | "ready",
                      items: parseOrderItems(updatedOrder.items)
                    } 
                  : order
              )
            );
            
            if (updatedOrder.status === "ready") {
              toast({
                title: "Order Ready!",
                description: `Order from ${updatedOrder.source} is ready for pickup`,
              });
              const audio = new Audio("/notification.mp3");
              audio.play().catch(console.error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "preparing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "ready":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Clock className="h-4 w-4" />;
      case "preparing":
        return <ChefHat className="h-4 w-4" />;
      case "ready":
        return <Check className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleViewOrder = (order: ActiveOrder) => {
    setSelectedOrder(order);
  };

  const handleCloseDialog = () => {
    setSelectedOrder(null);
  };

  return (
    <div className="h-[30vh] overflow-auto p-2">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {activeOrders.map((order) => (
          <Card 
            key={order.id} 
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewOrder(order)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{order.source}</h3>
              <Badge 
                variant="secondary" 
                className={`flex items-center gap-1 ${getStatusColor(order.status)}`}
              >
                {getStatusIcon(order.status)}
                {order.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </div>
              <ul className="text-sm space-y-1">
                {order.items.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                  </li>
                ))}
              </ul>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewOrder(order);
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <OrderDetailsDialog
        isOpen={selectedOrder !== null}
        onClose={handleCloseDialog}
        order={selectedOrder}
        onEditOrder={() => {
          handleCloseDialog();
        }}
      />
    </div>
  );
};

export default ActiveOrdersList;
