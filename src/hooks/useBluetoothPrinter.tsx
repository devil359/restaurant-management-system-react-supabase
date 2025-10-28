/// <reference path="../types/bluetooth.d.ts" />

import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface PrintData {
  restaurantName: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  customerName?: string;
  customerMobile?: string;
  orderItems: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  discount?: number;
  total: number;
  paymentMethod?: string;
  tableNumber?: string;
  billNumber?: string;
  date: string;
}

export const useBluetoothPrinter = () => {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Check if Web Bluetooth is supported
  const isBluetoothSupported = useCallback(() => {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }, []);

  // ESC/POS Commands for 58mm thermal printer
  const ESC = '\x1B';
  const GS = '\x1D';
  
  const commands = {
    INIT: `${ESC}@`,           // Initialize printer
    ALIGN_CENTER: `${ESC}a1`,  // Center align
    ALIGN_LEFT: `${ESC}a0`,    // Left align
    ALIGN_RIGHT: `${ESC}a2`,   // Right align
    BOLD_ON: `${ESC}E1`,       // Bold on
    BOLD_OFF: `${ESC}E0`,      // Bold off
    DOUBLE_HEIGHT: `${GS}!1`,  // Double height
    NORMAL_SIZE: `${GS}!0`,    // Normal size
    CUT_PAPER: `${GS}V66\x00`, // Cut paper
    LINE_FEED: '\n',
    SEPARATOR: '--------------------------------\n'
  };

  // Connect to Bluetooth printer
  const connectPrinter = useCallback(async () => {
    if (!isBluetoothSupported()) {
      toast({
        title: "Bluetooth Not Supported",
        description: "Web Bluetooth is not supported on this device. Use Chrome on Android.",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsConnecting(true);
      
      // Request Bluetooth device
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] }, // Common thermal printer service
        ],
        optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb']
      });

      if (!device) {
        throw new Error('No device selected');
      }

      setDevice(device);
      setIsConnected(true);
      
      toast({
        title: "Printer Connected",
        description: `Connected to ${device.name || 'Thermal Printer'}`,
      });

      return true;
    } catch (error: any) {
      console.error('Bluetooth connection error:', error);
      
      let errorMessage = "Failed to connect to printer";
      if (error.message.includes('User cancelled')) {
        errorMessage = "Connection cancelled by user";
      } else if (error.message.includes('No device')) {
        errorMessage = "No printer selected";
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isBluetoothSupported, toast]);

  // Format text to fit 58mm width (32 characters)
  const formatLine = (left: string, right: string, width: number = 32): string => {
    const rightPadded = right.padStart(right.length);
    const availableSpace = width - rightPadded.length;
    const leftTrimmed = left.length > availableSpace 
      ? left.substring(0, availableSpace - 3) + '...'
      : left;
    const spaces = width - leftTrimmed.length - rightPadded.length;
    return leftTrimmed + ' '.repeat(Math.max(0, spaces)) + rightPadded + '\n';
  };

  // Print receipt
  const printReceipt = useCallback(async (data: PrintData) => {
    if (!device) {
      const connected = await connectPrinter();
      if (!connected) return false;
    }

    try {
      // Connect to GATT server
      const server = await device!.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      // Get the printer service (Common ESC/POS thermal printer UUID)
      const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
      
      // Get the characteristic for writing (Common characteristic UUID)
      const characteristic = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');

      // Build receipt content
      let receipt = commands.INIT;
      
      // Header
      receipt += commands.ALIGN_CENTER;
      receipt += commands.DOUBLE_HEIGHT + commands.BOLD_ON;
      receipt += data.restaurantName + commands.LINE_FEED;
      receipt += commands.NORMAL_SIZE + commands.BOLD_OFF;
      
      if (data.restaurantAddress) {
        receipt += data.restaurantAddress + commands.LINE_FEED;
      }
      if (data.restaurantPhone) {
        receipt += `Ph: ${data.restaurantPhone}` + commands.LINE_FEED;
      }
      
      receipt += commands.SEPARATOR;
      
      // Bill info
      receipt += commands.ALIGN_LEFT;
      if (data.billNumber) {
        receipt += `Bill#: ${data.billNumber}` + commands.LINE_FEED;
      }
      receipt += `Date: ${data.date}` + commands.LINE_FEED;
      if (data.tableNumber) {
        receipt += `Table: ${data.tableNumber}` + commands.LINE_FEED;
      }
      if (data.customerName) {
        receipt += `Customer: ${data.customerName}` + commands.LINE_FEED;
      }
      if (data.customerMobile) {
        receipt += `Mobile: ${data.customerMobile}` + commands.LINE_FEED;
      }
      
      receipt += commands.SEPARATOR;
      
      // Items header
      receipt += commands.BOLD_ON;
      receipt += formatLine('Item', 'Amount', 32);
      receipt += commands.BOLD_OFF;
      receipt += commands.SEPARATOR;
      
      // Items
      data.orderItems.forEach(item => {
        const itemLine = `${item.name}`;
        const qtyLine = `  ${item.quantity}x${item.price.toFixed(2)}`;
        const amountLine = `₹${(item.price * item.quantity).toFixed(2)}`;
        
        receipt += formatLine(itemLine, '', 32);
        receipt += formatLine(qtyLine, amountLine, 32);
      });
      
      receipt += commands.SEPARATOR;
      
      // Totals
      receipt += formatLine('Subtotal:', `₹${data.subtotal.toFixed(2)}`, 32);
      
      if (data.discount && data.discount > 0) {
        receipt += formatLine('Discount:', `-₹${data.discount.toFixed(2)}`, 32);
      }
      
      receipt += commands.BOLD_ON;
      receipt += formatLine('TOTAL:', `₹${data.total.toFixed(2)}`, 32);
      receipt += commands.BOLD_OFF;
      
      if (data.paymentMethod) {
        receipt += formatLine('Payment:', data.paymentMethod.toUpperCase(), 32);
      }
      
      receipt += commands.SEPARATOR;
      
      // Footer
      receipt += commands.ALIGN_CENTER;
      receipt += commands.LINE_FEED;
      receipt += 'Thank You!' + commands.LINE_FEED;
      receipt += 'Please Visit Again!' + commands.LINE_FEED;
      receipt += commands.LINE_FEED;
      receipt += commands.LINE_FEED;
      
      // Cut paper
      receipt += commands.CUT_PAPER;
      
      // Convert string to ArrayBuffer
      const encoder = new TextEncoder();
      const data_to_send = encoder.encode(receipt);
      
      // Send to printer in chunks (max 512 bytes per chunk for BLE)
      const chunkSize = 512;
      for (let i = 0; i < data_to_send.length; i += chunkSize) {
        const chunk = data_to_send.slice(i, Math.min(i + chunkSize, data_to_send.length));
        await characteristic.writeValue(chunk);
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      toast({
        title: "Print Successful",
        description: "Receipt sent to thermal printer",
      });
      
      return true;
    } catch (error: any) {
      console.error('Print error:', error);
      
      toast({
        title: "Print Failed",
        description: error.message || "Failed to print receipt",
        variant: "destructive"
      });
      
      // Reset connection on error
      setIsConnected(false);
      setDevice(null);
      
      return false;
    }
  }, [device, connectPrinter, toast, commands, formatLine]);

  // Disconnect printer
  const disconnect = useCallback(() => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    setDevice(null);
    setIsConnected(false);
    
    toast({
      title: "Disconnected",
      description: "Printer disconnected",
    });
  }, [device, toast]);

  return {
    isBluetoothSupported: isBluetoothSupported(),
    isConnected,
    isConnecting,
    connectPrinter,
    printReceipt,
    disconnect,
    device
  };
};
