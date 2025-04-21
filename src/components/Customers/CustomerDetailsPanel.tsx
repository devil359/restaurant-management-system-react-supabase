
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Tag, 
  CircleCheck, 
  MessageCircle,
  ClipboardList,
  BookOpen,
  Clock,
  MoreVertical
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LoyaltyBadge from "./LoyaltyBadge";

interface Customer {
  customer_name: string;
  visit_count: number;
  total_spent: number;
  average_order_value: number;
  first_visit: string;
  last_visit: string;
}

interface CustomerDetailsProps {
  customer: Customer;
  onEdit: () => void;
}

interface CustomerExtendedInfo {
  email?: string;
  phone?: string;
  address?: string;
  birthday?: string;
  notes?: string[];
  preferences?: string[];
  tags?: string[];
}

const calculateLoyaltyTier = (
  totalSpent: number,
  visitCount: number
) => {
  if (totalSpent > 20000 && visitCount > 15) return "Diamond";
  if (totalSpent > 10000 && visitCount > 10) return "Platinum";
  if (totalSpent > 5000 && visitCount > 8) return "Gold";
  if (totalSpent > 2500 && visitCount > 5) return "Silver";
  if (totalSpent > 1000 || visitCount > 3) return "Bronze";
  return "None";
};

const CustomerDetailsPanel = ({ customer, onEdit }: CustomerDetailsProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [extendedInfo, setExtendedInfo] = useState<CustomerExtendedInfo>({
    email: `${customer.customer_name.toLowerCase().replace(/\s/g, '.')}@example.com`,
    phone: "+1 555-123-4567",
    address: "123 Main St, Anytown, USA",
    preferences: ["Window Seating", "No Spicy Food", "Wine Enthusiast"],
    tags: ["VIP", "Regular", "Special Occasions"],
    notes: [
      "Celebrated anniversary on March 15th",
      "Prefers red wine, especially Cabernet",
      "Usually visits on weekends"
    ]
  });

  // Fetch recent orders for this customer
  const { data: recentOrders = [] } = useQuery({
    queryKey: ["customer-orders", customer.customer_name],
    queryFn: async () => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No user found");

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", profile.user.id)
        .single();

      if (!userProfile?.restaurant_id) {
        throw new Error("No restaurant found for user");
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", userProfile.restaurant_id)
        .eq("customer_name", customer.customer_name)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const loyaltyTier = calculateLoyaltyTier(customer.total_spent, customer.visit_count);
  const loyaltyPoints = Math.floor(customer.total_spent / 10);

  return (
    <>
      <Card className="h-full overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle>{customer.customer_name}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-4 mt-4">
              {/* Contact Information */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
                <div className="grid grid-cols-[20px_1fr] gap-x-2 gap-y-2 items-center">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{extendedInfo.email}</span>
                  
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{extendedInfo.phone}</span>
                  
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{extendedInfo.address}</span>
                  
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{extendedInfo.birthday || "Not provided"}</span>
                </div>
              </div>
              
              <div className="border-t pt-3"></div>

              {/* Loyalty and Tags */}
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Loyalty Status</h3>
                  <div className="flex items-center gap-2">
                    <LoyaltyBadge tier={loyaltyTier as any} />
                    <span className="text-sm font-medium">{loyaltyPoints} points</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
                  <div className="flex flex-wrap gap-1">
                    {extendedInfo.tags?.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1 text-muted-foreground" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Preferences</h3>
                  <div className="space-y-1">
                    {extendedInfo.preferences?.map((pref, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-sm">
                        <CircleCheck className="h-3.5 w-3.5 text-green-500" />
                        {pref}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3"></div>

              {/* Visit and Spending Stats */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Customer Statistics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">Total Visits</div>
                    <div className="text-2xl font-semibold">{customer.visit_count}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">Total Spent</div>
                    <div className="text-2xl font-semibold">{formatCurrency(customer.total_spent)}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">Average Order</div>
                    <div className="text-2xl font-semibold">{formatCurrency(customer.average_order_value)}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">First Visit</div>
                    <div className="text-lg font-medium">{formatDate(customer.first_visit)}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="orders" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Recent Orders</h3>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              
              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order: any) => (
                    <Card key={order.id} className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-1">
                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{order.id.slice(0, 8)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{formatDate(order.created_at)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(order.total)}</div>
                          <Badge variant="outline" className="capitalize text-xs">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <div className="line-clamp-2 text-muted-foreground">
                          {order.items?.slice(0, 3).join(", ")}
                          {order.items?.length > 3 ? ` +${order.items.length - 3} more` : ""}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <BookOpen className="h-8 w-8 mb-2" />
                  <h3 className="font-medium">No order history</h3>
                  <p className="text-sm">This customer hasn't placed any orders yet</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="notes" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Customer Notes</h3>
                <Button variant="outline" size="sm">Add Note</Button>
              </div>
              
              {extendedInfo.notes && extendedInfo.notes.length > 0 ? (
                <div className="space-y-3">
                  {extendedInfo.notes.map((note, idx) => (
                    <Card key={idx} className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2">
                          <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span>{note}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatDate(new Date().toISOString())}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <BookOpen className="h-8 w-8 mb-2" />
                  <h3 className="font-medium">No notes yet</h3>
                  <p className="text-sm">Add notes about this customer's preferences</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input 
                  id="name" 
                  value={customer.customer_name} 
                  onChange={() => {}} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={extendedInfo.phone} 
                  onChange={(e) => setExtendedInfo({...extendedInfo, phone: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={extendedInfo.email} 
                  onChange={(e) => setExtendedInfo({...extendedInfo, email: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Input 
                  id="birthday" 
                  type="date" 
                  value={extendedInfo.birthday} 
                  onChange={(e) => setExtendedInfo({...extendedInfo, birthday: e.target.value})} 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                value={extendedInfo.address} 
                onChange={(e) => setExtendedInfo({...extendedInfo, address: e.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                value={extendedInfo.notes?.join("\n")} 
                onChange={(e) => setExtendedInfo({
                  ...extendedInfo, 
                  notes: e.target.value.split("\n").filter(n => n.trim())
                })} 
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsEditOpen(false)}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomerDetailsPanel;
