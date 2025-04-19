import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/types/orders";
import { ToggleLeft, ToggleRight, Plus, Pencil, UtensilsCrossed, PackageCheck, Truck, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import MenuCategories from "@/components/Orders/MenuCategories";
import MenuItemsGrid from "@/components/Orders/MenuItemsGrid";
import CurrentOrder from "@/components/Orders/CurrentOrder";
import AddOrderForm from "@/components/Orders/AddOrderForm";
import OrderList from "@/components/Orders/OrderList";
import OrderStats from "@/components/Orders/OrderStats";
import { v4 as uuidv4 } from 'uuid';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ActiveOrdersList from "@/components/Orders/ActiveOrdersList";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type OrderItem = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: string[];
};

interface TableData {
  id: string;
  name: string;
  capacity: number;
  status: string;
}

const Orders = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showPOS, setShowPOS] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [orderType, setOrderType] = useState("Dine-In");
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const { toast } = useToast();
  const isMobile = useIsMobile();

  const { data: tables, isLoading: isLoadingTables } = useQuery({
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

  const { data: categories } = useQuery({
    queryKey: ['menu-categories'],
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
        .from('menu_items')
        .select('category')
        .eq('restaurant_id', profile.restaurant_id);

      if (error) throw error;

      const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
      if (uniqueCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(uniqueCategories[0]);
      }
      return uniqueCategories;
    },
  });

  useEffect(() => {
    if (tables && tables.length > 0 && !tableNumber) {
      setTableNumber(tables[0].name);
    }
  }, [tables, tableNumber]);

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
          id: uuidv4(),
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

  const handleSendToKitchen = async () => {
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

      // Create kitchen order
      const { error: kitchenError } = await supabase
        .from("kitchen_orders")
        .insert({
          restaurant_id: profile.restaurant_id,
          source: `${orderType === "dineIn" ? "Table " + tableNumber : "Takeaway"}`,
          items: currentOrderItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            notes: item.modifiers
          })),
          status: "new"
        });

      if (kitchenError) throw kitchenError;
      
      toast({
        title: "Order Sent",
        description: "The order has been sent to the kitchen",
      });
    } catch (error) {
      console.error("Error sending order to kitchen:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send order to kitchen",
      });
    }
  };

  const handleProceedToPayment = () => {
    if (currentOrderItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty Order",
        description: "Cannot proceed to payment with an empty order",
      });
      return;
    }
    setShowPaymentDialog(true);
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

  const handleOrderAdded = () => {
    setShowAddForm(false);
    setEditingOrder(null);
    setCurrentOrderItems([]);
    toast({
      title: "Success",
      description: "Order has been processed successfully",
    });
  };

  const handleOrderDetailsEdit = () => {
    setShowOrderDetails(true);
  };

  const handleOrderDetailsSave = (type: string, table: string) => {
    setOrderType(type);
    setTableNumber(table);
    setShowOrderDetails(false);
    toast({
      title: "Details Updated",
      description: "Order details have been updated",
    });
  };

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

  const handlePrintBill = async () => {
    try {
      const element = document.getElementById('payment-summary');
      if (!element) return;

      const canvas = await html2canvas(element);
      const pdf = new jsPDF();
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`bill-${Date.now()}.pdf`);

      toast({
        title: "Bill Printed",
        description: "The bill has been generated successfully",
      });
    } catch (error) {
      console.error('Error printing bill:', error);
      toast({
        variant: "destructive",
        title: "Print Failed",
        description: "Failed to print the bill",
      });
    }
  };

  const orderStats = {
    totalOrders: orders?.length || 0,
    pendingOrders: orders?.filter(order => order.status === 'pending').length || 0,
    completedOrders: orders?.filter(order => order.status === 'completed').length || 0,
  };

  const subtotal = currentOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.10; // 10% tax
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-16 items-center justify-between px-4 bg-white dark:bg-gray-800 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Orders Management</h1>
          <Button 
            variant="ghost" 
            onClick={() => setShowPOS(!showPOS)} 
            className="flex items-center gap-2"
          >
            {showPOS ? (
              <ToggleRight className="h-5 w-5 text-indigo-600" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-gray-400" />
            )}
            <span className="text-sm font-medium">
              {showPOS ? "POS Mode" : "Orders View"}
            </span>
          </Button>
        </div>

        {!showPOS && (
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        )}
      </div>

      {showPOS ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-4rem)]">
          <div className="col-span-2 overflow-hidden flex flex-col bg-gray-100 dark:bg-gray-800">
            <div className="p-4 border-b">
              <div className="flex items-center gap-4 mb-4">
                <Select 
                  value={orderType} 
                  onValueChange={(value) => setOrderType(value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dine-In">
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className="w-4 h-4" />
                        Dine-In
                      </div>
                    </SelectItem>
                    <SelectItem value="Takeaway">
                      <div className="flex items-center gap-2">
                        <PackageCheck className="w-4 h-4" />
                        Takeaway
                      </div>
                    </SelectItem>
                    <SelectItem value="Delivery">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Delivery
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {orderType === "Dine-In" && tables && (
                  <Select 
                    value={tableNumber} 
                    onValueChange={setTableNumber}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map(table => (
                        <SelectItem key={table.id} value={table.name}>
                          Table {table.name} (Capacity: {table.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <h2 className="text-lg font-semibold">Active Orders</h2>
              <div className="overflow-auto">
                <ActiveOrdersList />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <MenuCategories
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
              <div className="overflow-auto h-[calc(100vh-24rem)]">
                <MenuItemsGrid
                  selectedCategory={selectedCategory}
                  onSelectItem={handleAddItem}
                />
              </div>
            </div>
          </div>

          <div className="overflow-auto">
            <CurrentOrder
              items={currentOrderItems}
              tableNumber={tableNumber}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onHoldOrder={handleHoldOrder}
              onSendToKitchen={handleSendToKitchen}
              onProceedToPayment={handleProceedToPayment}
              onClearOrder={handleClearOrder}
            />
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-lg text-muted-foreground">
              Manage and track your restaurant orders
            </h2>
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
        </div>
      )}

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-xl">
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Payment</h2>
            <div className="space-y-4">
              {/* Order Summary */}
              <div id="payment-summary" className="border rounded p-4">
                <h3 className="font-semibold mb-2">Order Summary</h3>
                {currentOrderItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%)</span>
                    <span>₹{(subtotal * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2">
                    <span>Total</span>
                    <span>₹{(subtotal * 1.1).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Payment Method Selection */}
              <div>
                <h3 className="font-semibold mb-2">Payment Method</h3>
                <Select defaultValue="cash">
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={handlePrintBill}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Bill
                </Button>
                <Button onClick={() => {
                  handlePrintBill();
                  toast({
                    title: "Payment Successful",
                    description: "Order has been completed",
                  });
                  setShowPaymentDialog(false);
                  setCurrentOrderItems([]);
                }}>
                  Complete Payment
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-md">
          <h2 className="text-lg font-semibold mb-4">Edit Order Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Order Type</label>
              <select 
                className="w-full p-2 border rounded-md"
                defaultValue={orderType}
                id="orderType"
              >
                <option value="Dine-In">Dine-In</option>
                <option value="Takeaway">Takeaway</option>
                <option value="Delivery">Delivery</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Table Number</label>
              <select
                className="w-full p-2 border rounded-md"
                defaultValue={tableNumber}
                id="tableNumber"
              >
                {!isLoadingTables && tables && tables.map(table => (
                  <option key={table.id} value={table.name}>
                    {table.name} (Capacity: {table.capacity})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                const type = (document.getElementById('orderType') as HTMLSelectElement).value;
                const table = (document.getElementById('tableNumber') as HTMLSelectElement).value;
                handleOrderDetailsSave(type, table);
              }}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
