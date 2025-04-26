
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PenSquare, Coins } from "lucide-react";
import { LoyaltyBadge } from "@/components/Customers/LoyaltyBadge";
import { Customer } from "@/types/customer";

interface CustomerDetailHeaderProps {
  customer: Customer;
  onEditCustomer: (customer: Customer) => void;
}

const CustomerDetailHeader: React.FC<CustomerDetailHeaderProps> = ({ 
  customer, 
  onEditCustomer 
}) => {
  return (
    <div className="px-6 py-4 border-b flex items-center justify-between bg-card">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold">
          {customer.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{customer.name}</h2>
          <div className="flex items-center gap-2">
            <LoyaltyBadge tier={customer.loyalty_tier} />
            {customer.loyalty_enrolled && 
              <Badge variant="outline" className="flex items-center gap-1">
                <Coins className="h-3 w-3" />
                {customer.loyalty_points} points
              </Badge>
            }
          </div>
        </div>
      </div>
      <Button 
        onClick={() => onEditCustomer(customer)} 
        variant="outline" 
        className="flex items-center gap-2"
      >
        <PenSquare className="h-4 w-4" />
        Edit Customer
      </Button>
    </div>
  );
};

export default CustomerDetailHeader;
