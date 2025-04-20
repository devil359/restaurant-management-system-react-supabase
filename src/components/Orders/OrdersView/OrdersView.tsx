
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import OrderList from "../OrderList";
import OrderStats from "../OrderStats";
import AddOrderForm from "../AddOrderForm";
import type { Order } from "@/types/orders";

const OrdersView = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const isMobile = useIsMobile();

  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.restaurant_id) {
        throw new Error("No restaurant found for user");
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', profile.restaurant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });

  const handleOrderAdded = () => {
    setShowAddForm(false);
    setEditingOrder(null);
    refetchOrders();
  };

  const orderStats = {
    totalOrders: orders?.length || 0,
    pendingOrders: orders?.filter(order => order.status === 'pending').length || 0,
    completedOrders: orders?.filter(order => order.status === 'completed').length || 0,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg text-muted-foreground">
          Manage and track your restaurant orders
        </h2>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>
      
      <OrderStats 
        totalOrders={orderStats.totalOrders}
        pendingOrders={orderStats.pendingOrders}
        completedOrders={orderStats.completedOrders}
      />

      <OrderList 
        orders={orders || []} 
        onOrdersChange={refetchOrders}
        onEditOrder={setEditingOrder}
      />

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className={`${isMobile ? 'w-[95%] max-w-lg' : 'max-w-4xl'} max-h-[90vh] overflow-y-auto`}>
          <AddOrderForm
            onSuccess={handleOrderAdded}
            onCancel={() => {
              setShowAddForm(false);
              setEditingOrder(null);
            }}
            editingOrder={editingOrder}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersView;
