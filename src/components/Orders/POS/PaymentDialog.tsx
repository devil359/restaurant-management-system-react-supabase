
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { OrderItem } from "@/types/orders";
import { useQuery } from "@tanstack/react-query";

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
  const [discountPercent, setDiscountPercent] = useState(0);
  
  // Fetch available promotions for discount selection
  const { data: promotions } = useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.restaurant_id) return [];

      const { data, error } = await supabase
        .from("promotion_campaigns")
        .select("*")
        .eq("restaurant_id", profile.restaurant_id)
        .gte("end_date", new Date().toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen
  });
  
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = subtotal * (discountPercent / 100);
  const tax = (subtotal - discount) * 0.10; // 10% tax
  const total = subtotal - discount + tax;

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
        description: "Please enter customer name to complete payment",
      });
      return;
    }

    try {
      // Get restaurant_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profile?.restaurant_id) {
        // Add to customer_insights if this is a new customer or update if existing
        const { data: existingCustomer } = await supabase
          .from("customer_insights")
          .select("*")
          .eq("customer_name", customerName)
          .eq("restaurant_id", profile.restaurant_id)
          .maybeSingle();
          
        if (existingCustomer) {
          // Update existing customer
          await supabase
            .from("customer_insights")
            .update({
              visit_count: (existingCustomer.visit_count || 0) + 1,
              total_spent: (existingCustomer.total_spent || 0) + total,
              average_order_value: (((existingCustomer.total_spent || 0) + total) / ((existingCustomer.visit_count || 0) + 1)),
              last_visit: new Date().toISOString()
            })
            .eq("customer_name", customerName)
            .eq("restaurant_id", profile.restaurant_id);
        } else {
          // Create new customer record
          await supabase
            .from("customer_insights")
            .insert({
              customer_name: customerName,
              restaurant_id: profile.restaurant_id,
              visit_count: 1,
              total_spent: total,
              average_order_value: total,
              first_visit: new Date().toISOString(),
              last_visit: new Date().toISOString()
            });
        }
      }

      handlePrintBill();
      toast({
        title: "Payment Successful",
        description: "Order has been completed",
      });
      onSuccess();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "An error occurred while processing payment",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Payment</h2>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Customer Details</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Customer Name *</label>
                  <Input 
                    placeholder="Enter customer name" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    className="h-8"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Phone Number</label>
                  <Input 
                    placeholder="Enter phone number" 
                    value={customerPhone} 
                    onChange={(e) => setCustomerPhone(e.target.value)} 
                    className="h-8"
                  />
                </div>
              </div>
            </div>
            
            <div id="payment-summary" className="border rounded p-4">
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
                
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Discount</span>
                    <Select value={discountPercent.toString()} onValueChange={(value) => setDiscountPercent(Number(value))}>
                      <SelectTrigger className="h-7 w-28">
                        <SelectValue placeholder="Select discount" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="15">15%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
                
                {promotions?.length > 0 && (
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Promotion</span>
                      <Select onValueChange={(value) => {
                        const selectedPromo = promotions.find(p => p.id === value);
                        if (selectedPromo) {
                          setDiscountPercent(selectedPromo.discount_percentage);
                        }
                      }}>
                        <SelectTrigger className="h-7 w-40">
                          <SelectValue placeholder="Select promotion" />
                        </SelectTrigger>
                        <SelectContent>
                          {promotions.map(promo => (
                            <SelectItem key={promo.id} value={promo.id}>
                              {promo.name} ({promo.discount_percentage}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
