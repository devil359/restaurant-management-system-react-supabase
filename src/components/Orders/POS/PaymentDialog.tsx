import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Printer, Edit, Trash2 } from 'lucide-react';
import type { OrderItem } from "@/types/orders";

type PaymentStep = 'confirm' | 'method' | 'qr' | 'success';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  onSuccess: () => void;
  tableNumber?: string;
  onEditOrder?: () => void;
}

const PaymentDialog = ({ 
  isOpen, 
  onClose, 
  orderItems, 
  onSuccess,
  tableNumber = '',
  onEditOrder 
}: PaymentDialogProps) => {
  const [sendToMobile, setSendToMobile] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch restaurant info
  const { data: restaurantInfo } = useQuery({
    queryKey: ['restaurant-info'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.restaurant_id) return null;
      
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', profile.restaurant_id)
        .single();
      
      return data;
    }
  });

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 0.10; // 10% tax (5% CGST + 5% SGST)
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSendToMobile(false);
      setCustomerName('');
      setCustomerMobile('');
    }
  }, [isOpen]);

  const handleEditOrder = () => {
    onClose();
    onEditOrder?.();
  };

  const handleDeleteOrder = () => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      toast({
        title: "Order Deleted",
        description: "The order has been cancelled."
      });
      onSuccess();
      onClose();
    }
  };

  const handlePrintAndSend = async () => {
    if (sendToMobile) {
      // Validate inputs
      if (!customerName || !customerMobile) {
        toast({
          title: "Missing Information",
          description: "Please enter customer name and mobile number.",
          variant: "destructive"
        });
        return;
      }

      if (!/^\d{10}$/.test(customerMobile)) {
        toast({
          title: "Invalid Mobile Number",
          description: "Please enter a valid 10-digit mobile number.",
          variant: "destructive"
        });
        return;
      }

      try {
        setIsLoading(true);

        // Call backend to save customer and send SMS
        const { data, error } = await supabase.functions.invoke('send-bill-link', {
          body: {
            customerName,
            customerMobile,
            orderItems,
            subtotal,
            tax,
            total,
            tableNumber,
            restaurantId: restaurantInfo?.id
          }
        });

        if (error) throw error;

        toast({
          title: "Bill Sent Successfully!",
          description: `Bill sent to ${customerMobile}`
        });
      } catch (error) {
        console.error('Error sending bill:', error);
        toast({
          title: "Send Failed",
          description: "Could not send bill. Will print only.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    // Trigger browser print dialog
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto no-print">
        <VisuallyHidden>
          <DialogTitle>Order Payment</DialogTitle>
        </VisuallyHidden>

        <div className="space-y-6 p-2">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Bill Preview</h2>
            <p className="text-muted-foreground">
              {tableNumber ? `Table ${tableNumber}` : 'POS Order'}
            </p>
          </div>

          {/* Printable Bill Content */}
          <div className="printable-area">
            <Card className="p-4 bg-muted/50">
              <div className="space-y-3">
                {/* Restaurant Header - Only shows in print */}
                <div className="hidden print:block text-center mb-4">
                  <h2 className="text-xl font-bold">{restaurantInfo?.name || 'Restaurant'}</h2>
                  <p className="text-xs">{restaurantInfo?.address}</p>
                  <p className="text-xs">Ph: {restaurantInfo?.phone}</p>
                  {restaurantInfo?.gstin && <p className="text-xs">GSTIN: {restaurantInfo?.gstin}</p>}
                  <div className="border-t border-dashed border-gray-400 my-2"></div>
                  <div className="flex justify-between text-xs">
                    <div>
                      <p>Bill No.: #{Date.now().toString().slice(-6)}</p>
                      {customerName && <p>To: {customerName}</p>}
                      {customerMobile && <p>Ph: {customerMobile}</p>}
                    </div>
                    <div className="text-right">
                      <p>Date: {new Date().toLocaleDateString('en-IN')}</p>
                      <p>Time: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-gray-400 my-2"></div>
                </div>

                {/* Items List */}
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                
                <Separator className="my-3" />
                
                <div className="flex justify-between text-sm">
                  <span>Sub Total</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CGST @ 5.0%</span>
                  <span>₹{(subtotal * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>SGST @ 5.0%</span>
                  <span>₹{(subtotal * 0.05).toFixed(2)}</span>
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Net Amount</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>

                {/* Footer - Only shows in print */}
                <div className="hidden print:block text-center mt-4">
                  <div className="border-t border-dashed border-gray-400 my-2"></div>
                  <p className="text-sm font-semibold">!! Please visit again !!</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Send to Mobile Option */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="sendToMobile" 
              checked={sendToMobile}
              onCheckedChange={(checked) => setSendToMobile(checked as boolean)}
            />
            <Label htmlFor="sendToMobile" className="text-sm font-medium cursor-pointer">
              Send bill to customer's mobile
            </Label>
          </div>

          {/* Customer Details (shown when checkbox is checked) */}
          {sendToMobile && (
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input
                type="tel"
                placeholder="Mobile Number (e.g., 9876543210)"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                maxLength={10}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleEditOrder} className="w-full">
              <Edit className="w-4 h-4 mr-2" />
              Edit Order
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder} className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>

          <Button 
            onClick={handlePrintAndSend}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white"
            size="lg"
          >
            <Printer className="w-4 h-4 mr-2" />
            {isLoading ? "Sending..." : (sendToMobile ? "Send & Print Bill" : "Print Bill")}
          </Button>
        </div>
      </DialogContent>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            font-family: 'Courier New', Courier, monospace;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </Dialog>
  );
};

export default PaymentDialog;
