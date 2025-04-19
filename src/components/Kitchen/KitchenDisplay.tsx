
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrderTicket from "./OrderTicket";
import OrdersColumn from "./OrdersColumn";

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

const KitchenDisplay = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { toast } = useToast();
  // Create the audio element with error handling
  const [notification] = useState(() => {
    const audio = new Audio();
    // Try to load the notification sound, with a fallback if it fails
    try {
      audio.src = "/notification.mp3";
      // Add error handler for the audio loading
      audio.addEventListener('error', (e) => {
        console.error("Error loading notification sound:", e);
        // Use a fallback approach - create a beep sound using Web Audio API
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          audio.src = createBeepSound(audioContext);
        } catch (audioApiError) {
          console.error("Could not create fallback sound:", audioApiError);
        }
      });
    } catch (e) {
      console.error("Could not initialize audio:", e);
    }
    return audio;
  });

  // Function to create a simple beep sound as fallback
  const createBeepSound = (audioContext: AudioContext): string => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 800; // Frequency in hertz
    gainNode.gain.value = 0.5;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const length = 0.3; // Length in seconds
    oscillator.start();
    oscillator.stop(audioContext.currentTime + length);
    
    // Convert to data URL (this is a simplified approach)
    // In a real implementation, you would record the audio to a buffer and convert to MP3/WAV
    return 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9vT18=';
  };

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

      if (data) setOrders(data as KitchenOrder[]);
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
            setOrders((prev) => [payload.new as KitchenOrder, ...prev]);
            if (soundEnabled) {
              try {
                notification.play().catch(err => {
                  console.error("Error playing notification sound:", err);
                });
                toast({
                  title: "New Order",
                  description: `New order from ${(payload.new as KitchenOrder).source}`,
                });
              } catch (e) {
                console.error("Could not play notification:", e);
                // Still show the toast even if sound fails
                toast({
                  title: "New Order",
                  description: `New order from ${(payload.new as KitchenOrder).source}`,
                });
              }
            }
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id
                  ? (payload.new as KitchenOrder)
                  : order
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
    return orders.filter((order) => order.status === status);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kitchen Display System</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="ml-2"
        >
          {soundEnabled ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <OrdersColumn
          title="New Orders"
          orders={filterOrdersByStatus("new")}
          onStatusUpdate={handleStatusUpdate}
          variant="new"
        />
        <OrdersColumn
          title="Preparing"
          orders={filterOrdersByStatus("preparing")}
          onStatusUpdate={handleStatusUpdate}
          variant="preparing"
        />
        <OrdersColumn
          title="Ready"
          orders={filterOrdersByStatus("ready")}
          onStatusUpdate={handleStatusUpdate}
          variant="ready"
        />
      </div>
    </div>
  );
};

export default KitchenDisplay;
