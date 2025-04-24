
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, User, Coins, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { OrderItem } from "@/types/orders";
import { Customer, LoyaltyReward } from "@/types/customer";
import { LoyaltyBadge } from "@/components/Customers/LoyaltyBadge";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  onSuccess: () => void;
}

const PaymentDialog = ({ isOpen, onClose, orderItems, onSuccess }: PaymentDialogProps) => {
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [lookupCustomer, setLookupCustomer] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [availableRewards, setAvailableRewards] = useState<LoyaltyReward[]>([]);
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null);
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.10; // 10% tax
  
  // Calculate total based on whether a reward is selected
  const calculateTotal = () => {
    if (!selectedReward) return subtotal + tax;
    
    switch (selectedReward.reward_type) {
      case 'discount_percentage':
        const discountAmount = subtotal * (selectedReward.reward_value / 100);
        return Math.max(0, subtotal - discountAmount + tax);
        
      case 'discount_amount':
        return Math.max(0, subtotal - selectedReward.reward_value + tax);
        
      case 'free_item':
        // Assuming the reward_value is the menu item ID that should be free
        // This would need to be enhanced to properly match menu items
        return subtotal + tax; // For now, no discount applied
        
      default:
        return subtotal + tax;
    }
  };
  
  const total = calculateTotal();
  
  // Get restaurant ID for the current user
  useEffect(() => {
    const getRestaurantId = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();
        
      if (profile?.restaurant_id) {
        setRestaurantId(profile.restaurant_id);
      }
    };
    
    if (isOpen) {
      getRestaurantId();
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMethod("cash");
      setLookupCustomer("");
      setSearchResults([]);
      setSelectedCustomer(null);
      setSelectedReward(null);
    }
  }, [isOpen]);
  
  // Search for customer when customer lookup changes
  useEffect(() => {
    const searchCustomer = async () => {
      if (!lookupCustomer.trim() || !restaurantId) return;
      
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .or(`name.ilike.%${lookupCustomer}%,phone.ilike.%${lookupCustomer}%`)
          .limit(5);
          
        if (error) throw error;
        
        // Map database tiers to customer tier display format
        const mappedResults = data.map(customer => ({
          ...customer,
          loyalty_tier: determineLoyaltyTier(customer)
        })) as Customer[];
        
        setSearchResults(mappedResults);
      } catch (error) {
        console.error("Error searching for customer:", error);
      } finally {
        setIsSearching(false);
      }
    };
    
    // Only search if there's at least 3 characters
    if (lookupCustomer.length >= 3) {
      const timeout = setTimeout(() => {
        searchCustomer();
      }, 300);
      
      return () => clearTimeout(timeout);
    } else {
      setSearchResults([]);
    }
  }, [lookupCustomer, restaurantId]);
  
  // Load available rewards when a customer is selected
  useEffect(() => {
    const loadRewards = async () => {
      if (!selectedCustomer || !selectedCustomer.loyalty_enrolled || !restaurantId) {
        setAvailableRewards([]);
        return;
      }
      
      setIsLoadingRewards(true);
      try {
        // Load rewards that the customer can redeem based on their points
        const { data: rewards, error } = await supabase
          .from("loyalty_rewards")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .eq("is_active", true)
          .lte("points_required", selectedCustomer.loyalty_points)
          .order("points_required", { ascending: false });
          
        if (error) throw error;
        
        setAvailableRewards(rewards as LoyaltyReward[]);
      } catch (error) {
        console.error("Error loading rewards:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load available rewards"
        });
      } finally {
        setIsLoadingRewards(false);
      }
    };
    
    loadRewards();
  }, [selectedCustomer, restaurantId]);
  
  // Determine loyalty tier based on customer data
  function determineLoyaltyTier(customer: any): Customer['loyalty_tier'] {
    if (!customer.loyalty_enrolled) return 'None';
    
    // This is a simplified version - in production, this would use the loyalty_tier_id
    // to fetch the actual tier name from the database
    if (customer.loyalty_points > 10000) return "Diamond";
    if (customer.loyalty_points > 5000) return "Platinum";
    if (customer.loyalty_points > 2000) return "Gold";
    if (customer.loyalty_points > 1000) return "Silver";
    if (customer.loyalty_points > 0) return "Bronze";
    return "None";
  }
  
  // Select a customer from search results
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || "");
    setLookupCustomer("");
    setSearchResults([]);
  };

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

  const handleCompletePayment = async () => {
    if (!customerName.trim()) {
      toast({
        variant: "destructive",
        title: "Customer name required",
        description: "Please enter customer name to complete the payment",
      });
      return;
    }
    
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profile?.restaurant_id) {
        const orderTotal = total;
        
        // Handle customer creation or update
        if (selectedCustomer) {
          // Update existing customer
          const pointsToAdd = Math.floor(orderTotal / 100); // 1 point per ₹100 spent
          const newPointsTotal = selectedCustomer.loyalty_points + pointsToAdd - (selectedReward?.points_required || 0);
          
          await supabase
            .from("customers")
            .update({
              total_spent: selectedCustomer.total_spent + orderTotal,
              visit_count: selectedCustomer.visit_count + 1,
              last_visit_date: new Date().toISOString(),
              average_order_value: (selectedCustomer.total_spent + orderTotal) / (selectedCustomer.visit_count + 1),
              loyalty_points: Math.max(0, newPointsTotal) // Ensure points don't go below 0
            })
            .eq("id", selectedCustomer.id);
          
          // Record loyalty transaction for points earned
          if (pointsToAdd > 0) {
            await supabase
              .from("loyalty_transactions")
              .insert({
                customer_id: selectedCustomer.id,
                restaurant_id: profile.restaurant_id,
                transaction_type: 'earn',
                points: pointsToAdd,
                source: 'order',
                notes: `Points earned for order of ₹${orderTotal}`
              });
          }
          
          // Handle reward redemption
          if (selectedReward) {
            // Record redemption
            const { data: order } = await supabase
              .from("orders")
              .insert({
                restaurant_id: profile.restaurant_id,
                customer_name: selectedCustomer.name,
                items: orderItems.map(item => `${item.quantity}x ${item.name}`),
                total: orderTotal,
                status: "completed"
              })
              .select()
              .single();
              
            if (order) {
              // Record the redemption
              await supabase
                .from("loyalty_redemptions")
                .insert({
                  customer_id: selectedCustomer.id,
                  restaurant_id: profile.restaurant_id,
                  reward_id: selectedReward.id,
                  order_id: order.id,
                  points_used: selectedReward.points_required,
                  discount_applied: subtotal + tax - total // Calculate the discount that was applied
                });
                
              // Record the points deduction transaction
              await supabase
                .from("loyalty_transactions")
                .insert({
                  customer_id: selectedCustomer.id,
                  restaurant_id: profile.restaurant_id,
                  transaction_type: 'redeem',
                  points: -selectedReward.points_required,
                  source: 'order',
                  notes: `Redeemed ${selectedReward.name}`
                });
            }
          }
        } else {
          // Check if customer exists with this phone number
          const { data: existingCustomers } = await supabase
            .from("customers")
            .select("id, total_spent, visit_count, loyalty_points")
            .eq("restaurant_id", profile.restaurant_id)
            .eq("phone", customerPhone)
            .maybeSingle();
          
          const pointsToAdd = Math.floor(orderTotal / 100); // 1 point per ₹100 spent
          
          if (existingCustomers) {
            // Update existing customer
            await supabase
              .from("customers")
              .update({
                total_spent: existingCustomers.total_spent + orderTotal,
                visit_count: existingCustomers.visit_count + 1,
                last_visit_date: new Date().toISOString(),
                average_order_value: (existingCustomers.total_spent + orderTotal) / (existingCustomers.visit_count + 1),
                loyalty_points: existingCustomers.loyalty_points + pointsToAdd
              })
              .eq("id", existingCustomers.id);
              
            // Record loyalty transaction
            if (pointsToAdd > 0) {
              await supabase
                .from("loyalty_transactions")
                .insert({
                  customer_id: existingCustomers.id,
                  restaurant_id: profile.restaurant_id,
                  transaction_type: 'earn',
                  points: pointsToAdd,
                  source: 'order',
                  notes: `Points earned for order of ₹${orderTotal}`
                });
            }
          } else {
            // Create new customer
            const { data: newCustomer } = await supabase
              .from("customers")
              .insert({
                restaurant_id: profile.restaurant_id,
                name: customerName,
                phone: customerPhone,
                total_spent: orderTotal,
                visit_count: 1,
                average_order_value: orderTotal,
                last_visit_date: new Date().toISOString(),
                loyalty_points: pointsToAdd,
                loyalty_enrolled: false // New customers aren't automatically enrolled
              })
              .select()
              .single();
              
            // Record loyalty transaction for new customer if points were earned
            if (newCustomer && pointsToAdd > 0) {
              await supabase
                .from("loyalty_transactions")
                .insert({
                  customer_id: newCustomer.id,
                  restaurant_id: profile.restaurant_id,
                  transaction_type: 'earn',
                  points: pointsToAdd,
                  source: 'order',
                  notes: `Points earned for first order of ₹${orderTotal}`
                });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error saving customer data:", error);
    }
    
    handlePrintBill();
    toast({
      title: "Payment Successful",
      description: `Order for ${customerName} has been completed`,
    });
    onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Payment</h2>
          
          <Tabs defaultValue="customer" className="mb-4">
            <TabsList className="mb-4">
              <TabsTrigger value="customer" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Payment
              </TabsTrigger>
              {selectedCustomer?.loyalty_enrolled && (
                <TabsTrigger value="loyalty" className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Loyalty
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="customer" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Find Customer (by name or phone)</Label>
                  <Input 
                    value={lookupCustomer}
                    onChange={(e) => setLookupCustomer(e.target.value)}
                    placeholder="Search for existing customer"
                  />
                  
                  {/* Search results */}
                  {lookupCustomer.length >= 3 && (
                    <div className="relative">
                      <div className="absolute z-10 w-full bg-card border rounded-md shadow-lg mt-1">
                        {isSearching ? (
                          <div className="p-4 text-center text-sm">Searching...</div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map(customer => (
                            <div 
                              key={customer.id}
                              onClick={() => handleSelectCustomer(customer)}
                              className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                            >
                              <div className="font-medium">{customer.name}</div>
                              <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                                <span>{customer.phone || 'No phone'}</span>
                                <div className="flex items-center gap-2">
                                  {customer.loyalty_enrolled ? (
                                    <>
                                      <LoyaltyBadge tier={customer.loyalty_tier} size="sm" />
                                      <span className="flex items-center gap-1">
                                        <Coins className="h-3 w-3" />
                                        {customer.loyalty_points} pts
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-xs">Not enrolled</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm">
                            No customers found. Enter details below to create.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              
                {selectedCustomer ? (
                  <div className="bg-muted p-4 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-lg">{selectedCustomer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedCustomer.phone || 'No phone'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {selectedCustomer.loyalty_enrolled ? (
                            <>
                              <LoyaltyBadge tier={selectedCustomer.loyalty_tier} />
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Coins className="h-3.5 w-3.5" />
                                {selectedCustomer.loyalty_points} points
                              </Badge>
                            </>
                          ) : (
                            <Badge variant="outline">Not Enrolled</Badge>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => setSelectedCustomer(null)}
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Customer Name*</Label>
                      <Input 
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter customer name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Customer Phone</Label>
                      <Input 
                        id="customerPhone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="payment" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Payment Method</h3>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
            </TabsContent>
            
            {selectedCustomer?.loyalty_enrolled && (
              <TabsContent value="loyalty" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Available Rewards</h3>
                  
                  {isLoadingRewards ? (
                    <div className="text-center py-4">Loading rewards...</div>
                  ) : availableRewards.length === 0 ? (
                    <div className="text-center py-4 bg-muted rounded-md">
                      <Award className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No rewards available for redemption
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableRewards.map(reward => (
                        <div 
                          key={reward.id} 
                          className={`p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedReward?.id === reward.id 
                              ? 'border-primary bg-primary/10' 
                              : 'hover:bg-accent'
                          }`}
                          onClick={() => setSelectedReward(selectedReward?.id === reward.id ? null : reward)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{reward.name}</div>
                              {reward.description && (
                                <div className="text-sm text-muted-foreground">{reward.description}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="mb-1 flex items-center gap-1">
                                <Coins className="h-3 w-3" />
                                {reward.points_required} points
                              </Badge>
                              <div className="text-xs">
                                {reward.reward_type === 'discount_percentage' && `${reward.reward_value}% off`}
                                {reward.reward_type === 'discount_amount' && `₹${reward.reward_value} off`}
                                {reward.reward_type === 'free_item' && 'Free item'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {selectedReward && (
                        <div className="mt-4 p-2 bg-primary/10 rounded-md text-sm text-center">
                          Using "{selectedReward.name}" will deduct {selectedReward.points_required} points.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>

          <div id="payment-summary" className="border rounded p-4 mb-4">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            {orderItems.map((item) => (
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
              
              {selectedReward && (
                <div className="flex justify-between text-green-600">
                  <span>
                    {selectedReward.reward_type === 'discount_percentage' 
                      ? `Discount (${selectedReward.reward_value}%)`
                      : 'Discount'
                    }
                  </span>
                  <span>-₹{(subtotal + tax - total).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Tax (10%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold mt-2">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handlePrintBill}>
              <Printer className="w-4 h-4 mr-2" />
              Print Bill
            </Button>
            <Button onClick={handleCompletePayment}>
              Complete Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
