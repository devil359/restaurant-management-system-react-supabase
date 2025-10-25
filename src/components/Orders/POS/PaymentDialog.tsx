import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Receipt, CreditCard, Wallet, QrCode, Check, Printer, Trash2, Plus, X, Search } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import type { OrderItem } from "@/types/orders";
import { Input } from "@/components/ui/input";

type PaymentStep = 'confirm' | 'method' | 'qr' | 'success' | 'edit';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  onSuccess: () => void;
  tableNumber?: string;
  onEditOrder?: () => void;
  orderId?: string; // Kitchen order ID to update status
}

const PaymentDialog = ({ 
  isOpen, 
  onClose, 
  orderItems, 
  onSuccess,
  tableNumber = '',
  onEditOrder,
  orderId 
}: PaymentDialogProps) => {
  const [currentStep, setCurrentStep] = useState<PaymentStep>('confirm');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [sendBillToMobile, setSendBillToMobile] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [newItemsBuffer, setNewItemsBuffer] = useState<OrderItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Fetch menu items for edit mode
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items-for-edit'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.restaurant_id) return [];
      
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', profile.restaurant_id)
        .eq('is_available', true)
        .order('name');
      
      return data || [];
    },
    enabled: isOpen
  });

  // Fetch payment settings
  const { data: paymentSettings } = useQuery({
    queryKey: ['payment-settings', restaurantInfo?.restaurantId || restaurantInfo?.id],
    queryFn: async () => {
      const restaurantIdToUse = restaurantInfo?.restaurantId || restaurantInfo?.id;
      if (!restaurantIdToUse) return null;
      
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('restaurant_id', restaurantIdToUse)
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
    enabled: !!(restaurantInfo?.restaurantId || restaurantInfo?.id)
  });

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // const taxRate = 0.10; // 10% tax
  // const tax = subtotal * taxRate;
  // const total = subtotal + tax;

   const taxRate = 0.10; // 10% tax

  const total = subtotal;

  // Generate QR code when UPI method is selected
  useEffect(() => {
    if (paymentSettings?.upi_id) {
      const upiUrl = `upi://pay?pa=${paymentSettings.upi_id}&pn=${encodeURIComponent(restaurantInfo?.name || 'Restaurant')}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${tableNumber || 'POS'}`)}`;
      
      QRCode.toDataURL(upiUrl, { width: 300, margin: 2 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('QR generation error:', err));
    }
  }, [currentStep, paymentSettings, total, restaurantInfo, tableNumber]);

  // Fetch existing customer details if orderId exists
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (orderId && isOpen) {
        try {
          const { data: kitchenOrder } = await supabase
            .from('kitchen_orders')
            .select('order_id')
            .eq('id', orderId)
            .single();

          if (kitchenOrder?.order_id) {
            const { data: order } = await supabase
              .from('orders')
              .select('customer_name, customer_phone')
              .eq('id', kitchenOrder.order_id)
              .single();

            if (order) {
              if (order.customer_name) setCustomerName(order.customer_name);
              if (order.customer_phone) {
                setCustomerMobile(order.customer_phone);
                setSendBillToMobile(true);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching customer details:', error);
        }
      }
    };

    fetchCustomerDetails();
  }, [orderId, isOpen]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('confirm');
      setCustomerName('');
      setCustomerMobile('');
      setSendBillToMobile(false);
      setQrCodeUrl('');
      setMenuSearchQuery('');
      setNewItemsBuffer([]);
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleEditOrder = () => {
    setCurrentStep('edit');
    setNewItemsBuffer([]);
    setMenuSearchQuery('');
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm('Are you sure you want to delete this order permanently? This action cannot be undone.')) {
      return;
    }

    try {
      if (orderId) {
        // First, get the order_id from kitchen_orders to delete related order
        const { data: kitchenOrder } = await supabase
          .from('kitchen_orders')
          .select('order_id')
          .eq('id', orderId)
          .single();

        // Delete from kitchen_orders table
        const { error: kitchenError } = await supabase
          .from('kitchen_orders')
          .delete()
          .eq('id', orderId);

        if (kitchenError) throw kitchenError;

        // Delete corresponding order from orders table if it exists
        if (kitchenOrder?.order_id) {
          const { error: orderError } = await supabase
            .from('orders')
            .delete()
            .eq('id', kitchenOrder.order_id);

          if (orderError) console.error('Error deleting from orders table:', orderError);
        }

        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-orders'] });
      }

      toast({
        title: "Order Deleted Successfully",
        description: "The order has been permanently deleted."
      });
      
      onClose();
      onSuccess(); // Refresh the order list
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the order. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddMenuItem = (item: any) => {
    // Check if item already exists in buffer
    const existingIndex = newItemsBuffer.findIndex(bufferItem => bufferItem.name === item.name);
    
    if (existingIndex >= 0) {
      // Increase quantity if item exists
      setNewItemsBuffer(prev => 
        prev.map((bufferItem, idx) => 
          idx === existingIndex 
            ? { ...bufferItem, quantity: bufferItem.quantity + 1 }
            : bufferItem
        )
      );
      toast({
        title: "Quantity Increased",
        description: `${item.name} quantity increased to ${newItemsBuffer[existingIndex].quantity + 1}.`
      });
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: `new-${Date.now()}-${Math.random()}`,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        modifiers: []
      };
      setNewItemsBuffer(prev => [...prev, newItem]);
      toast({
        title: "Item Added",
        description: `${item.name} added to new items list.`
      });
    }
  };

  const handleRemoveNewItem = (itemId: string) => {
    setNewItemsBuffer(prev => prev.filter(item => item.id !== itemId));
  };

  const handleRemoveExistingItem = async (itemIndex: number) => {
    if (!orderId) return;

    try {
      // Get current order
      const { data: currentOrder, error: fetchError } = await supabase
        .from('kitchen_orders')
        .select('items')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Remove the item at the specified index
      const updatedItems = [...(currentOrder?.items || [])];
      updatedItems.splice(itemIndex, 1);

      // Update the order
      const { error: updateError } = await supabase
        .from('kitchen_orders')
        .update({ 
          items: updatedItems,
          status: 'new'
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      toast({
        title: "Item Removed",
        description: "Item has been removed from the order."
      });

      // Refresh the order data
      onSuccess();
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Failed to Remove Item",
        description: "There was an error removing the item.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateNewItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveNewItem(itemId);
      return;
    }
    setNewItemsBuffer(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleSaveNewItems = async () => {
    if (newItemsBuffer.length === 0) {
      toast({
        title: "No Items to Add",
        description: "Please add at least one item from the menu.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (!orderId) {
        toast({
          title: "Error",
          description: "Order ID not found. Cannot add items.",
          variant: "destructive"
        });
        return;
      }

      // Get restaurant ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.restaurant_id) throw new Error('Restaurant not found');

      // Get current order to update items
      const { data: currentOrder, error: fetchError } = await supabase
        .from('kitchen_orders')
        .select('items')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Normalize old items to ensure they are objects
      const normalizedOldItems = (currentOrder?.items || []).map(item => {
        if (typeof item === 'string') {
          // Parse string format "1x Item Name" to object
          const match = item.match(/^(\d+)x\s+(.+)$/);
          if (match) {
            return { name: match[2], quantity: parseInt(match[1]), price: 0 };
          }
          return { name: item, quantity: 1, price: 0 };
        }
        return item;
      });

      // Convert newItemsBuffer to proper format
      const formattedNewItems = newItemsBuffer.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      // Combine old items with new items as objects
      const combinedItems = [...normalizedOldItems, ...formattedNewItems];

      // Update the order with new items
      const { error: updateError } = await supabase
        .from('kitchen_orders')
        .update({ 
          items: combinedItems,
          status: 'new'
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      toast({
        title: "Items Added Successfully",
        description: `${newItemsBuffer.length} new item(s) have been sent to the kitchen.`
      });

      // Update the local orderItems and go back to confirm step
      setCurrentStep('confirm');
      setNewItemsBuffer([]);
      onSuccess(); // Refresh the order list
    } catch (error) {
      console.error('Error adding items to order:', error);
      toast({
        title: "Failed to Add Items",
        description: "There was an error adding items to the order.",
        variant: "destructive"
      });
    }
  };

  // Filter menu items based on search
  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(menuSearchQuery.toLowerCase()))
  );

  const saveCustomerDetails = async (): Promise<boolean> => {
    // If checkbox not checked, return success
    if (!sendBillToMobile) return true;

    // Validate inputs
    if (!customerName.trim()) {
      toast({
        title: "Customer Name Required",
        description: "Please enter customer name to send bill.",
        variant: "destructive"
      });
      return false;
    }

    if (!customerMobile.trim()) {
      toast({
        title: "Mobile Number Required",
        description: "Please enter mobile number to send bill.",
        variant: "destructive"
      });
      return false;
    }

    // Validate mobile number (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(customerMobile.trim())) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive"
      });
      return false;
    }

    setIsSaving(true);

    try {
      // If orderId exists, update the corresponding order record
      if (orderId) {
        const { data: kitchenOrder } = await supabase
          .from('kitchen_orders')
          .select('order_id')
          .eq('id', orderId)
          .single();

        if (kitchenOrder?.order_id) {
          const { error } = await supabase
            .from('orders')
            .update({
              customer_name: customerName.trim(),
              customer_phone: customerMobile.trim()
            })
            .eq('id', kitchenOrder.order_id);

          if (error) throw error;
        }
      }

      setIsSaving(false);
      return true;
    } catch (error) {
      console.error('Error saving customer details:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save customer details. Please try again.",
        variant: "destructive"
      });
      setIsSaving(false);
      return false;
    }
  };

  const sendBillViaWhatsApp = async () => {
    if (!sendBillToMobile || !customerMobile) return;

    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-bill', {
        body: {
          phoneNumber: customerMobile,
          restaurantName: restaurantInfo?.name || 'Restaurant',
          customerName: customerName || 'Valued Customer',
          total: total,
          roomName: tableNumber || 'POS',
          checkoutDate: new Date().toLocaleDateString('en-IN'),
          billingId: orderId || 'N/A'
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Bill Sent Successfully",
          description: `Bill has been sent to ${customerMobile} via WhatsApp.`
        });
      } else {
        toast({
          title: "Failed to Send Bill",
          description: data?.message || "There was an error sending the bill.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending WhatsApp bill:', error);
      toast({
        title: "WhatsApp Send Failed",
        description: "Failed to send bill via WhatsApp. Please check Twilio settings.",
        variant: "destructive"
      });
    }
  };

  const handlePrintBill = async () => {
    // Save customer details first
    const saved = await saveCustomerDetails();
    if (!saved) return;
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
      const billNumber = `#${Date.now().toString().slice(-6)}`;
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
        doc.text(tableNumber ? `Table: ${tableNumber}` : 'POS Order', 5, yPos);
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
      orderItems.forEach(item => {
        const itemName = doc.splitTextToSize(item.name, 35);
        doc.text(itemName, 5, yPos);
        doc.text(item.quantity.toString(), pageWidth - 35, yPos, { align: 'center' });
        doc.text(item.price.toFixed(2), pageWidth - 20, yPos, { align: 'right' });
        doc.text((item.price * item.quantity).toFixed(2), pageWidth - 5, yPos, { align: 'right' });
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
      
      // const cgstRate = taxRate / 2;
      // const sgstRate = taxRate / 2;
      // const cgst = subtotal * cgstRate;
      // const sgst = subtotal * sgstRate;

      const cgstRate = 0;
      const sgstRate = 0;
      const cgst = 0;
      const sgst = 0;
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
      doc.text('Net Amount:', pageWidth - 75, yPos);
      doc.text(`₹${total.toFixed(2)}`, pageWidth - 10, yPos, { align: 'right' });
      yPos += 8;
      
      // Add QR code if UPI is configured and we're in QR step
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
      
      // Send bill via WhatsApp if checkbox is checked
      if (sendBillToMobile && customerMobile) {
        await sendBillViaWhatsApp();
      }
      
      toast({
        title: "Bill Generated",
        description: sendBillToMobile 
          ? "Bill has been generated and sent to customer's mobile."
          : "The bill has been generated and sent to printer."
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
          description: "Please configure UPI settings in the Payment Settings tab first.",
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
      
      // Update order status to completed in database if orderId is provided
      if (orderId) {
        const { error } = await supabase
          .from('kitchen_orders')
          .update({ status: 'completed' })
          .eq('id', orderId);
        
        if (error) {
          console.error('Error updating order status:', error);
          toast({
            title: "Warning",
            description: "Payment received but order status update failed.",
            variant: "destructive"
          });
        }
      }
      
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
        <Button 
          variant="outline" 
          onClick={handlePrintBill} 
          className="w-full"
          disabled={isSaving}
        >
          <Printer className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Print Bill"}
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

      {/* Send Bill to Mobile Checkbox and Inputs */}
      <Card className="p-4 bg-muted/30 border-2 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="send-bill-checkbox"
              checked={sendBillToMobile}
              onChange={(e) => setSendBillToMobile(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              htmlFor="send-bill-checkbox"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Send bill to customer's mobile
            </label>
          </div>

          {sendBillToMobile && (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full"
                  maxLength={10}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      <Button 
        onClick={async () => {
          const saved = await saveCustomerDetails();
          if (saved) setCurrentStep('method');
        }}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        size="lg"
        disabled={isSaving}
      >
        {isSaving ? "Saving Details..." : "Proceed to Payment Methods"}
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

  const renderEditStep = () => (
    <div className="space-y-4 p-2">
      <Button
        variant="ghost"
        onClick={() => setCurrentStep('confirm')}
        className="mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Order
      </Button>

      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-foreground mb-1">Edit Order</h2>
        <p className="text-sm text-muted-foreground">
          Add new items to {tableNumber ? `Table ${tableNumber}` : 'this order'}
        </p>
      </div>

      {/* Previously Sent Items */}
      <Card className="p-4 bg-muted/30">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          Previously Sent Items
        </h3>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {orderItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex-1">{item.quantity}x {item.name}</span>
              <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveExistingItem(idx)}
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* New Items to Add */}
      {newItemsBuffer.length > 0 && (
        <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-green-700 dark:text-green-400">
            <Plus className="w-4 h-4" />
            New Items to Add
          </h3>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {newItemsBuffer.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <span className="text-sm flex-1">{item.name}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateNewItemQuantity(item.id, item.quantity - 1)}
                    className="h-7 w-7 p-0"
                  >
                    -
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateNewItemQuantity(item.id, item.quantity + 1)}
                    className="h-7 w-7 p-0"
                  >
                    +
                  </Button>
                  <span className="text-sm font-medium w-16 text-right">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveNewItem(item.id)}
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search Menu Items */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={menuSearchQuery}
            onChange={(e) => setMenuSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Menu Items List */}
        <Card className="max-h-64 overflow-y-auto">
          <div className="p-2 space-y-1">
            {filteredMenuItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {menuSearchQuery ? 'No items found matching your search' : 'No menu items available'}
              </p>
            ) : (
              filteredMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddMenuItem(item)}
                  className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors text-left"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.category && (
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">₹{item.price.toFixed(2)}</span>
                    <Plus className="w-4 h-4 text-green-600" />
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-2">
        <Button 
          onClick={handleSaveNewItems}
          disabled={newItemsBuffer.length === 0}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          <Check className="w-4 h-4 mr-2" />
          Save & Send New Items to Kitchen
        </Button>
        <Button 
          onClick={() => setCurrentStep('confirm')}
          variant="outline"
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>
            {currentStep === 'confirm' && 'Confirm Order'}
            {currentStep === 'method' && 'Select Payment Method'}
            {currentStep === 'qr' && 'UPI Payment'}
            {currentStep === 'success' && 'Payment Successful'}
            {currentStep === 'edit' && 'Edit Order'}
          </DialogTitle>
        </VisuallyHidden>
        {currentStep === 'confirm' && renderConfirmStep()}
        {currentStep === 'method' && renderMethodStep()}
        {currentStep === 'qr' && renderQRStep()}
        {currentStep === 'success' && renderSuccessStep()}
        {currentStep === 'edit' && renderEditStep()}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
