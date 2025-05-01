
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, Trash2, Plus, Minus, Search, Coffee, ShoppingCart, Clock, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PaymentDialog from "./PaymentDialog";
import { OrderItem } from "@/types/orders";
import { Separator } from "@/components/ui/separator";

const POSMode = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState<string>("");
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
  
  // Fetch menu items
  const { data: menuItems = [], isLoading: isLoadingMenu } = useQuery({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No user found");
      
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", profile.user.id)
        .single();
      
      if (!userProfile?.restaurant_id) {
        throw new Error("No restaurant found for user");
      }
      
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", userProfile.restaurant_id);
        
      if (error) throw error;
      return data;
    }
  });

  // Fetch recent orders
  const { data: recentOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No user found");
      
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", profile.user.id)
        .single();
      
      if (!userProfile?.restaurant_id) {
        throw new Error("No restaurant found for user");
      }
      
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", userProfile.restaurant_id)
        .order("created_at", { ascending: false })
        .limit(5);
        
      if (error) throw error;
      return data;
    }
  });
  
  // Get unique categories
  const categories = ["all", ...Array.from(new Set(menuItems.map(item => item.category)))].filter(Boolean);
  
  // Filtered items based on category and search
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = searchTerm === "" || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // Add item to order
  const addItemToOrder = (item: any) => {
    setCurrentOrderItems(prevItems => {
      // Check if item already exists
      const existingItemIndex = prevItems.findIndex(i => i.id === item.id);
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      } else {
        // Add new item with quantity 1
        return [...prevItems, { 
          id: item.id, 
          name: item.name, 
          price: item.price,
          quantity: 1 
        }];
      }
    });
    
    toast({
      title: "Item Added",
      description: `${item.name} added to order`,
      duration: 1500,
    });
  };
  
  // Decrement item quantity
  const decrementItemQuantity = (itemId: string) => {
    setCurrentOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(i => i.id === itemId);
      
      if (existingItemIndex >= 0) {
        const newItems = [...prevItems];
        if (newItems[existingItemIndex].quantity > 1) {
          // Decrement quantity
          newItems[existingItemIndex].quantity -= 1;
          return newItems;
        } else {
          // Remove item if quantity becomes 0
          return prevItems.filter(i => i.id !== itemId);
        }
      }
      return prevItems;
    });
  };
  
  // Increment item quantity
  const incrementItemQuantity = (itemId: string) => {
    setCurrentOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(i => i.id === itemId);
      
      if (existingItemIndex >= 0) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      }
      return prevItems;
    });
  };
  
  // Remove item from order
  const removeItemFromOrder = (itemId: string) => {
    setCurrentOrderItems(prevItems => prevItems.filter(i => i.id !== itemId));
  };
  
  // Clear entire order
  const clearOrder = () => {
    setCurrentOrderItems([]);
    setTableNumber("");
    setCustomerInfo({ name: "", phone: "" });
  };
  
  // Calculate order total
  const orderTotal = currentOrderItems.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );
  
  // Send order to kitchen
  const sendToKitchen = async () => {
    try {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No user found");
      
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", profile.user.id)
        .single();
      
      if (!userProfile?.restaurant_id) {
        throw new Error("No restaurant found for user");
      }
      
      // Create kitchen order
      const kitchenItems = currentOrderItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        notes: item.modifiers || []
      }));
      
      const source = tableNumber ? 
        `Table ${tableNumber}` : 
        (customerInfo.name ? customerInfo.name : "Counter Order");
      
      const { data, error } = await supabase
        .from("kitchen_orders")
        .insert({
          restaurant_id: userProfile.restaurant_id,
          source: source,
          status: "new",
          items: kitchenItems
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Order Sent",
        description: "Order successfully sent to kitchen",
      });
      
      clearOrder();
    } catch (error) {
      console.error("Error sending to kitchen:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send order to kitchen",
      });
    }
  };
  
  // Hold order for later
  const holdOrder = () => {
    if (currentOrderItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty Order",
        description: "Cannot hold an empty order",
      });
      return;
    }
    
    // For now we'll just save to localStorage
    const savedOrders = JSON.parse(localStorage.getItem("heldOrders") || "[]");
    const newOrder = {
      id: Date.now().toString(),
      items: currentOrderItems,
      tableNumber,
      customerInfo,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem("heldOrders", JSON.stringify([...savedOrders, newOrder]));
    
    toast({
      title: "Order Held",
      description: "Order has been saved for later",
    });
    
    clearOrder();
  };
  
  // Handle payment success
  const handlePaymentSuccess = () => {
    clearOrder();
    toast({
      title: "Order Completed",
      description: "The order has been processed successfully."
    });
  };

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Menu Items Section */}
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        {/* Search and Categories */}
        <div className="mb-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search menu items..." 
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="overflow-x-auto w-full justify-start">
              {categories.map(category => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="whitespace-nowrap"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        
        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto pb-4">
          {isLoadingMenu ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="h-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Coffee className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No items found</h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your search or select a different category
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map(item => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden cursor-pointer hover:border-primary transition-colors"
                  onClick={() => addItemToOrder(item)}
                >
                  <div className="aspect-[4/3] bg-muted relative">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Coffee className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {!item.is_available && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-medium">Unavailable</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-muted-foreground">
                        {item.category}
                      </span>
                      <span className="font-semibold">₹{item.price}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Recent Orders Section */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center">
              <History className="mr-2 h-4 w-4" /> Recent Orders
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <div className="flex space-x-4 pb-2">
              {isLoadingOrders ? (
                [...Array(3)].map((_, index) => (
                  <Card key={index} className="w-64 h-24 flex-shrink-0 animate-pulse bg-gray-200 dark:bg-gray-800" />
                ))
              ) : recentOrders.length === 0 ? (
                <p className="text-muted-foreground py-2">No recent orders found</p>
              ) : (
                recentOrders.map(order => (
                  <Card key={order.id} className="w-64 flex-shrink-0 p-3">
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </span>
                      <span className="font-semibold">₹{order.total}</span>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {order.items.length} items
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        order.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 
                        order.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' : 
                        'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Current Order Section */}
      <div className="border-t lg:border-l lg:border-t-0 lg:w-[400px] flex flex-col h-full">
        <div className="p-4 border-b bg-card">
          <h2 className="text-xl font-bold">Current Order</h2>
          <div className="flex gap-2 mt-2">
            <Input 
              placeholder="Table Number" 
              value={tableNumber} 
              onChange={e => setTableNumber(e.target.value)}
              className="w-24"
            />
            <Input 
              placeholder="Customer Name" 
              value={customerInfo.name} 
              onChange={e => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
              className="flex-1"
            />
          </div>
          <Input 
            placeholder="Customer Phone" 
            value={customerInfo.phone} 
            onChange={e => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
            className="mt-2"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {currentOrderItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">Your order is empty</h3>
              <p className="text-muted-foreground mt-1">
                Add items from the menu to get started
              </p>
            </div>
          ) : (
            currentOrderItems.map(item => (
              <div 
                key={item.id} 
                className="flex justify-between items-center border rounded-lg p-3"
              >
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ₹{item.price} × {item.quantity}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded-md">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => decrementItemQuantity(item.id)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="w-8 text-center">{item.quantity}</div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => incrementItemQuantity(item.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeItemFromOrder(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t mt-auto">
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>₹{orderTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between mb-4 text-lg font-bold">
            <span>Total</span>
            <span>₹{orderTotal.toFixed(2)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={sendToKitchen}
              disabled={currentOrderItems.length === 0}
            >
              Send to Kitchen
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={holdOrder}
              disabled={currentOrderItems.length === 0}
            >
              Hold Order
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={clearOrder}
              disabled={currentOrderItems.length === 0}
            >
              Clear
            </Button>
            <Button 
              className="flex-1"
              disabled={currentOrderItems.length === 0}
              onClick={() => setPaymentDialogOpen(true)}
            >
              Pay <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        orderItems={currentOrderItems}
        onSuccess={handlePaymentSuccess}
        customerPhone={customerInfo.phone}
        customerName={customerInfo.name}
      />
    </div>
  );
};

export default POSMode;
