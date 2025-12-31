import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MenuItemsGrid } from './MenuItemsGrid';
import { QSRCategoryGrid } from './QSRCategoryGrid';
import { QSROrderPad } from './QSROrderPad';
import { QSRTableGrid } from './QSRTableGrid';
import { OrderHistory } from './OrderHistory';
import { QSROrderItem, ViewMode, OrderMode } from '@/types/qsr';
import { useRestaurantId } from '@/hooks/useRestaurantId';
import { useQSRMenuItems, QSRMenuItem } from '@/hooks/useQSRMenuItems';
import { ArrowLeft, History, LogOut, ShoppingBag, Truck, Gift, Zap, LayoutGrid, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import PaymentDialog from '@/components/Orders/POS/PaymentDialog';
import ActiveOrdersList from '@/components/Orders/ActiveOrdersList';

const TAX_RATE = 0;

export const QSRPosMain = () => {
  const { restaurantId } = useRestaurantId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Custom toast wrapper to match existing code usage
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    toast({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      description: message,
      variant: type === 'error' ? 'destructive' : 'default',
    });
  };



  const [viewMode, setViewMode] = useState<ViewMode>('order');
  const [orderMode, setOrderMode] = useState<OrderMode>('dine_in');
  const [selectedTable, setSelectedTable] = useState<{ id: string, name: string } | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showActiveOrders, setShowActiveOrders] = useState(false);

  // Fetch active kitchen order count for notification
  const { data: activeOrderCount = 0 } = useQuery({
    queryKey: ['active-kitchen-orders-count', restaurantId, orderMode],
    queryFn: async () => {
      if (!restaurantId) return 0;

      let query = supabase
        .from('kitchen_orders')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .in('status', ['new', 'preparing', 'ready', 'held']);

      // Filter based on current mode
      if (orderMode === 'dine_in') {
        query = query.ilike('source', '%Table%');
      } else if (orderMode === 'takeaway') {
        query = query.ilike('source', '%takeaway%');
      } else if (orderMode === 'delivery') {
        query = query.ilike('source', '%delivery%');
      } else if (orderMode === 'non_chargeable') {
        query = query.ilike('source', '%non_chargeable%');
      }

      const { count, error } = await query;

      if (error) {
        console.error("Error fetching request count:", error);
        return 0;
      }
      return count || 0;
    },
    refetchInterval: 5000 // Poll every 5 seconds
  });


  const [orderItems, setOrderItems] = useState<QSROrderItem[]>([]);
  // const [toast, setToast] = useState<ToastType>(null); // Removed as useToast hook is used
  const [loading, setLoading] = useState(false);
  const [retrievedOrderId, setRetrievedOrderId] = useState<string | null>(null);
  // const { restaurantId } = useRestaurantId(); // Duplicate, removed
  const { menuItems, categories, isLoading: menuLoading } = useQSRMenuItems();

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Set first category as default when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const filteredItems = menuItems.filter((item) => {
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return item.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
  });

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;



  const addItem = (menuItem: QSRMenuItem) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.menuItemId === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.menuItemId === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          category: menuItem.category,
        },
      ];
    });
    showToast(`${menuItem.name} added`, 'success');
  };

  const incrementItem = (menuItemId: string) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decrementItem = (menuItemId: string) => {
    setOrderItems((prev) =>
      prev
        .map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (menuItemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
  };

  const clearOrder = () => {
    setOrderItems([]);
    if (orderMode === 'dine_in') {
      // Keep table selected if clearing regular items, but maybe we want to unselect logic?
      // For now, keep generic clear.
    }
  };

  const saveOrder = async (status: 'paid' | 'pending' | 'held') => {
    if (!restaurantId || orderItems.length === 0) return;

    setLoading(true);
    try {
      const orderData = {
        restaurant_id: restaurantId,
        customer_name: selectedTable ? `Table ${selectedTable.name} ` : 'QSR Customer',
        // table_id removed as it does not exist in the schema
        items: orderItems.map((item) => {
          // Format compatible with POSMode: "{quantity}x {name} ({modifiers}) @{price}"
          const mods = item.modifiers && item.modifiers.length > 0 ? ` (${item.modifiers.join(', ')})` : '';
          return `${item.quantity}x ${item.name}${mods} @${item.price} `;
        }),
        // Note: storing plain strings for compatibility with existing parser, 
        // but ideally should be JSON. The current parser expects "Name xQuantity". 
        // Let's stick to the simple format if possible or existing format.
        // Existing format in line 126 was: `${ item.name } x${ item.quantity } ` 
        // Let's keep that to avoid breaking retrieve logic:
        // items: orderItems.map((item) => `${ item.name } x${ item.quantity } `),

        // Wait, line 203 expects `match(/^(.+?) x(\d+)$/)`. 
        // So `${ item.name } x${ item.quantity } ` is correct.

        total: total,
        status: status,
        source: 'qsr',
        order_type: orderMode, // Use selected order mode
      };

      // Formatting items for database (must match retrieval parsing)
      const dbItems = orderItems.map((item) => `${item.name} x${item.quantity} `);

      // Kitchen items structure (clean JSON)
      const kitchenItems = orderItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        modifiers: item.modifiers || []
      }));

      let finalOrderId = retrievedOrderId;

      // 1. Create or Update "orders" record
      if (retrievedOrderId) {
        const { error: updateError } = await supabase
          .from('orders')
          .update(orderData)
          .eq('id', retrievedOrderId);

        if (updateError) throw updateError;
      } else {
        const { data: insertedOrder, error: insertError } = await supabase
          .from('orders')
          .insert([{ ...orderData, created_at: new Date().toISOString() }])
          .select('id')
          .single();
        if (insertError) throw insertError;
        finalOrderId = insertedOrder.id;
      }

      // 2. Create "kitchen_orders" record
      // We always create a new KOT for simplicity, or we could check if one exists. 
      // For "Held", we want a KOT so it can be tracked (optional, but good practice).
      // For "Pending" (Send to Kitchen) & "Paid", we definitely need a 'new' KOT.

      const kitchenStatus = status === 'held' ? 'held' : 'new';

      if (finalOrderId) {
        const { error: kitchenError } = await supabase
          .from('kitchen_orders')
          .insert({
            restaurant_id: restaurantId,
            order_id: finalOrderId,
            source: selectedTable ? `Table ${selectedTable.name} ` : `QSR - ${orderMode} `,
            status: kitchenStatus,
            items: kitchenItems,
          });
        if (kitchenError) console.error("KO Error", kitchenError);
      }

      // 3. Update Table Status (if Dine In and Table selected)
      if (selectedTable && orderMode === 'dine_in') {
        // If status is 'paid', free the table. Otherwise (pending/held), mark as occupied.
        const newTableStatus = status === 'paid' ? 'available' : 'occupied';

        const { error: tableError } = await supabase
          .from('restaurant_tables')
          .update({ status: newTableStatus })
          .eq('id', selectedTable.id);

        if (tableError) {
          console.error("Error updating table status:", tableError);
        } else {
          // Invalidate tables query to refresh grid
          queryClient.invalidateQueries({ queryKey: ['qsr-tables'] });
          queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] }); // Invalidate main POS tables too just in case
        }
      }

      showToast(`Order ${status === 'held' ? 'Held' : 'Sent to Kitchen'} `, 'success');
      clearOrder();
      setRetrievedOrderId(null);
      // If Dine In, unselect table to go back to grid
      if (orderMode === 'dine_in') {
        setSelectedTable(null);
      }
    } catch (error) {
      console.error('Error saving order:', error);
      showToast('Failed to save order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (mode: OrderMode) => {
    setOrderMode(mode);
    if (mode !== 'dine_in') {
      setSelectedTable(null);
    }
  };

  const handleTableSelect = async (table: any) => {
    setSelectedTable(table);
    setLoading(true);

    try {
      // Find active kitchen order for this table
      // Use wildcard to catch "Table 1", "POS-Table 1", "POS-Table Table 1", etc.
      const { data: activeOrder, error } = await supabase
        .from('kitchen_orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .ilike('source', `%${table.name}%`) // Match if table name appears in source
        .in('status', ['new', 'preparing', 'ready', 'held'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (activeOrder) {
        // Parse items using existing logic
        const itemsList = activeOrder.items;
        let parsedItems: QSROrderItem[] = [];

        if (Array.isArray(itemsList)) {
          parsedItems = itemsList.map((item: any) => ({
            menuItemId: item.menuItemId || item.id || crypto.randomUUID(),
            name: item.name,
            price: item.price || 0,
            quantity: item.quantity,
            category: 'Unknown',
            modifiers: item.modifiers || []
          }));
        }

        if (parsedItems.length > 0) {
          setOrderItems(parsedItems);
          setRetrievedOrderId(activeOrder.id);
          showToast(`Active order for ${table.name} retrieved`, 'info');
        } else {
          // Order exists but weirdly empty
          setOrderItems([]);
          setRetrievedOrderId(null);
        }
      } else {
        // No active order found - assume new order
        setOrderItems([]);
        setRetrievedOrderId(null);
      }
    } catch (err) {
      console.error("Error fetching table order:", err);
      showToast("Failed to check active orders", 'error');
      setOrderItems([]); // Safe fallback
      setRetrievedOrderId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrieveOrder = (orderId: string, items: string[], orderTotal: number) => {
    // ... (Reuse existing parsing logic or simplify)
    // For brevity, assuming simple retrieve. 
    // In real implementation, reuse the parsing logic from previous file.
    // Copying specific parsing logic used in original file:
    const parsedItems: QSROrderItem[] = items.map((itemStr) => {
      const match = itemStr.match(/^(.+?) x(\d+)$/);
      if (match) {
        const itemName = match[1];
        const qty = parseInt(match[2]);
        const menuItem = menuItems.find(m => m.name === itemName);
        if (menuItem) {
          return {
            menuItemId: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: qty,
            category: menuItem.category,
          };
        }
      }
      return null;
    }).filter(Boolean) as QSROrderItem[];

    setOrderItems(parsedItems);
    setRetrievedOrderId(orderId);
    setViewMode('order');
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Bar - Modes */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2 mr-8">
          <Zap className="text-primary fill-primary w-6 h-6" />
          <span className="font-bold text-lg hidden md:inline-block">QSR POS</span>
        </div>

        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
          <Button
            variant={orderMode === 'dine_in' ? 'default' : 'outline'}
            onClick={() => handleModeChange('dine_in')}
            className={cn("gap-2 shadow-sm", orderMode === 'dine_in' && "shadow-md scale-105")}
          >
            <LayoutGrid className="w-4 h-4" /> Dine In
          </Button>
          <Button
            variant={orderMode === 'takeaway' ? 'default' : 'outline'}
            onClick={() => handleModeChange('takeaway')}
            className={cn("gap-2 shadow-sm", orderMode === 'takeaway' && "shadow-md scale-105")}
          >
            <ShoppingBag className="w-4 h-4" /> Takeaway
          </Button>
          <Button
            variant={orderMode === 'delivery' ? 'default' : 'outline'}
            onClick={() => handleModeChange('delivery')}
            className={cn("gap-2 shadow-sm", orderMode === 'delivery' && "shadow-md scale-105")}
          >
            <Truck className="w-4 h-4" /> Delivery
          </Button>
          <Button
            variant={orderMode === 'non_chargeable' ? 'default' : 'outline'}
            onClick={() => handleModeChange('non_chargeable')}
            className={cn("gap-2 shadow-sm", orderMode === 'non_chargeable' && "shadow-md scale-105")}
          >
            <Gift className="w-4 h-4" /> NC
          </Button>
        </div>

        <div className="flex gap-2 ml-4">
          <Button
            variant={showActiveOrders ? 'default' : 'ghost'}
            onClick={() => setShowActiveOrders(!showActiveOrders)}
            className={cn("gap-2 relative", showActiveOrders && "bg-primary text-primary-foreground")}
          >
            <History className="w-5 h-5 mr-2" />
            Active Orders
            {activeOrderCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                {activeOrderCount}
              </span>
            )}
          </Button>

          {viewMode === 'order' ? (
            <Button variant="ghost" onClick={() => setViewMode('history')}>
              Past Orders
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => {
              setViewMode('order');
              handleModeChange('dine_in'); // Always land on Dine In Table selection
            }}>
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to POS
            </Button>
          )}
          <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {viewMode === 'history' ? (
        <div className="flex-1 overflow-hidden p-4">
          <OrderHistory onRetrieveOrder={handleRetrieveOrder} currentOrderHasItems={orderItems.length > 0} />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANEL: Order Pad (35%) */}
          <div className="w-[35%] min-w-[320px] h-full shadow-xl z-10">
            <QSROrderPad
              items={orderItems}
              subtotal={subtotal}
              tax={tax}
              total={total}
              onIncrement={incrementItem}
              onDecrement={decrementItem}
              onRemove={removeItem}
              onClear={clearOrder}
              onSendToKitchen={() => saveOrder('pending')}
              onHold={() => saveOrder('held')}
              onPay={() => setShowPayment(true)}
              onAddCustomItem={(item) => setOrderItems([...orderItems, item])}
              loading={loading}
              mode={orderMode}
              tableNumber={selectedTable?.name}
            />
          </div>

          {/* RIGHT PANEL: Selection Grid (65%) */}
          <div className="flex-1 bg-slate-100 flex flex-col h-full overflow-hidden">
            {/* Context Header for Right Panel */}
            {(orderMode === 'dine_in' && !selectedTable) ? (
              <div className="p-4 border-b bg-white">
                <h2 className="text-xl font-bold text-slate-700">Select Table</h2>
              </div>
            ) : (
              <div className="bg-white border-b shadow-sm z-[5]">
                <div className="p-3 border-b px-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-slate-50 border-slate-200"
                    />
                  </div>
                </div>
                <QSRCategoryGrid
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat);
                    setSearchQuery(''); // Clear search when category is selected
                  }}
                />
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {menuLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="animate-spin text-primary">Loading...</div>
                </div>
              ) : (
                <>
                  {orderMode === 'dine_in' && !selectedTable ? (
                    <QSRTableGrid onSelectTable={handleTableSelect} />
                  ) : (
                    <div className="">
                      {orderMode === 'dine_in' && (
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedTable(null)}
                          className="mb-4 text-muted-foreground hover:text-primary"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" /> Change Table
                        </Button>
                      )}
                      <MenuItemsGrid items={filteredItems} onAddItem={addItem} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <PaymentDialog
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        orderItems={orderItems.map(item => ({
          id: crypto.randomUUID(),
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          modifiers: item.modifiers
        }))} // Convert QSR items to OrderItems expected by PaymentDialog
        onSuccess={() => {
          saveOrder('paid');
          setShowPayment(false);
        }}
        tableNumber={selectedTable?.name || (orderMode === 'dine_in' ? 'Unknown Table' : orderMode)}
        orderId={retrievedOrderId || undefined}
      />

      {/* Active Orders Overlay/Drawer */}
      {showActiveOrders && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end"
          onClick={() => setShowActiveOrders(false)} // Click outside to close
        >
          <div
            className="w-full max-w-md md:max-w-4xl h-full bg-white shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()} // Prevent close on content click
          >
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold">Active Kitchen Orders</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowActiveOrders(false)}>
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
              <ActiveOrdersList
                onRecallOrder={({ items, kitchenOrderId, source }) => {
                  // Map recalled items to QSR format
                  const parsedItems: QSROrderItem[] = items.map((item) => ({
                    menuItemId: item.menuItemId || item.id, // Fallback ID
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    category: 'Unknown', // Category lost on retrieval but that's okay for billing
                    modifiers: item.modifiers
                  }));
                  setOrderItems(parsedItems);
                  setRetrievedOrderId(kitchenOrderId);

                  // Extract table name from source if possible?
                  // e.g. "Table 5" -> "Table 5"
                  // For now, relies on user to select table if needed.

                  setShowActiveOrders(false); // Close panel
                  // showToast("Order Recalled", "info"); // Use unified toast
                  toast({ title: "Order Recalled", description: "Active order has been loaded to the pad." });
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
