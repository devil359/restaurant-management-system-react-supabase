
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { Printer, Edit, DollarSign, ArrowLeft, CreditCard, Wallet, QrCode, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import QRCode from 'qrcode';

interface OrderItem {
  name: string;
  quantity: number;
  notes?: string[];
  price?: number;
}

interface OrderDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    source: string;
    status: string;
    items: OrderItem[];
    created_at: string;
    total?: number;
  } | null;
  onPrintBill?: () => void;
  onEditOrder?: (order: any) => void;
}

type PaymentStep = 'confirm' | 'method' | 'qr' | 'success';

const OrderDetailsDialog = ({ isOpen, onClose, order, onPrintBill, onEditOrder }: OrderDetailsDialogProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<PaymentStep>('confirm');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
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
      
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('restaurant_id', restaurantInfo.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching payment settings:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!restaurantInfo?.id
  });
  
  if (!order) return null;

  // Calculate totals
  const subtotal = order.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const taxRate = 0.10; // 10% tax
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Generate QR code when UPI method is selected
  useEffect(() => {
    if (currentStep === 'qr' && paymentSettings?.upi_id) {
      const upiUrl = `upi://pay?pa=${paymentSettings.upi_id}&pn=${encodeURIComponent(restaurantInfo?.name || 'Restaurant')}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${order.id}`)}`;
      
      QRCode.toDataURL(upiUrl, { width: 300, margin: 2 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('QR generation error:', err));
    }
  }, [currentStep, paymentSettings, total, restaurantInfo, order.id]);

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
    if (onEditOrder) {
      onEditOrder(order);
      onClose();
    }
  };

  const handleDeleteOrder = async () => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const { error } = await supabase
          .from('kitchen_orders')
          .delete()
          .eq('id', order.id);
          
        if (error) throw error;
        
        toast({
          title: "Order Deleted",
          description: "The order has been cancelled."
        });
        onClose();
      } catch (error) {
        console.error('Error deleting order:', error);
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: "Failed to delete the order"
        });
      }
    }
  };

  const handlePrintBill = async () => {
    try {
      const doc = new jsPDF({
        format: [80, 297], // 80mm thermal printer width
        unit: 'mm'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 10;
      
      // Restaurant Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(restaurantInfo?.name || 'Restaurant', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      if (restaurantInfo?.address) {
        const addressLines = doc.splitTextToSize(restaurantInfo.address, pageWidth - 10);
        doc.text(addressLines, pageWidth / 2, yPos, { align: 'center' });
        yPos += addressLines.length * 4;
      }
      if (restaurantInfo?.phone) {
        doc.text(`Ph: ${restaurantInfo.phone}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 4;
      }
      if (restaurantInfo?.gstin) {
        doc.text(`GSTIN: ${restaurantInfo.gstin}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 4;
      }
      
      // Dashed line
      yPos += 2;
      for (let i = 5; i < pageWidth - 5; i += 2) {
        doc.line(i, yPos, i + 1, yPos);
      }
      yPos += 4;
      
      // Bill details
      doc.setFontSize(8);
      const billNumber = `#${order.id.slice(-6)}`;
      const currentDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      
      doc.text(`Bill No.: ${billNumber}`, 5, yPos);
      doc.text(`Date: ${currentDate}`, pageWidth - 5, yPos, { align: 'right' });
      yPos += 4;
      
      if (customerName) {
        doc.text(`To: ${customerName}`, 5, yPos);
        yPos += 4;
        if (customerMobile) {
          doc.text(`Ph: ${customerMobile}`, 5, yPos);
          yPos += 4;
        }
      } else {
        doc.text(order.source || 'POS Order', 5, yPos);
        yPos += 4;
      }
      
      doc.text(`Time: ${currentTime}`, pageWidth - 5, yPos - 4, { align: 'right' });
      
      // Dashed line
      yPos += 1;
      for (let i = 5; i < pageWidth - 5; i += 2) {
        doc.line(i, yPos, i + 1, yPos);
      }
      yPos += 4;
      
      // Items header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Particulars', 5, yPos);
      doc.text('Qty', pageWidth - 35, yPos, { align: 'center' });
      doc.text('Rate', pageWidth - 20, yPos, { align: 'right' });
      doc.text('Amount', pageWidth - 5, yPos, { align: 'right' });
      yPos += 4;
      
      // Items
      doc.setFont('helvetica', 'normal');
      order.items.forEach(item => {
        const itemName = doc.splitTextToSize(item.name, 35);
        doc.text(itemName, 5, yPos);
        doc.text(item.quantity.toString(), pageWidth - 35, yPos, { align: 'center' });
        doc.text((item.price || 0).toFixed(2), pageWidth - 20, yPos, { align: 'right' });
        doc.text(((item.price || 0) * item.quantity).toFixed(2), pageWidth - 5, yPos, { align: 'right' });
        yPos += Math.max(itemName.length * 3.5, 4);
      });
      
      // Dashed line
      yPos += 1;
      for (let i = 5; i < pageWidth - 5; i += 2) {
        doc.line(i, yPos, i + 1, yPos);
      }
      yPos += 4;
      
      // Totals
      doc.setFontSize(8);
      doc.text('Sub Total:', pageWidth - 35, yPos);
      doc.text(subtotal.toFixed(2), pageWidth - 5, yPos, { align: 'right' });
      yPos += 4;
      
      const cgstRate = taxRate / 2;
      const sgstRate = taxRate / 2;
      const cgst = subtotal * cgstRate;
      const sgst = subtotal * sgstRate;
      
      doc.text(`CGST @ ${(cgstRate * 100).toFixed(1)}%:`, pageWidth - 35, yPos);
      doc.text(cgst.toFixed(2), pageWidth - 5, yPos, { align: 'right' });
      yPos += 4;
      
      doc.text(`SGST @ ${(sgstRate * 100).toFixed(1)}%:`, pageWidth - 35, yPos);
      doc.text(sgst.toFixed(2), pageWidth - 5, yPos, { align: 'right' });
      yPos += 4;
      
      // Dashed line
      for (let i = 5; i < pageWidth - 5; i += 2) {
        doc.line(i, yPos, i + 1, yPos);
      }
      yPos += 4;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Net Amount:', pageWidth - 35, yPos);
      doc.text(`₹${total.toFixed(2)}`, pageWidth - 5, yPos, { align: 'right' });
      yPos += 8;
      
      // Add QR code if UPI is configured
      if (qrCodeUrl && paymentSettings?.upi_id) {
        for (let i = 5; i < pageWidth - 5; i += 2) {
          doc.line(i, yPos, i + 1, yPos);
        }
        yPos += 5;
        
        const qrSize = 35;
        doc.addImage(qrCodeUrl, 'PNG', (pageWidth - qrSize) / 2, yPos, qrSize, qrSize);
        yPos += qrSize + 3;
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('Scan QR to pay', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
      }
      
      // Footer
      for (let i = 5; i < pageWidth - 5; i += 2) {
        doc.line(i, yPos, i + 1, yPos);
      }
      yPos += 5;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('!! Please visit again !!', pageWidth / 2, yPos, { align: 'center' });
      
      // Save and print
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      toast({
        title: "Bill Generated",
        description: "The bill has been generated and sent to printer."
      });
    } catch (error) {
      console.error('Error generating bill:', error);
      toast({
        title: "Print Error",
        description: "Failed to generate bill. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleMethodSelect = (method: string) => {
    if (method === 'upi') {
      if (!paymentSettings?.upi_id) {
        toast({
          title: "UPI Not Configured",
          description: "Please configure UPI settings in the Settings > Payment Settings tab first.",
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
      // Update order status to completed
      const { error } = await supabase
        .from('kitchen_orders')
        .update({ status: 'completed' })
        .eq('id', order.id);
        
      if (error) throw error;
      
      setCurrentStep('success');
      
      toast({
        title: "Payment Successful",
        description: `Order payment of ₹${total.toFixed(2)} received via ${paymentMethod}.`,
      });
      
      // Auto-close after 2 seconds
      setTimeout(() => {
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
        <h2 className="text-2xl font-bold text-foreground mb-2">Order Details</h2>
        <p className="text-muted-foreground">
          {order.source || 'POS Order'}
        </p>
      </div>

      <Card className="p-4 bg-muted/50">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div>
              <span className="text-muted-foreground">Order ID:</span>
              <p className="font-medium">{order.id.slice(-6)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="font-medium capitalize">{order.status}</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Created:</span>
              <p className="font-medium">{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p>
            </div>
          </div>

          <Separator />

          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.name}</span>
              <span className="font-medium">₹{((item.price || 0) * item.quantity).toFixed(2)}</span>
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
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={handleEditOrder} className="w-full">
          <Edit className="w-4 h-4 mr-2" />
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
        Proceed to Payment
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
          The order has been completed.
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
        <VisuallyHidden>
          <DialogTitle>
            {currentStep === 'confirm' && 'Order Details'}
            {currentStep === 'method' && 'Select Payment Method'}
            {currentStep === 'qr' && 'UPI Payment'}
            {currentStep === 'success' && 'Payment Successful'}
          </DialogTitle>
        </VisuallyHidden>
        {currentStep === 'confirm' && renderConfirmStep()}
        {currentStep === 'method' && renderMethodStep()}
        {currentStep === 'qr' && renderQRStep()}
        {currentStep === 'success' && renderSuccessStep()}
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
