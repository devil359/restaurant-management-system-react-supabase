
import { useState } from 'react';
import { QSROrderItem } from '@/types/qsr';
import { Button } from '@/components/ui/button';
import { Trash2, X, CreditCard, Save, Plus, Minus, PackagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QSROrderPadProps {
    items: QSROrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    onIncrement: (id: string) => void;
    onDecrement: (id: string) => void;
    onRemove: (id: string) => void;
    onClear: () => void;
    onSendToKitchen: () => void;
    onHold: () => void;
    onPay: () => void;
    onAddCustomItem: (item: QSROrderItem) => void;
    loading: boolean;
    tableNumber?: string | null;
    mode: string;
}

export const QSROrderPad = ({
    items,
    subtotal,
    tax,
    total,
    onIncrement,
    onDecrement,
    onRemove,
    onClear,
    onSendToKitchen,
    onHold,
    onPay,
    onAddCustomItem,
    loading,
    tableNumber,
    mode
}: QSROrderPadProps) => {
    const [showCustomItem, setShowCustomItem] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [customQuantity, setCustomQuantity] = useState('1');

    const handleAddCustom = () => {
        if (!customName || !customPrice) return;

        const newItem: QSROrderItem = {
            menuItemId: `custom-${crypto.randomUUID()}`,
            name: customName,
            price: parseFloat(customPrice),
            quantity: parseInt(customQuantity) || 1,
            category: 'Custom',
            modifiers: []
        };

        onAddCustomItem(newItem);
        setShowCustomItem(false);
        setCustomName('');
        setCustomPrice('');
        setCustomQuantity('1');
    };

    return (
        <div className="flex flex-col h-full bg-white border-r">
            {/* Header Info */}
            <div className="p-3 bg-slate-100 border-b flex justify-between items-center">
                <div>
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Mode</span>
                    <div className="font-bold text-primary capitalize">{mode.replace('_', ' ')}</div>
                </div>
                {tableNumber && (
                    <div className="text-right">
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Table</span>
                        <div className="font-bold text-xl">{tableNumber}</div>
                    </div>
                )}
            </div>

            {/* Order List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                        <div className="text-4xl mb-2">🛒</div>
                        <p>Order is empty</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.menuItemId} className="flex flex-col bg-slate-50 p-2 rounded border group">
                            <div className="flex justify-between items-start">
                                <span className="font-medium text-sm line-clamp-2">{item.name}</span>
                                <span className="font-bold text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex items-center gap-1 bg-white rounded border shadow-sm">
                                    <button
                                        onClick={() => onDecrement(item.menuItemId)}
                                        className="p-1 hover:bg-slate-100 text-slate-600"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                    <button
                                        onClick={() => onIncrement(item.menuItemId)}
                                        className="p-1 hover:bg-slate-100 text-slate-600"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => onRemove(item.menuItemId)}
                                    className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Totals Section */}
            <div className="p-4 bg-slate-50 border-t space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax:</span>
                    <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-slate-900 border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span>₹{total.toFixed(2)}</span>
                </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="p-3 bg-white border-t space-y-3">
                <Button
                    variant="outline"
                    onClick={() => setShowCustomItem(true)}
                    className="w-full border-dashed border-2 border-slate-300 hover:border-primary hover:text-primary"
                >
                    <PackagePlus className="w-4 h-4 mr-2" /> Add Custom Item
                </Button>

                <div className="grid grid-cols-2 gap-3">
                    <Button
                        onClick={onSendToKitchen}
                        disabled={items.length === 0 || loading}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        Send to Kitchen
                    </Button>
                    <Button
                        onClick={onHold}
                        disabled={items.length === 0 || loading}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        Hold Order
                    </Button>
                </div>

                <Button
                    onClick={onPay}
                    disabled={items.length === 0 || loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    <CreditCard className="w-5 h-5 mr-2" /> Proceed to Payment
                </Button>

                <Button
                    variant="outline"
                    onClick={onClear}
                    disabled={items.length === 0 || loading}
                    className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent shadow-none"
                >
                    Clear Order
                </Button>
            </div>

            <Dialog open={showCustomItem} onOpenChange={setShowCustomItem}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Custom Item</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Item Name</Label>
                            <Input
                                placeholder="e.g. Special Pasta"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Price (₹)</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={customPrice}
                                    onChange={(e) => setCustomPrice(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={customQuantity}
                                    onChange={(e) => setCustomQuantity(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCustomItem(false)}>Cancel</Button>
                        <Button onClick={handleAddCustom} disabled={!customName || !customPrice}>Add Item</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
