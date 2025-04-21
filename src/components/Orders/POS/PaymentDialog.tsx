
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { OrderItem } from "@/types/orders";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  onSuccess: () => void;
}

const PaymentDialog = ({ isOpen, onClose, orderItems, onSuccess }: PaymentDialogProps) => {
  const { toast } = useToast();
  
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.10; // 10% tax
  const total = subtotal + tax;

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

  const handleCompletePayment = () => {
    handlePrintBill();
    toast({
      title: "Payment Successful",
      description: "Order has been completed",
    });
    onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Payment</h2>
          <div className="space-y-4">
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
              <Select defaultValue="cash">
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
