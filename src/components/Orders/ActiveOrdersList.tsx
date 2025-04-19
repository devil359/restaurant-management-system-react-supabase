
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, Clock, ChefHat } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ActiveOrder {
  id: string;
  source: string;
  status: "new" | "preparing" | "ready";
  items: {
    name: string;
    quantity: number;
  }[];
  created_at: string;
}

const ActiveOrdersList = () => {
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch initial active orders
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
        setActiveOrders(orders as ActiveOrder[]);
      }
    };

    fetchActiveOrders();

    // Subscribe to real-time updates
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
            setActiveOrders((prev) => [payload.new as ActiveOrder, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setActiveOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id ? payload.new as ActiveOrder : order
              )
            );
            
            // Show toast notification when order is ready
            if (payload.new.status === "ready") {
              toast({
                title: "Order Ready!",
                description: `Order from ${payload.new.source} is ready for pickup`,
              });
              // Play notification sound
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

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {activeOrders.map((order) => (
        <Card key={order.id} className="p-4 hover:shadow-md transition-shadow">
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
                <li key={index}>
                  {item.quantity}x {item.name}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ActiveOrdersList;
