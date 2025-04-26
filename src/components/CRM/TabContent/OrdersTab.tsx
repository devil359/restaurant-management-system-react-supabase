
import React from "react";
import { format } from "date-fns";
import { ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerOrder } from "@/types/customer";

interface OrdersTabProps {
  orders: CustomerOrder[];
  loading: boolean;
}

const OrdersTab = ({ orders, loading }: OrdersTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
        <CardDescription>
          {orders.length} order{orders.length !== 1 ? 's' : ''} placed
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <svg className="animate-spin h-6 w-6 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-6">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium">No Orders Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No orders have been placed yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Order #{order.order_id.substring(0, 8)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(order.date), 'MMMM d, yyyy • h:mm a')}
                    </div>
                    <div className="mt-2 text-sm">
                      {order.items.map((item, idx) => (
                        <div key={idx}>{item}</div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold">₹{order.amount.toLocaleString()}</span>
                    <Badge className="mt-1" variant={order.status === 'completed' ? 'default' : 'outline'}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersTab;
