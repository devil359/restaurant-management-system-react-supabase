
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, Trash2, Plus, Minus, Search, Coffee, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PaymentDialog from "./PaymentDialog";
import { OrderItem } from "@/types/orders";

const POSMode = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  
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
  };
  
  // Calculate order total
  const orderTotal = currentOrderItems.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );
  
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
      </div>
      
      {/* Current Order Section */}
      <div className="border-t lg:border-l lg:border-t-0 lg:w-[400px] flex flex-col h-full">
        <div className="p-4 border-b bg-card">
          <h2 className="text-xl font-bold">Current Order</h2>
          <p className="text-muted-foreground text-sm">
            {currentOrderItems.length} 
            {currentOrderItems.length === 1 ? ' item' : ' items'}
          </p>
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
      />
    </div>
  );
};

export default POSMode;
