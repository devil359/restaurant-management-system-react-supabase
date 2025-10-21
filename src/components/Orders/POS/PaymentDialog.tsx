import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Receipt, CreditCard, Wallet, QrCode, Check, Printer, Trash2 } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
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
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
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

  // Fetch payment settings
  const { data: paymentSettings } = useQuery({
    queryKey: ['payment-settings', restaurantInfo?.id],
    queryFn: async () => {
      if (!restaurantInfo?.id) return null;
      
      const { data } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('restaurant_id', restaurantInfo.id)
        .eq('is_active', true)
        .single();
      
      return data;
    },
    enabled: !!restaurantInfo?.id
  });

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 0.10; // 10% tax
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Generate QR code when UPI method is selected
  useEffect(() => {
    if (currentStep === 'qr' && paymentSettings?.upi_id) {
      const upiUrl = `upi://pay?pa=${paymentSettings.upi_id}&pn=${encodeURIComponent(restaurantInfo?.name || 'Restaurant')}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${tableNumber || 'POS'}`)}`;
      
      QRCode.toDataURL(upiUrl, { width: 300, margin: 2 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('QR generation error:', err));
    }
  }, [currentStep, paymentSettings, total, restaurantInfo, tableNumber]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('confirm');
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
      onClose();
    }
  };

  const handlePrintBill = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Restaurant Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(restaurantInfo?.name || 'Restaurant', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (restaurantInfo?.address) {
      doc.text(restaurantInfo.address, pageWidth / 2, 27, { align: 'center' });
    }
    if (restaurantInfo?.phone) {
      doc.text(`Ph: ${restaurantInfo.phone}`, pageWidth / 2, 32, { align: 'center' });
    }
    if (restaurantInfo?.gstin) {
      doc.text(`GSTIN: ${restaurantInfo.gstin}`, pageWidth / 2, 37, { align: 'center' });
    }
    
    doc.setLineWidth(0.5);
    doc.line(15, 42, pageWidth - 15, 42);
    
    // Bill details
    doc.setFontSize(9);
    const billNumber = `#${Date.now().toString().slice(-6)}`;
    const currentDate = new Date().toLocaleDateString('en-IN');
    const currentTime = new Date().toLocaleTimeString('en-IN');
    
    doc.text(`Bill No.: ${billNumber}`, 15, 48);
    doc.text(`Date: ${currentDate}`, pageWidth - 15, 48, { align: 'right' });
    doc.text(tableNumber ? `Table: ${tableNumber}` : 'POS Order', 15, 53);
    doc.text(`Time: ${currentTime}`, pageWidth - 15, 53, { align: 'right' });
    
    if (customerName) {
      doc.text(`Customer: ${customerName}`, 15, 58);
      if (customerMobile) {
        doc.text(`Ph: ${customerMobile}`, pageWidth - 15, 58, { align: 'right' });
      }
    }
    
    doc.line(15, 63, pageWidth - 15, 63);
    
    // Items header
    doc.setFont('helvetica', 'bold');
    doc.text('Particulars', 15, 69);
    doc.text('Qty', pageWidth - 70, 69);
    doc.text('Rate', pageWidth - 50, 69);
    doc.text('Amount', pageWidth - 15, 69, { align: 'right' });
    
    doc.line(15, 71, pageWidth - 15, 71);
    
    // Items
    doc.setFont('helvetica', 'normal');
    let yPos = 77;
    orderItems.forEach(item => {
      doc.text(item.name, 15, yPos);
      doc.text(item.quantity.toString(), pageWidth - 70, yPos);
      doc.text(`₹${item.price.toFixed(2)}`, pageWidth - 50, yPos);
      doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, pageWidth - 15, yPos, { align: 'right' });
      yPos += 6;
    });
    
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 6;
    
    // Totals
    doc.text('Sub Total:', pageWidth - 70, yPos);
    doc.text(`₹${subtotal.toFixed(2)}`, pageWidth - 15, yPos, { align: 'right' });
    yPos += 5;
    
    doc.text(`Tax @ ${(taxRate * 100).toFixed(0)}%:`, pageWidth - 70, yPos);
    doc.text(`₹${tax.toFixed(2)}`, pageWidth - 15, yPos, { align: 'right' });
    yPos += 5;
    
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Net Amount:', pageWidth - 70, yPos);
    doc.text(`₹${total.toFixed(2)}`, pageWidth - 15, yPos, { align: 'right' });
    
    // Add QR code if available
    if (qrCodeUrl && currentStep === 'qr') {
      yPos += 10;
      doc.addImage(qrCodeUrl, 'PNG', pageWidth / 2 - 20, yPos, 40, 40);
      yPos += 42;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Scan QR to pay', pageWidth / 2, yPos, { align: 'center' });
    }
    
    // Footer
    yPos += 10;
    doc.setFontSize(10);
    doc.text('!! Please visit again !!', pageWidth / 2, yPos, { align: 'center' });
    
    // Print
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
    
    toast({
      title: "Bill Printed",
      description: "The bill has been sent to the printer."
    });
  };

  const handleMethodSelect = (method: string) => {
    if (method === 'upi') {
      if (!paymentSettings?.upi_id) {
        toast({
          title: "UPI Not Configured",
          description: "Please configure UPI settings first.",
          variant: "destructive"
        });
        return;
      }
      setCurrentStep('qr');
    } else {
      // For cash/card, mark as paid immediately
      handleMarkAsPaid(method);
    }
  };

  const handleMarkAsPaid = async (paymentMethod: string = 'upi') => {
    try {
      // Here you would integrate with your payment verification system
      // For now, we'll simulate a successful payment
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentStep('success');
      
      toast({
        title: "Payment Successful",
        description: `Order payment of ₹${total.toFixed(2)} received via ${paymentMethod}.`,
      });
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an error processing the payment.",
        variant: "destructive"
      });
    }
  };

  const renderConfirmStep = () => (
    <div className="space-y-6 p-2">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Confirm Order</h2>
        <p className="text-muted-foreground">
          Review the details for {tableNumber ? `Table ${tableNumber}` : 'POS Order'}
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
          <div className="flex justify-between text-sm">
            <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
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
          <Receipt className="w-4 h-4 mr-2" />
          Edit Order
        </Button>
        <Button variant="outline" onClick={handlePrintBill} className="w-full">
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
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        size="lg"
      >
        Proceed to Payment Methods
      </Button>
    </div>
  );

  const renderMethodStep = () => (
    <div className="space-y-6 p-2">
      <Button
        variant="ghost"
        onClick={() => setCurrentStep('confirm')}
        className="mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Order
      </Button>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Select Payment Method</h2>
        <p className="text-lg text-blue-600 font-semibold">
          Total Amount: ₹{total.toFixed(2)}
        </p>
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          onClick={() => handleMethodSelect('cash')}
          className="w-full h-16 text-lg justify-start hover:bg-accent"
        >
          <Wallet className="w-6 h-6 mr-3" />
          Cash
        </Button>

        <Button
          variant="outline"
          onClick={() => handleMethodSelect('card')}
          className="w-full h-16 text-lg justify-start hover:bg-accent"
        >
          <CreditCard className="w-6 h-6 mr-3" />
          Card
        </Button>

        <Button
          variant="outline"
          onClick={() => handleMethodSelect('upi')}
          className="w-full h-16 text-lg justify-start border-2 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
        >
          <QrCode className="w-6 h-6 mr-3" />
          UPI / QR Code
        </Button>
      </div>
    </div>
  );

  const renderQRStep = () => (
    <div className="space-y-6 p-2">
      <Button
        variant="ghost"
        onClick={() => setCurrentStep('method')}
        className="mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Methods
      </Button>

      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Scan to Pay</h2>
        <p className="text-muted-foreground">
          Ask the customer to scan the QR code using any UPI app
          <br />
          (Google Pay, PhonePe, etc.)
        </p>

        {qrCodeUrl ? (
          <div className="flex justify-center my-6">
            <div className="bg-white p-4 rounded-lg shadow-lg border-4 border-gray-200">
              <img src={qrCodeUrl} alt="UPI QR Code" className="w-64 h-64" />
            </div>
          </div>
        ) : (
          <div className="flex justify-center my-6">
            <div className="bg-muted p-4 rounded-lg w-64 h-64 flex items-center justify-center">
              <p className="text-muted-foreground">Generating QR code...</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Amount to be Paid:</p>
          <p className="text-4xl font-bold text-blue-600">₹{total.toFixed(2)}</p>
        </div>
      </div>

      <Button 
        onClick={() => handleMarkAsPaid('upi')}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        size="lg"
      >
        Mark as Paid
      </Button>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center py-8 p-2">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
          <Check className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
        <p className="text-muted-foreground">
          The order for {tableNumber ? `Table ${tableNumber}` : 'POS'} is now complete.
        </p>
      </div>

      <Button 
        onClick={onClose}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        size="lg"
      >
        Close
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {currentStep === 'confirm' && renderConfirmStep()}
        {currentStep === 'method' && renderMethodStep()}
        {currentStep === 'qr' && renderQRStep()}
        {currentStep === 'success' && renderSuccessStep()}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
