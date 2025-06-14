import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrderTicket from "./OrderTicket";
import OrdersColumn from "./OrdersColumn";
import DateFilter from "./DateFilter";
import { filterOrdersByDateRange } from "@/components/Staff/utilities/staffUtils";
import { Json } from "@/integrations/supabase/types";

export interface KitchenOrder {
  id: string;
  source: string;
  status: "new" | "preparing" | "ready";
  created_at: string;
  items: {
    name: string;
    quantity: number;
    notes?: string[];
  }[];
}

// --- Modern UI: glass card helpers ---
function GlassyCard({ children, className = "" }) {
  // semi-transparent white/blurred bg, glass effect
  return (
    <div className={`rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md shadow-xl border border-white/30 dark:border-white/5 ${className}`}>
      {children}
    </div>
  );
}

const KitchenDisplay = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<KitchenOrder[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dateFilter, setDateFilter] = useState("today");
  const { toast } = useToast();

  // --- Notification sound (same as before) ---
  const [notification] = useState(() => {
    const audio = new Audio();
    try {
      audio.src = "/notification.mp3";
      audio.addEventListener("error", (e) => {
        // fallback: silent error
      });
    } catch {}
    return audio;
  });

  useEffect(() => {
    setFilteredOrders(filterOrdersByDateRange(orders, dateFilter));
  }, [orders, dateFilter]);

  useEffect(() => {
    // Fetch initial orders
    const fetchOrders = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.restaurant_id) return;

      const { data } = await supabase
        .from("kitchen_orders")
        .select("*")
        .eq("restaurant_id", profile.restaurant_id)
        .order("created_at", { ascending: false });

      if (data) {
        const typedOrders = data.map(order => {
          const itemsArray = Array.isArray(order.items) ? order.items : [];
          const transformedItems = itemsArray.map((item: any) => ({
            name: typeof item.name === 'string' ? item.name : 'Unknown Item',
            quantity: typeof item.quantity === 'number' ? item.quantity : 1,
            notes: Array.isArray(item.notes) ? item.notes : undefined
          }));

          return {
            id: order.id,
            source: order.source,
            status: order.status as KitchenOrder["status"],
            created_at: order.created_at,
            items: transformedItems
          } as KitchenOrder;
        });

        setOrders(typedOrders);
      }
    };

    fetchOrders();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kitchen_orders",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrderData = payload.new;
            const itemsArray = Array.isArray(newOrderData.items)
              ? newOrderData.items
              : [];

            const transformedItems = itemsArray.map((item: any) => ({
              name: typeof item.name === "string" ? item.name : "Unknown Item",
              quantity:
                typeof item.quantity === "number" ? item.quantity : 1,
              notes: Array.isArray(item.notes) ? item.notes : undefined,
            }));

            const newOrder: KitchenOrder = {
              id: newOrderData.id,
              source: newOrderData.source,
              status: newOrderData.status as KitchenOrder["status"],
              created_at: newOrderData.created_at,
              items: transformedItems,
            };

            setOrders((prev) => [newOrder, ...prev]);

            if (soundEnabled) {
              try {
                notification.play().catch((err) => {
                  // ...ignore
                });
                toast({
                  title: "New Order",
                  description: `New order from ${newOrder.source}`,
                });
              } catch {
                toast({
                  title: "New Order",
                  description: `New order from ${newOrder.source}`,
                });
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedOrderData = payload.new;
            const itemsArray = Array.isArray(updatedOrderData.items)
              ? updatedOrderData.items
              : [];

            const transformedItems = itemsArray.map((item: any) => ({
              name: typeof item.name === "string" ? item.name : "Unknown Item",
              quantity:
                typeof item.quantity === "number" ? item.quantity : 1,
              notes: Array.isArray(item.notes) ? item.notes : undefined,
            }));

            const updatedOrder: KitchenOrder = {
              id: updatedOrderData.id,
              source: updatedOrderData.source,
              status: updatedOrderData.status as KitchenOrder["status"],
              created_at: updatedOrderData.created_at,
              items: transformedItems,
            };

            setOrders((prev) =>
              prev.map((order) =>
                order.id === updatedOrder.id ? updatedOrder : order
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled, toast, notification]);

  const handleStatusUpdate = async (orderId: string, newStatus: KitchenOrder["status"]) => {
    const { error } = await supabase
      .from("kitchen_orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status",
      });
    }
  };

  const filterOrdersByStatus = (status: KitchenOrder["status"]) => {
    return filteredOrders.filter((order) => order.status === status);
  };

  // --- Modern UI: Status color helpers ---
  const statusColor = (status: KitchenOrder["status"]) => {
    switch (status) {
      case "new":
        return "from-yellow-400/70 to-yellow-100/50 dark:from-yellow-700/70 dark:to-yellow-800/30";
      case "preparing":
        return "from-blue-400/70 to-blue-100/50 dark:from-blue-700/70 dark:to-blue-900/30";
      case "ready":
        return "from-green-400/70 to-green-100/50 dark:from-green-700/70 dark:to-green-900/30";
      default:
        return "from-gray-400/50 to-gray-100/40";
    }
  };

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50 via-purple-100 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 px-2 md:px-6 py-4">
      {/* Modern Neumorphic + glass header */}
      <div className="max-w-5xl mx-auto mb-6">
        <GlassyCard className="relative overflow-hidden shadow-2xl border-0 p-0">
          <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-purple-300 via-blue-200/70 to-white/40 dark:from-purple-900/30 dark:via-indigo-900/20 dark:to-transparent anim-fade-in" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-8 py-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-800 via-blue-800 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm animate-fade-in">
                Kitchen Display System
              </h1>
              <div className="text-base md:text-lg font-medium text-gray-600 dark:text-gray-300 mt-1 animate-fade-in">
                Real-time ticketing for a seamless kitchen workflow
              </div>
            </div>
            <Button
              variant={soundEnabled ? "accent" : "outline"}
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`ml-2 ring-2 ring-sidebar-purple/40 ring-inset shadow-lg ${soundEnabled ? "bg-green-200/80 dark:bg-green-500/30" : "bg-white/50 dark:bg-gray-800/80"} transition-all`}
              aria-label={soundEnabled ? "Sound On" : "Sound Off"}
              tabIndex={0}
            >
              {soundEnabled ? (
                <Volume2 className="h-6 w-6 text-green-700 dark:text-green-400 transition-transform duration-300 animate-pulse-gentle" />
              ) : (
                <VolumeX className="h-6 w-6 text-gray-400 dark:text-gray-300" />
              )}
            </Button>
          </div>
        </GlassyCard>
      </div>

      {/* Controls */}
      <div className="max-w-5xl mx-auto mb-4 flex justify-between items-center px-1">
        <DateFilter value={dateFilter} onChange={setDateFilter} />
      </div>

      {/* Main Kitchen Columns - Modern Col Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        {/* 'OrdersColumn' already renders tickets, let's modernize the box container */}
        <div className="shadow-2xl">
          <GlassyCard
            className={`p-3 md:p-4 h-full border-none transition-transform duration-200 hover:scale-[1.012] animate-slide-in`}
            style={{
              background:
                "linear-gradient(135deg,rgba(255,255,255,0.82) 60%,rgba(236,233,255,0.7) 100%)",
              boxShadow:
                "0 6px 32px 0 rgba(80,72,128,0.08), 0 1.5px 5px 0 rgba(112,72,112,0.06)",
            }}
          >
            <OrdersColumn
              title="New Orders"
              orders={filterOrdersByStatus("new")}
              onStatusUpdate={handleStatusUpdate}
              variant="new"
            />
          </GlassyCard>
        </div>
        <div className="shadow-2xl">
          <GlassyCard
            className={`p-3 md:p-4 h-full border-none transition-transform duration-200 hover:scale-[1.012] animate-slide-in`}
            style={{
              background:
                "linear-gradient(135deg,rgba(236,241,255,0.74) 60%,rgba(210,232,255,0.62) 100%)",
            }}
          >
            <OrdersColumn
              title="Preparing"
              orders={filterOrdersByStatus("preparing")}
              onStatusUpdate={handleStatusUpdate}
              variant="preparing"
            />
          </GlassyCard>
        </div>
        <div className="shadow-2xl">
          <GlassyCard
            className={`p-3 md:p-4 h-full border-none transition-transform duration-200 hover:scale-[1.012] animate-slide-in`}
            style={{
              background:
                "linear-gradient(135deg,rgba(231,244,236,0.68) 60%,rgba(218,255,227,0.68) 100%)",
            }}
          >
            <OrdersColumn
              title="Ready"
              orders={filterOrdersByStatus("ready")}
              onStatusUpdate={handleStatusUpdate}
              variant="ready"
            />
          </GlassyCard>
        </div>
      </div>
    </div>
  );
};

export default KitchenDisplay;
