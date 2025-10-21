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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Printer, Edit, Trash2, CreditCard, Wallet, QrCode, ArrowLeft, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';
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
  const [currentStep, setCurrentStep] = useState<PaymentStep>('confirm');
  const [sendToMobile, setSendToMobile] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
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

  // Fetch payment settings (fallback to restaurants.upi_id)
  const { data: paymentSettings } = useQuery({
    queryKey: ['payment-settings', restaurantInfo?.id],
    enabled: !!restaurantInfo?.id,
    queryFn: async () => {
      const rid = restaurantInfo!.id as string;
      // Primary: latest payment_settings
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('restaurant_id', rid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) console.error('Error fetching payment settings:', error);
      if (data) return data;

      // Fallback: restaurants table
      const { data: rest, error: restErr } = await supabase
        .from('restaurants')
        .select('upi_id, payment_gateway_enabled, name')
        .eq('id', rid)
        .maybeSingle();
      if (restErr) console.error('Error fetching restaurant fallback:', restErr);
      if (rest) {
        return {
          upi_id: rest.upi_id,
          upi_name: rest.name,
          is_active: rest.payment_gateway_enabled,
        } as any;
      }
      return null;
    }
  });

  const queryClient = useQueryClient();
  useEffect(() => {
    if (!restaurantInfo?.id) return;
    const channel = supabase
      .channel('payment-settings-pos-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payment_settings',
        filter: `restaurant_id=eq.${restaurantInfo.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['payment-settings', restaurantInfo.id] });
        queryClient.invalidateQueries({ queryKey: ['payment-settings'], exact: false });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantInfo?.id, queryClient]);

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 0.10; // 10% tax (5% CGST + 5% SGST)
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Generate QR code when needed
  useEffect(() => {
    const generateQR = async () => {
      if (currentStep === 'qr' && paymentSettings?.upi_id) {
        const upiString = `upi://pay?pa=${paymentSettings.upi_id}&pn=${encodeURIComponent(restaurantInfo?.name || 'Restaurant')}&am=${total.toFixed(2)}&cu=INR`;
        try {
          const qr = await QRCode.toDataURL(upiString);
          setQrCodeUrl(qr);
        } catch (err) {
          console.error('QR Code generation error:', err);
        }
      }
    };
    generateQR();
  }, [currentStep, paymentSettings, restaurantInfo, total]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('confirm');
      setSendToMobile(false);
      setCustomerName('');
      setCustomerMobile('');
      setQrCodeUrl('');
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

  const handleMethodSelect = async (method: 'cash' | 'card' | 'upi') => {
    if (method === 'upi') {
      if (!paymentSettings?.upi_id) {
        toast({
          title: "UPI Not Configured",
          description: "Please configure UPI settings in Payment Settings.",
          variant: "destructive"
        });
        return;
      }
      setCurrentStep('qr');
    } else {
      await handleMarkAsPaid(method);
    }
  };

  const handleMarkAsPaid = async (method: string) => {
    try {
      setIsLoading(true);
      
      // Here you would typically update the order status in database
      toast({
        title: "Payment Received",
        description: `Order marked as paid via ${method}`,
      });
      
      setCurrentStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintBill = async () => {
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

        // Call backend to save customer and send SMS with web link
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
          description: `Bill link sent to ${customerMobile}`
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

    // Always trigger browser print dialog
    window.print();
  };

  const renderConfirmStep = () => (
    <>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Confirm Order</h2>
        <p className="text-sm text-muted-foreground">
          Review the details for POS Order
        </p>
      </div>

      <Card className="p-4 bg-muted/50">
        <div className="space-y-3">
          {orderItems.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.name}</span>
              <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          
          <Separator className="my-3" />
          
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Tax (10%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          
          <Separator className="my-3" />
          
          <div className="flex justify-between text-lg font-bold">
            <span>Total Due</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={handleEditOrder} className="w-full">
          <Edit className="w-4 h-4 mr-2" />
          Edit Order
        </Button>
        <Button variant="outline" onClick={() => setCurrentStep('confirm')} className="w-full no-print">
          <Printer className="w-4 h-4 mr-2" />
          Print Bill
        </Button>
      </div>

      <Button 
        variant="destructive" 
        onClick={handleDeleteOrder}
        className="w-full"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Order
      </Button>

      <Button 
        onClick={() => setCurrentStep('method')}
        className="w-full"
        size="lg"
      >
        Proceed to Payment Methods
      </Button>
    </>
  );

  const renderMethodStep = () => (
    <>
      <Button
        variant="ghost"
        onClick={() => setCurrentStep('confirm')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Payment Method</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Total: ₹{total.toFixed(2)}
        </p>
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full h-16 text-lg"
          onClick={() => handleMethodSelect('cash')}
        >
          <Wallet className="w-6 h-6 mr-3" />
          Cash
        </Button>

        <Button
          variant="outline"
          className="w-full h-16 text-lg"
          onClick={() => handleMethodSelect('card')}
        >
          <CreditCard className="w-6 h-6 mr-3" />
          Card
        </Button>

        <Button
          variant="outline"
          className="w-full h-16 text-lg"
          onClick={() => handleMethodSelect('upi')}
        >
          <QrCode className="w-6 h-6 mr-3" />
          UPI / QR
        </Button>
      </div>
    </>
  );

  const renderQRStep = () => (
    <>
      <Button
        variant="ghost"
        onClick={() => setCurrentStep('method')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Scan to Pay</h2>
        <p className="text-sm text-muted-foreground">
          Amount: ₹{total.toFixed(2)}
        </p>
      </div>

      {qrCodeUrl && (
        <div className="flex justify-center my-6">
          <img src={qrCodeUrl} alt="UPI QR Code" className="w-64 h-64" />
        </div>
      )}

      <Button
        onClick={() => handleMarkAsPaid('upi')}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? "Processing..." : "Mark as Paid"}
      </Button>
    </>
  );

  const renderSuccessStep = () => (
    <div className="text-center py-8">
      <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
      <p className="text-muted-foreground">
        Order completed successfully
      </p>
    </div>
  );

  const renderPrintBillView = () => (
    <>
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
      <div className="flex items-center space-x-2 no-print">
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
        <div className="space-y-3 no-print">
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

      <Button 
        onClick={handlePrintBill}
        disabled={isLoading}
        className="w-full no-print"
        size="lg"
      >
        <Printer className="w-4 h-4 mr-2" />
        {isLoading ? "Sending..." : (sendToMobile ? "Send & Print Bill" : "Print Bill")}
      </Button>

      <Button 
        variant="outline"
        onClick={() => setCurrentStep('confirm')}
        className="w-full no-print"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Order
      </Button>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>Order Payment</DialogTitle>
        </VisuallyHidden>

        <div className="space-y-6 p-2">
          {currentStep === 'confirm' && renderConfirmStep()}
          {currentStep === 'confirm' && renderPrintBillView()}
          {currentStep === 'method' && renderMethodStep()}
          {currentStep === 'qr' && renderQRStep()}
          {currentStep === 'success' && renderSuccessStep()}
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
