import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Printer, Edit, DollarSign, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import AddOrderForm from "./AddOrderForm";
import { Order } from "@/types/orders";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  } | null;
  onPrintBill?: () => void;
  onEditOrder?: (orderId: string) => void;
}

const OrderDetailsDialog = ({ isOpen, onClose, order, onPrintBill, onEditOrder }: OrderDetailsDialogProps) => {
  const { toast } = useToast();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  if (!order) return null;

  // Calculate total - use the provided price from the item itself
  const total = order.items.reduce((sum, item) => {
    // Make sure we're using the actual price from the menu item
    const price = item.price || 0;
    return sum + (item.quantity * price);
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

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("kitchen_orders")
        .update({ status: newStatus })
        .eq("id", order.id);
        
      if (error) throw error;
      
      toast({
        title: "Order Updated",
        description: `Order status updated to ${newStatus}`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update order status",
      });
    }
  };

  const handleProceedToPayment = () => {
    setShowPaymentDialog(true);
  };

  const handleOpenEditForm = () => {
    setShowEditForm(true);
  };

  // Convert the kitchen order to the format expected by AddOrderForm
  const prepareOrderForEdit = (): Order | null => {
    try {
      // Create a synthetic order object matching the Order interface
      return {
        id: order.id,
        customer_name: order.source,
        items: order.items.map(item => `${item.quantity}x ${item.name}`),
        total: total,
        status: order.status,
        created_at: order.created_at,
        restaurant_id: "", // Will be filled by the form
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error preparing order for edit:', error);
      return null;
    }
  };

  if (showEditForm) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {
        setShowEditForm(false);
        onClose();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AddOrderForm 
            onSuccess={() => {
              setShowEditForm(false);
              onClose();
            }}
            onCancel={() => {
              setShowEditForm(false);
              onClose();
            }}
            editingOrder={prepareOrderForEdit()}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (showPaymentDialog) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>₹{item.price ? (item.price * item.quantity).toFixed(2) : '0.00'}</span>
                  </div>
                ))}
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax (10%)</span>
                    <span>₹{(total * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2">
                    <span>Total</span>
                    <span>₹{(total * 1.1).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
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

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handlePrintBill}>
                <Printer className="w-4 h-4 mr-2" />
                Print Bill
              </Button>
              <Button onClick={() => handleUpdateStatus('completed')}>
                Complete Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>View and manage order details</DialogDescription>
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
              <ul className="space-y-2 max-h-40 overflow-auto">
                {order.items.map((item, index) => (
                  <li key={index} className="flex justify-between text-sm">
                    <span className="truncate flex-1">{item.quantity}x {item.name}</span>
                    <span className="pl-2">₹{item.price ? (item.quantity * item.price).toFixed(2) : '0.00'}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-2 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 mt-4">
          {order.status === "new" && (
            <Button variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100" onClick={() => handleUpdateStatus("preparing")}>
              <Edit className="w-4 h-4 mr-2" />
              Mark Preparing
            </Button>
          )}
          
          {order.status === "preparing" && (
            <Button variant="outline" className="bg-green-50 text-green-600 hover:bg-green-100" onClick={() => handleUpdateStatus("ready")}>
              <Check className="w-4 h-4 mr-2" />
              Mark Ready
            </Button>
          )}
          
          {order.status === "ready" && (
            <Button 
              variant="secondary" 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleProceedToPayment}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Proceed to Payment
            </Button>
          )}
          
          <Button variant="outline" onClick={handleOpenEditForm}>
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
