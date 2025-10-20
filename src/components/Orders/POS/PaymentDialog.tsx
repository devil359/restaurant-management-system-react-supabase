
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, DollarSign, X, QrCode, Copy, Smartphone, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import QRCode from 'qrcode';
import type { OrderItem } from "@/types/orders";

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
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrData, setQrData] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.10; // 10% tax
  const total = subtotal + tax;

  // Fetch restaurant ID
  useEffect(() => {
    const fetchRestaurantId = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      setRestaurantId(profile?.restaurant_id || null);
    };
    
    if (isOpen) {
      fetchRestaurantId();
    }
  }, [isOpen]);

  // Fetch payment settings
  const { data: paymentSettings } = useQuery({
    queryKey: ['payment-settings', restaurantId],
    enabled: !!restaurantId && isOpen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Generate QR code when UPI is selected
  useEffect(() => {
    if (showQRPayment && paymentSettings?.upi_id) {
      const upiId = paymentSettings.upi_id;
      const payeeName = paymentSettings.upi_name || 'Restaurant';
      const formattedAmount = parseFloat(total.toFixed(2));
      const invoiceNumber = `POS-${Date.now()}`;
      const paymentUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`POS Order - ${invoiceNumber}`)}`;
      
      setQrData(paymentUrl);

      // Generate QR code
      QRCode.toDataURL(paymentUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then((url) => {
          setQrCodeUrl(url);
        })
        .catch((err) => {
          console.error('Error generating QR code:', err);
        });
    }
  }, [showQRPayment, total, paymentSettings]);

  // Timer countdown
  useEffect(() => {
    if (showQRPayment && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showQRPayment, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyUPIId = () => {
    const upiId = paymentSettings?.upi_id || '';
    navigator.clipboard.writeText(upiId);
    toast({
      title: "UPI ID Copied",
      description: "UPI ID has been copied to clipboard",
    });
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
      
      // Add QR code to PDF if UPI payment and QR code exists
      if (paymentMethod === 'upi' && qrCodeUrl) {
        const qrSize = 50;
        const qrX = (210 - qrSize) / 2; // Center horizontally
        const qrY = imgHeight + 10; // Below the bill content
        
        pdf.addImage(qrCodeUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        
        // Add text below QR code
        pdf.setFontSize(10);
        pdf.text('Scan to pay via UPI', 105, qrY + qrSize + 5, { align: 'center' });
        
        if (paymentSettings?.upi_id) {
          pdf.setFontSize(8);
          pdf.text(`UPI ID: ${paymentSettings.upi_id}`, 105, qrY + qrSize + 10, { align: 'center' });
        }
      }
      
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
        const { data: existingCustomers } = await supabase
          .from("customers")
          .select("id, total_spent, visit_count")
          .eq("restaurant_id", profile.restaurant_id)
          .eq("phone", customerPhone)
          .maybeSingle();

        const orderTotal = total;
        
        if (existingCustomers) {
          // Update existing customer
          await supabase
            .from("customers")
            .update({
              name: customerName, // Update name in case it changed
              total_spent: existingCustomers.total_spent + orderTotal,
              visit_count: existingCustomers.visit_count + 1,
              last_visit_date: new Date().toISOString(),
              average_order_value: (existingCustomers.total_spent + orderTotal) / (existingCustomers.visit_count + 1)
            })
            .eq("id", existingCustomers.id);
            
          // Add activity for the customer
          await supabase.rpc("add_customer_activity", {
            customer_id_param: existingCustomers.id,
            restaurant_id_param: profile.restaurant_id,
            activity_type_param: "order_placed",
            description_param: `Placed order for ₹${orderTotal.toFixed(2)}`
          });
        } else if (customerPhone) {
          // Only create a new customer if phone is provided
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
              loyalty_points: 0,
              loyalty_tier: 'None',
              tags: []
            })
            .select()
            .single();
            
          if (newCustomer) {
            // Add activity for the new customer
            await supabase.rpc("add_customer_activity", {
              customer_id_param: newCustomer.id,
              restaurant_id_param: profile.restaurant_id,
              activity_type_param: "order_placed",
              description_param: `Placed first order for ₹${orderTotal.toFixed(2)}`
            });
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Payment Processing
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Customer Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-sm font-medium">Customer Name*</Label>
              <Input 
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="text-sm font-medium">Customer Phone</Label>
              <Input 
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter phone number"
                className="focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Order Summary Card */}
          <Card id="payment-summary" className="p-4 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Order Summary</h3>
            <div className="space-y-2">
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{item.quantity}x {item.name}</span>
                  <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              
              <div className="border-t pt-3 mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tax (10%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="text-purple-600">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Payment Method */}
          <div>
            <Label className="text-sm font-medium">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(value) => {
              setPaymentMethod(value);
              if (value === 'upi') {
                setShowQRPayment(true);
                setTimeLeft(300); // Reset timer
              } else {
                setShowQRPayment(false);
              }
            }}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI/QR Code</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* QR Code Payment Section */}
          {showQRPayment && paymentSettings?.upi_id && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="space-y-4">
                {/* Timer */}
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <Timer className="h-4 w-4" />
                  Time remaining: {formatTime(timeLeft)}
                </div>

                {/* QR Code */}
                {qrCodeUrl ? (
                  <div className="text-center">
                    <div className="w-48 h-48 bg-white border-4 border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
                      <img 
                        src={qrCodeUrl} 
                        alt="UPI Payment QR Code" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Scan QR code with any UPI app to pay
                    </p>
                    
                    {/* UPI Apps */}
                    <div className="flex justify-center gap-3 mb-4">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        GPay
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        PhonePe
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        Paytm
                      </Badge>
                    </div>

                    <Separator className="my-4" />

                    {/* Manual UPI Payment */}
                    <div className="text-left">
                      <p className="text-sm font-medium mb-2">Or pay manually using UPI ID:</p>
                      <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border">
                        <span className="text-sm font-mono flex-1">
                          {paymentSettings.upi_id}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={copyUPIId}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Amount: ₹{total.toFixed(2)} • Note: POS Order
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <QrCode className="h-20 w-20 text-gray-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm text-gray-500">Generating QR Code...</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {!paymentSettings?.upi_id && paymentMethod === 'upi' && (
            <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                UPI payment is not configured. Please contact the administrator to set up UPI payment settings.
              </p>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrintBill}>
                <Printer className="w-4 h-4 mr-2" />
                Print Bill
              </Button>
              <Button 
                onClick={handleCompletePayment}
                className="bg-purple-600 hover:bg-purple-700"
              >
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
