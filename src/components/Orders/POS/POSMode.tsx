
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ToggleLeft, ToggleRight } from "lucide-react";
import POSHeader from "./POSHeader";
import ActiveOrdersList from "../ActiveOrdersList";
import MenuCategories from "../MenuCategories";
import MenuItemsGrid from "../MenuItemsGrid";
import CurrentOrder from "../CurrentOrder";
import PaymentDialog from "./PaymentDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { OrderItem, TableData } from "@/types/orders";

const POSMode = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [tableNumber, setTableNumber] = useState("");
  const [orderType, setOrderType] = useState("Dine-In");
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showActiveOrders, setShowActiveOrders] = useState(true);
  const { toast } = useToast();

  const { data: tables } = useQuery({
    queryKey: ["restaurant-tables"],
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
        .from("restaurant_tables")
        .select("*")
        .eq("restaurant_id", profile.restaurant_id);

      if (error) throw error;
      return data as TableData[];
    },
  });

  const handleAddItem = (item: any) => {
    const existingItem = currentOrderItems.find(
      orderItem => orderItem.menuItemId === item.id
    );

    if (existingItem) {
      setCurrentOrderItems(
        currentOrderItems.map(orderItem =>
          orderItem.menuItemId === item.id
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        )
      );
    } else {
      setCurrentOrderItems([
        ...currentOrderItems,
        {
          id: crypto.randomUUID(),
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1
        }
      ]);
    }

    toast({
      title: "Item Added",
      description: `${item.name} added to order`,
    });
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCurrentOrderItems(currentOrderItems.filter(item => item.id !== id));
      return;
    }
    
    setCurrentOrderItems(currentOrderItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setCurrentOrderItems(currentOrderItems.filter(item => item.id !== id));
  };

  const handleHoldOrder = () => {
    if (currentOrderItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty Order",
        description: "Cannot hold an empty order",
      });
      return;
    }
    
    toast({
      title: "Order Held",
      description: "The order has been put on hold",
    });
  };

  const handleClearOrder = () => {
    if (currentOrderItems.length > 0) {
      if (window.confirm("Are you sure you want to clear this order?")) {
        setCurrentOrderItems([]);
        toast({
          title: "Order Cleared",
          description: "All items have been cleared from the order",
        });
      }
    }
  };

  const handleSendToKitchen = async (customerDetails?: { name: string, phone: string }) => {
    if (currentOrderItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty Order",
        description: "Cannot send an empty order to the kitchen",
      });
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.restaurant_id) {
        throw new Error("No restaurant found for user");
      }

      const orderSource = customerDetails?.name 
        ? `${customerDetails.name} ${customerDetails.phone ? '(' + customerDetails.phone + ')' : ''}`
        : `${orderType === "Dine-In" ? "Table " + tableNumber : orderType}`;
        
      const posOrderSource = `POS-${orderSource}`;

      const { error: kitchenError, data: kitchenOrder } = await supabase
        .from("kitchen_orders")
        .insert({
          restaurant_id: profile.restaurant_id,
          source: posOrderSource,
          items: currentOrderItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          status: "new"
        })
        .select()
        .single();

      if (kitchenError) throw kitchenError;

      const { error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: profile.restaurant_id,
          customer_name: orderSource,
          items: currentOrderItems.map(item => `${item.quantity}x ${item.name}`),
          total: currentOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          status: "pending"
        });

      if (orderError) throw orderError;
      
      toast({
        title: "Order Sent",
        description: "The order has been sent to the kitchen",
      });

      setCurrentOrderItems([]);
    } catch (error) {
      console.error("Error sending order to kitchen:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send order to kitchen",
      });
    }
  };

  const handlePaymentSuccess = () => {
    handleSendToKitchen();
    setShowPaymentDialog(false);
    setCurrentOrderItems([]);
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      <div className="grid grid-cols-1 lg:grid-cols-4 h-full gap-6 p-6">
        {/* Left Section - Menu & Orders */}
        <div className="lg:col-span-3 flex flex-col space-y-6">
          {/* Header Section */}
          <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-3xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <POSHeader 
                orderType={orderType}
                setOrderType={setOrderType}
                tableNumber={tableNumber}
                setTableNumber={setTableNumber}
                tables={tables}
              />
              <Button 
                variant="outline" 
                onClick={() => setShowActiveOrders(!showActiveOrders)}
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700 rounded-xl px-4 py-2 transition-all duration-300"
              >
                {showActiveOrders ? (
                  <>
                    <ToggleRight className="h-5 w-5" />
                    <span>Hide Orders</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5" />
                    <span>Show Orders</span>
                  </>
                )}
              </Button>
            </div>

            {showActiveOrders && (
              <div className="bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
                <h2 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
                  Active Orders
                </h2>
                <div className="max-h-[250px] overflow-auto">
                  <ActiveOrdersList />
                </div>
              </div>
            )}
          </div>

          {/* Menu Section */}
          <div className="flex-1 bg-white/90 backdrop-blur-xl border border-white/30 rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Menu Items
              </h2>
            </div>
            
            <div className="p-4">
              <MenuCategories
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <MenuItemsGrid
                selectedCategory={selectedCategory}
                onSelectItem={handleAddItem}
              />
            </div>
          </div>
        </div>

        {/* Right Section - Current Order */}
        <div className="lg:col-span-1">
          <CurrentOrder
            items={currentOrderItems}
            tableNumber={tableNumber}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onHoldOrder={handleHoldOrder}
            onSendToKitchen={() => handleSendToKitchen()}
            onProceedToPayment={() => setShowPaymentDialog(true)}
            onClearOrder={handleClearOrder}
          />
        </div>
      </div>

      <PaymentDialog 
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        orderItems={currentOrderItems}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default POSMode;
