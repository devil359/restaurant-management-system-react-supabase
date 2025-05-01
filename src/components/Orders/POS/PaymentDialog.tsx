
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, CreditCard, Landmark, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OrderItem } from "@/types/orders";
import { Customer } from "@/types/customer";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderItems: OrderItem[];
  onSuccess: () => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({ 
  open, 
  onOpenChange, 
  orderItems, 
  onSuccess 
}) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">("card");
  const [processing, setProcessing] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Calculate order total
  const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Search customer by phone number
  const handleCustomerSearch = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", customerPhone)
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Convert the data to a Customer type
        const customer = {
          ...data,
          loyalty_tier: calculateLoyaltyTier(data.total_spent, data.visit_count, 0)
        } as Customer;
        
        setSelectedCustomer(customer);
        toast({
          title: "Customer Found",
          description: `Found customer: ${data.name}`
        });
      }
    } catch (error) {
      console.error("Error searching for customer:", error);
      setSelectedCustomer(null);
      toast({
        variant: "destructive",
        title: "Customer Not Found",
        description: "No customer found with that phone number."
      });
    }
  };
  
  // Calculate loyalty tier based on customer data
  function calculateLoyaltyTier(
    totalSpent: number,
    visitCount: number,
    daysSinceFirstVisit: number
  ): Customer['loyalty_tier'] {
    // Simplified loyalty tier calculation
    if (totalSpent > 20000 && visitCount > 15) return "Diamond";
    if (totalSpent > 10000 && visitCount > 10) return "Platinum";
    if (totalSpent > 5000 && visitCount > 8) return "Gold";
    if (totalSpent > 2500 && visitCount > 5) return "Silver";
    if (totalSpent > 1000 || visitCount > 3) return "Bronze";
    return "None";
  }

  const handleProcessPayment = async () => {
    try {
      setProcessing(true);
      
      // Get current user and restaurant
      const { data: profileData } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", profileData.user!.id)
        .single();
        
      if (!userProfile?.restaurant_id) {
        throw new Error("No restaurant found for user");
      }
      
      // Prepare order data
      const orderData = {
        restaurant_id: userProfile.restaurant_id,
        total: orderTotal,
        status: "completed",
        items: orderItems.map(item => item.name),
        customer_name: selectedCustomer ? selectedCustomer.name : "Guest"
      };
      
      // Save order to database
      const { data, error } = await supabase
        .from("orders")
        .insert([orderData])
        .select();
        
      if (error) throw error;
      
      // Update customer data if selected
      if (selectedCustomer) {
        const newTotalSpent = selectedCustomer.total_spent + orderTotal;
        const newVisitCount = selectedCustomer.visit_count + 1;
        const newAvgOrder = newTotalSpent / newVisitCount;
        
        // Update customer stats
        await supabase
          .from("customers")
          .update({
            total_spent: newTotalSpent,
            visit_count: newVisitCount,
            average_order_value: newAvgOrder,
            last_visit_date: new Date().toISOString()
          })
          .eq("id", selectedCustomer.id);
          
        // Add loyalty points if enrolled
        if (selectedCustomer.loyalty_enrolled) {
          const pointsToAdd = Math.floor(orderTotal / 100); // 1 point per ₹100
          
          if (pointsToAdd > 0) {
            // Add points to customer
            await supabase
              .from("customers")
              .update({
                loyalty_points: selectedCustomer.loyalty_points + pointsToAdd
              })
              .eq("id", selectedCustomer.id);
              
            // Record transaction if table exists
            try {
              await supabase
                .from("loyalty_transactions")
                .insert({
                  customer_id: selectedCustomer.id,
                  restaurant_id: userProfile.restaurant_id,
                  transaction_type: "earn",
                  points: pointsToAdd,
                  source: "order",
                  source_id: data[0].id,
                  notes: `Earned from order #${data[0].id.substring(0, 8)}`
                });
            } catch (txnError) {
              console.error("Could not record loyalty transaction:", txnError);
              // Non-blocking error, continue with order
            }
          }
        }
      }
      
      // Success notification
      toast({
        title: "Payment Complete",
        description: "The order has been processed successfully."
      });
      
      // Reset and close
      setPaymentMethod("card");
      setCustomerPhone("");
      setSelectedCustomer(null);
      onSuccess();
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "There was a problem processing the payment."
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-6">
            <p className="text-lg font-semibold">Total Amount: ₹{orderTotal.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">
              {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerPhone">Link to Customer (Optional)</Label>
              <div className="flex mt-1.5 gap-2">
                <input
                  id="customerPhone"
                  type="tel"
                  placeholder="Customer phone number"
                  className="flex-1 border rounded px-3 py-2"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <Button variant="outline" onClick={handleCustomerSearch} disabled={!customerPhone}>
                  Find
                </Button>
              </div>
              
              {selectedCustomer && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-2" />
                    <span>{selectedCustomer.name}</span>
                  </div>
                  {selectedCustomer.loyalty_enrolled && (
                    <div className="text-xs mt-1 text-green-600">
                      +{Math.floor(orderTotal / 100)} loyalty points will be added
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <Label>Payment Method</Label>
              <RadioGroup 
                className="mt-2 grid grid-cols-3 gap-2" 
                value={paymentMethod} 
                onValueChange={(value) => setPaymentMethod(value as any)}
              >
                <Label 
                  htmlFor="card" 
                  className={`flex flex-col items-center justify-center border rounded-md p-3 cursor-pointer ${paymentMethod === "card" ? 'bg-primary/10 border-primary' : ''}`}
                >
                  <RadioGroupItem id="card" value="card" className="sr-only" />
                  <CreditCard className="h-6 w-6 mb-1" />
                  <span className="text-xs">Card</span>
                </Label>
                
                <Label 
                  htmlFor="cash" 
                  className={`flex flex-col items-center justify-center border rounded-md p-3 cursor-pointer ${paymentMethod === "cash" ? 'bg-primary/10 border-primary' : ''}`}
                >
                  <RadioGroupItem id="cash" value="cash" className="sr-only" />
                  <Banknote className="h-6 w-6 mb-1" />
                  <span className="text-xs">Cash</span>
                </Label>
                
                <Label 
                  htmlFor="upi" 
                  className={`flex flex-col items-center justify-center border rounded-md p-3 cursor-pointer ${paymentMethod === "upi" ? 'bg-primary/10 border-primary' : ''}`}
                >
                  <RadioGroupItem id="upi" value="upi" className="sr-only" />
                  <Landmark className="h-6 w-6 mb-1" />
                  <span className="text-xs">UPI</span>
                </Label>
              </RadioGroup>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleProcessPayment} disabled={processing}>
              {processing ? "Processing..." : "Complete Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
