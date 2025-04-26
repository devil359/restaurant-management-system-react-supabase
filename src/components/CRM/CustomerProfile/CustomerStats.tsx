
import React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Customer } from "@/types/customer";

interface CustomerStatsProps {
  customer: Customer;
}

const CustomerStats = ({ customer }: CustomerStatsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
        <CardDescription>Customer behavior and spending patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="border rounded-md p-3">
            <div className="text-sm text-muted-foreground">Total Spent</div>
            <div className="text-2xl font-bold">₹{customer.total_spent.toLocaleString()}</div>
          </div>
          
          <div className="border rounded-md p-3">
            <div className="text-sm text-muted-foreground">Visit Count</div>
            <div className="text-2xl font-bold">{customer.visit_count}</div>
          </div>
          
          <div className="border rounded-md p-3">
            <div className="text-sm text-muted-foreground">Avg Order Value</div>
            <div className="text-2xl font-bold">₹{customer.average_order_value.toLocaleString()}</div>
          </div>
          
          <div className="border rounded-md p-3">
            <div className="text-sm text-muted-foreground">Last Visit</div>
            <div className="text-2xl font-bold">
              {customer.last_visit_date ? format(new Date(customer.last_visit_date), 'MMM d') : 'N/A'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerStats;
