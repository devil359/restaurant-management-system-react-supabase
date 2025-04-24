
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, BadgeIndianRupee, CreditCard, Loader2, Wallet, Receipt, Coins } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { formatCurrency } from "@/utils/formatters";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderTotal: number;
  orderItems: any[];
  customerName: string;
  onPaymentComplete: () => void;
}

const PaymentDialog = ({
  open,
  onOpenChange,
  orderTotal,
  orderItems,
  customerName,
  onPaymentComplete,
}: PaymentDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState(orderTotal.toString());
  const [change, setChange] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any | null>(null);
  const [actualTotal, setActualTotal] = useState(orderTotal);
  const [discount, setDiscount] = useState(0);
  const [showRewards, setShowRewards] = useState(false);

  // Fetch customer details if name is provided
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ["customer-by-name", customerName],
    queryFn: async () => {
      if (!customerName) return null;
      
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No user found");

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", profile.user.id)
        .single();
        
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("restaurant_id", userProfile?.restaurant_id)
        .eq("name", customerName)
        .maybeSingle();
        
      if (error) throw error;
      return data as Customer | null;
    },
    enabled: !!customerName,
  });
  
  // Fetch available rewards for customer
  const { data: availableRewards = [], isLoading: isLoadingRewards } = useQuery({
    queryKey: ["available-rewards", customer?.id],
    queryFn: async () => {
      if (!customer || !customer.loyalty_enrolled) return [];
      
      const { data, error } = await supabase
        .from("loyalty_rewards")
        .select("*")
        .eq("restaurant_id", customer.restaurant_id)
        .lte("points_required", customer.loyalty_points)
        .eq("is_active", true)
        .order("points_required", { ascending: false });
        
      if (error) throw error;
      return data;
    },
    enabled: !!customer && customer.loyalty_enrolled,
  });

  useEffect(() => {
    if (open) {
      setPaymentMethod("cash");
      setAmountPaid(orderTotal.toString());
      setChange(0);
      setProcessing(false);
      setSelectedReward(null);
      setActualTotal(orderTotal);
      setDiscount(0);
      setShowRewards(false);
    }
  }, [open, orderTotal]);

  useEffect(() => {
    // Calculate change when amount paid changes
    const paid = parseFloat(amountPaid) || 0;
    setChange(Math.max(0, paid - actualTotal));
  }, [amountPaid, actualTotal]);
  
  // Update actual total when a reward is selected
  useEffect(() => {
    if (selectedReward) {
      let discountAmount = 0;
      
      switch (selectedReward.reward_type) {
        case 'discount_amount':
          discountAmount = Math.min(selectedReward.reward_value, orderTotal);
          break;
        case 'discount_percentage':
          discountAmount = (orderTotal * selectedReward.reward_value) / 100;
          break;
        case 'free_item':
          // For free item, we'd typically match it to a menu item
          // For simplicity, we're using reward_value as a fixed amount
          discountAmount = Math.min(selectedReward.reward_value, orderTotal);
          break;
      }
      
      setDiscount(discountAmount);
      setActualTotal(Math.max(0, orderTotal - discountAmount));
      setAmountPaid(Math.max(0, orderTotal - discountAmount).toString());
    } else {
      setDiscount(0);
      setActualTotal(orderTotal);
      setAmountPaid(orderTotal.toString());
    }
  }, [selectedReward, orderTotal]);

  const handleApplyReward = (reward: any) => {
    setSelectedReward(reward);
    setShowRewards(false);
  };

  const completeOrder = useMutation({
    mutationFn: async () => {
      try {
        setProcessing(true);
        
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
        
        // Create order
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            restaurant_id: userProfile.restaurant_id,
            customer_name: customerName,
            total: actualTotal,
            status: "completed",
            items: orderItems.map(item => item.name),
          })
          .select()
          .single();
          
        if (orderError) throw orderError;
        
        let loyalty_points_earned = 0;
        
        // Handle loyalty points if customer is enrolled
        if (customer && customer.loyalty_enrolled) {
          // Get loyalty program settings
          const { data: program } = await supabase
            .from("loyalty_programs")
            .select("*")
            .eq("restaurant_id", userProfile.restaurant_id)
            .maybeSingle();
            
          // Calculate points earned (rounded down)
          if (program && program.is_enabled) {
            loyalty_points_earned = Math.floor((actualTotal / program.amount_per_point) * program.points_per_amount);
          } else {
            // Default: 1 point per 100 units of currency
            loyalty_points_earned = Math.floor(actualTotal / 100);
          }
          
          if (loyalty_points_earned > 0) {
            // Update customer points
            const newPoints = (customer.loyalty_points || 0) + loyalty_points_earned;
            
            const { error: updateError } = await supabase
              .from("customers")
              .update({ 
                loyalty_points: newPoints,
                total_spent: customer.total_spent + actualTotal,
                visit_count: customer.visit_count + 1,
                average_order_value: (customer.total_spent + actualTotal) / (customer.visit_count + 1),
                last_visit_date: new Date().toISOString()
              })
              .eq("id", customer.id);
              
            if (updateError) throw updateError;
            
            // Record transaction
            await supabase.from("loyalty_transactions").insert({
              customer_id: customer.id,
              restaurant_id: userProfile.restaurant_id,
              transaction_type: 'earn',
              points: loyalty_points_earned,
              source: 'order',
              source_id: order.id
            });
            
            // Record activity
            await supabase.from("customer_activities").insert({
              customer_id: customer.id,
              restaurant_id: userProfile.restaurant_id,
              activity_type: 'order_placed',
              description: `Earned ${loyalty_points_earned} points from order of ₹${actualTotal}`
            });
          }
          
          // Handle reward redemption if a reward was used
          if (selectedReward) {
            // Deduct points for reward
            const newPoints = customer.loyalty_points - selectedReward.points_required;
            
            const { error: pointsError } = await supabase
              .from("customers")
              .update({ loyalty_points: newPoints })
              .eq("id", customer.id);
              
            if (pointsError) throw pointsError;
            
            // Record redemption
            await supabase.from("loyalty_redemptions").insert({
              customer_id: customer.id,
              restaurant_id: userProfile.restaurant_id,
              reward_id: selectedReward.id,
              order_id: order.id,
              points_used: selectedReward.points_required,
              discount_applied: discount
            });
            
            // Record transaction
            await supabase.from("loyalty_transactions").insert({
              customer_id: customer.id,
              restaurant_id: userProfile.restaurant_id,
              transaction_type: 'redeem',
              points: -selectedReward.points_required,
              source: 'order',
              source_id: order.id,
              notes: `Redeemed ${selectedReward.name}`
            });
            
            // Record activity
            await supabase.from("customer_activities").insert({
              customer_id: customer.id,
              restaurant_id: userProfile.restaurant_id,
              activity_type: 'order_placed',
              description: `Redeemed ${selectedReward.name} for a discount of ₹${discount}`
            });
          }
        } else if (customerName) {
          // If customer exists but is not in loyalty program, still update their stats
          const { data: existingCustomer } = await supabase
            .from("customers")
            .select("*")
            .eq("restaurant_id", userProfile.restaurant_id)
            .eq("name", customerName)
            .maybeSingle();
            
          if (existingCustomer) {
            await supabase
              .from("customers")
              .update({ 
                total_spent: existingCustomer.total_spent + actualTotal,
                visit_count: existingCustomer.visit_count + 1,
                average_order_value: (existingCustomer.total_spent + actualTotal) / (existingCustomer.visit_count + 1),
                last_visit_date: new Date().toISOString()
              })
              .eq("id", existingCustomer.id);
              
            // Record activity
            await supabase.from("customer_activities").insert({
              customer_id: existingCustomer.id,
              restaurant_id: userProfile.restaurant_id,
              activity_type: 'order_placed',
              description: `Placed order of ₹${actualTotal}`
            });
          }
        }
        
        // Send order to kitchen
        await supabase.from("kitchen_orders").insert({
          order_id: order.id,
          restaurant_id: userProfile.restaurant_id,
          items: orderItems,
          source: "pos",
          status: "new"
        });
        
        return { 
          success: true, 
          orderId: order.id,
          loyaltyPointsEarned: loyalty_points_earned,
          rewardUsed: selectedReward ? selectedReward.name : null
        };
      } catch (error) {
        console.error("Error completing order:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setProcessing(false);
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      
      let message = `Payment successful! Order completed.`;
      if (data.loyaltyPointsEarned > 0) {
        message += ` Customer earned ${data.loyaltyPointsEarned} loyalty points.`;
      }
      if (data.rewardUsed) {
        message += ` Applied reward: ${data.rewardUsed}.`;
      }
      
      toast({
        title: "Order Completed",
        description: message,
      });
      
      onPaymentComplete();
    },
    onError: (error) => {
      setProcessing(false);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "There was an error processing the payment. Please try again.",
      });
      console.error("Payment error:", error);
    },
  });

  const handleCompleteOrder = () => {
    if (!customerName) {
      toast({
        variant: "destructive",
        title: "Customer Required",
        description: "Please select a customer before completing the order.",
      });
      return;
    }

    completeOrder.mutate();
  };

  const formatRewardDescription = (reward: any) => {
    switch (reward.reward_type) {
      case 'discount_amount':
        return `₹${reward.reward_value} off`;
      case 'discount_percentage':
        return `${reward.reward_value}% off`;
      case 'free_item':
        return `Free item (worth ₹${reward.reward_value})`;
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="space-y-4">
              <div>
                <Label>Payment Method</Label>
                <Tabs 
                  defaultValue="cash" 
                  className="mt-2" 
                  value={paymentMethod} 
                  onValueChange={setPaymentMethod}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="cash">Cash</TabsTrigger>
                    <TabsTrigger value="card">Card</TabsTrigger>
                    <TabsTrigger value="upi">UPI</TabsTrigger>
                  </TabsList>
                  <TabsContent value="cash" className="pt-4">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="amount-paid">Amount Paid (₹)</Label>
                        <Input
                          id="amount-paid"
                          type="number"
                          min={0}
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Change</Label>
                        <div className="p-2 bg-muted rounded-md mt-1">
                          <span className="text-lg font-semibold">
                            ₹{change.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        {[100, 200, 500, 2000].map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setAmountPaid(amount.toString())}
                          >
                            ₹{amount}
                          </Button>
                        ))}
                      </div>

                      <div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setAmountPaid(actualTotal.toString())}
                        >
                          Exact Amount (₹{actualTotal.toFixed(2)})
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="card" className="space-y-4 pt-4">
                    <div className="flex items-center justify-center h-32 border rounded-md">
                      <div className="text-center">
                        <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Process card payment on your terminal</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="upi" className="space-y-4 pt-4">
                    <div className="flex items-center justify-center h-32 border rounded-md">
                      <div className="text-center">
                        <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Show QR code to customer or enter UPI ID</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {customer && customer.loyalty_enrolled && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-amber-500" />
                        <h4 className="font-semibold">Loyalty Program</h4>
                      </div>
                      <Badge className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {customer.loyalty_points} points
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {!showRewards && availableRewards.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setShowRewards(true)}
                        >
                          View Available Rewards
                        </Button>
                      )}
                      
                      {showRewards && (
                        <div className="border rounded-md p-3 space-y-2">
                          <h5 className="text-sm font-medium">Available Rewards</h5>
                          {isLoadingRewards ? (
                            <div className="flex justify-center py-3">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : availableRewards.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No rewards available with current points
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {availableRewards.map((reward) => (
                                <div 
                                  key={reward.id} 
                                  className="flex items-center justify-between border-b pb-2"
                                >
                                  <div>
                                    <div className="font-medium text-sm">{reward.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Coins className="h-3 w-3" />
                                      {reward.points_required} points • {formatRewardDescription(reward)}
                                    </div>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleApplyReward(reward)}
                                  >
                                    Apply
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full mt-2"
                            onClick={() => setShowRewards(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                      
                      {selectedReward && (
                        <div className="border rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-medium">
                                Applied Reward: {selectedReward.name}
                              </h5>
                              <p className="text-xs text-muted-foreground">
                                {formatRewardDescription(selectedReward)} • {selectedReward.points_required} points
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setSelectedReward(null)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
                <div className="space-y-2">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}

                  <Separator className="my-2" />

                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(orderTotal)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount</span>
                      <span>- {formatCurrency(discount)}</span>
                    </div>
                  )}

                  <Separator className="my-2" />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(actualTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                onClick={handleCompleteOrder}
                disabled={processing}
                className="w-full"
              >
                {processing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Complete Payment
              </Button>

              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={processing}
                className="w-full"
              >
                Cancel
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Customer: <span className="font-medium">{customerName || "Guest"}</span>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
