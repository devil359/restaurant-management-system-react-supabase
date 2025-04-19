
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Printer, Eye, Edit, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface OrderItem {
  name: string;
  quantity: number;
  notes?: string[];
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
  } | null;
  onPrintBill?: () => void;
  onEditOrder?: () => void;
}

const OrderDetailsDialog = ({ isOpen, onClose, order, onPrintBill, onEditOrder }: OrderDetailsDialogProps) => {
  const { toast } = useToast();
  
  if (!order) return null;

  // Calculate total
  const total = order.items.reduce((sum, item) => {
    // Assuming each item costs 10 for this example - you should replace with actual prices
    return sum + (item.quantity * 10);
  }, 0);

  const handlePrintBill = async () => {
    try {
      const element = document.getElementById('bill-content');
      if (!element) return;

      const canvas = await html2canvas(element);
      const pdf = new jsPDF();
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`order-bill-${order.id}.pdf`);

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

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>
        
        <div id="bill-content" className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Order Information</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Order ID:</dt>
                  <dd>{order.id.slice(0, 8)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Source:</dt>
                  <dd>{order.source}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status:</dt>
                  <dd className="capitalize">{order.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created:</dt>
                  <dd>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">Items</h3>
              <ul className="space-y-2">
                {order.items.map((item, index) => (
                  <li key={index} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>₹{item.quantity * 10}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-2 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onEditOrder}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Order
          </Button>
          <Button variant="outline" onClick={handlePrintBill}>
            <Printer className="w-4 h-4 mr-2" />
            Print Bill
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
