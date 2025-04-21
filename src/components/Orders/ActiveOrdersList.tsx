
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, isToday } from "date-fns";
import OrderDetailsDialog from "./OrderDetailsDialog";
import type { ActiveOrder, OrderItem } from "@/types/orders";

interface OrderItemDisplay {
  name: string;
  quantity: number;
  price?: number;
}

const ActiveOrdersList = () => {
  const [selectedOrder, setSelectedOrder] = useState<ActiveOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<string>("today");

  const { data: activeOrders = [], isLoading } = useQuery({
    queryKey: ["active-orders", timeFilter],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.restaurant_id) throw new Error("No restaurant found");

      let query = supabase
        .from("kitchen_orders")
        .select("*")
        .eq("restaurant_id", profile.restaurant_id)
        .neq("status", "completed")  // Exclude completed orders
        .order("created_at", { ascending: false });

      // Apply time filter
      if (timeFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte("created_at", today.toISOString());
      } else if (timeFilter === "yesterday") {
        const yesterday = subDays(new Date(), 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte("created_at", yesterday.toISOString()).lt("created_at", today.toISOString());
      } else if (timeFilter === "last7days") {
        const lastWeek = subDays(new Date(), 7);
        query = query.gte("created_at", lastWeek.toISOString());
      } else if (timeFilter === "month") {
        // Month to date
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);
        query = query.gte("created_at", firstDayOfMonth.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to ensure items are properly typed as OrderItem[]
      return (data || []).map(order => ({
        ...order,
        items: (order.items as any[] || []).map(item => ({
          id: item.id || crypto.randomUUID(),
          name: item.name,
          price: item.price || 0,
          quantity: item.quantity || 1
        }))
      })) as ActiveOrder[];
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const handleOrderClick = (order: ActiveOrder) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-700";
      case "preparing":
        return "bg-yellow-100 text-yellow-800";
      case "ready":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-52 overflow-auto">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-full bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Active Orders</h3>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-[160px] h-8">
            <SelectValue placeholder="Filter by time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last7days">Last 7 Days</SelectItem>
            <SelectItem value="month">Month to Date</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[300px] overflow-auto">
        {activeOrders.length > 0 ? (
          activeOrders.map((order) => (
            <Button
              key={order.id}
              variant="outline"
              className="h-auto p-0 overflow-hidden"
              onClick={() => handleOrderClick(order)}
            >
              <Card className="w-full border-0 shadow-none">
                <CardContent className="p-3 text-left">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold truncate">{order.source}</span>
                    <Badge className={`${getStatusColor(order.status)} capitalize`}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(order.created_at), "h:mm a")}
                    {isToday(new Date(order.created_at)) ? " (Today)" : ""}
                  </div>
                  <div className="mt-1 text-sm">
                    {order.items
                      .slice(0, 2)
                      .map(
                        (item: OrderItemDisplay) =>
                          `${item.quantity}x ${item.name}`
                      )
                      .join(", ")}
                    {order.items.length > 2 && "..."}
                  </div>
                </CardContent>
              </Card>
            </Button>
          ))
        ) : (
          <div className="col-span-2 flex items-center justify-center h-32 border rounded bg-muted/20">
            <p className="text-muted-foreground">No active orders found</p>
          </div>
        )}
      </div>

      <OrderDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />
    </div>
  );
};

export default ActiveOrdersList;
