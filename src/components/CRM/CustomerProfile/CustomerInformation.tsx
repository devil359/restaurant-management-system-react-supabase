
import React from "react";
import { format } from "date-fns";
import { User, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Customer } from "@/types/customer";

interface CustomerInformationProps {
  customer: Customer;
}

const CustomerInformation = ({ customer }: CustomerInformationProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2">
          <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
          <div>
            <div className="font-medium">{customer.name}</div>
            <div className="text-sm text-muted-foreground">Customer Name</div>
          </div>
        </div>
        
        {customer.phone && (
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="font-medium">{customer.phone}</div>
              <div className="text-sm text-muted-foreground">Phone Number</div>
            </div>
          </div>
        )}
        
        {customer.email && (
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="font-medium">{customer.email}</div>
              <div className="text-sm text-muted-foreground">Email Address</div>
            </div>
          </div>
        )}
        
        {customer.address && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="font-medium">{customer.address}</div>
              <div className="text-sm text-muted-foreground">Address</div>
            </div>
          </div>
        )}
        
        {customer.birthday && (
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="font-medium">
                {format(new Date(customer.birthday), 'MMMM d, yyyy')}
              </div>
              <div className="text-sm text-muted-foreground">Birthday</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerInformation;
