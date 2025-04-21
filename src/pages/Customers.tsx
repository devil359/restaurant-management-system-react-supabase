
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CustomerList from "@/components/CRM/CustomerList";
import CustomerDetail from "@/components/CRM/CustomerDetail";
import CustomerDialog from "@/components/CRM/CustomerDialog";
import { Customer, CustomerOrder, CustomerNote, CustomerActivity } from "@/types/customer";
import { User } from "lucide-react";

const Customers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  // Fetch customers data
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customers"],
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

      // Fetch customer data from customer_insights table
      const { data, error } = await supabase
        .from("customer_insights")
        .select("*")
        .eq("restaurant_id", userProfile.restaurant_id);

      if (error) throw error;
      
      // Transform data to match our Customer interface
      return data.map((item: any): Customer => ({
        id: item.id || crypto.randomUUID(),
        name: item.customer_name || 'Unknown Customer',
        email: item.email || null,
        phone: item.phone || null,
        address: item.address || null,
        birthday: item.birthday || null,
        created_at: item.created_at || new Date().toISOString(),
        restaurant_id: item.restaurant_id,
        loyalty_points: item.loyalty_points || 0,
        loyalty_tier: calculateLoyaltyTier(
          item.total_spent || 0,
          item.visit_count || 0,
          calculateDaysSince(item.first_visit)
        ),
        tags: item.tags || [],
        preferences: item.preferences || null,
        last_visit_date: item.last_visit || null,
        total_spent: item.total_spent || 0,
        visit_count: item.visit_count || 0,
        average_order_value: item.average_order_value || 0
      }));
    },
  });
  
  // Fetch customer orders
  const { data: customerOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["customer-orders", selectedCustomer?.name],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No user found");

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", profile.user.id)
        .single();
        
      // Fetch orders for the selected customer
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", userProfile?.restaurant_id)
        .eq("customer_name", selectedCustomer.name)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      return data.map((order): CustomerOrder => ({
        id: order.id,
        date: order.created_at,
        amount: order.total,
        order_id: order.id,
        status: order.status,
        items: order.items || []
      }));
    },
    enabled: !!selectedCustomer,
  });

  // Mock data for customer notes (to be implemented with real backend later)
  const mockNotes: CustomerNote[] = selectedCustomer ? [
    {
      id: '1',
      customer_id: selectedCustomer.id,
      content: 'Customer prefers corner tables near the window.',
      created_at: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString(),
      created_by: 'John Manager'
    },
    {
      id: '2',
      customer_id: selectedCustomer.id,
      content: 'Allergic to nuts. Always confirm ingredients with kitchen.',
      created_at: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
      created_by: 'Sarah Server'
    }
  ] : [];

  // Mock data for customer activities (to be implemented with real backend later)
  const mockActivities: CustomerActivity[] = selectedCustomer ? [
    {
      id: '1',
      customer_id: selectedCustomer.id,
      activity_type: 'order_placed',
      description: 'Placed an order for ₹2,350',
      created_at: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString()
    },
    {
      id: '2',
      customer_id: selectedCustomer.id,
      activity_type: 'email_sent',
      description: 'Sent birthday discount promotion email',
      created_at: new Date(new Date().setDate(new Date().getDate() - 12)).toISOString()
    },
    {
      id: '3',
      customer_id: selectedCustomer.id,
      activity_type: 'note_added',
      description: 'Staff added note about seating preferences',
      created_at: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString()
    },
    {
      id: '4',
      customer_id: selectedCustomer.id,
      activity_type: 'tag_added',
      description: 'Added tag "Wine Enthusiast"',
      created_at: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString()
    }
  ] : [];

  // Mutation for adding/updating customer
  const saveCustomer = useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
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

      // If editing existing customer
      if (customer.id) {
        const { data, error } = await supabase
          .from("customer_insights")
          .update({
            customer_name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            birthday: customer.birthday,
            preferences: customer.preferences,
            tags: customer.tags
          })
          .eq("id", customer.id)
          .select();
          
        if (error) throw error;
        return data;
      } 
      // If creating new customer
      else {
        const { data, error } = await supabase
          .from("customer_insights")
          .insert([
            {
              customer_name: customer.name,
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              birthday: customer.birthday,
              preferences: customer.preferences,
              restaurant_id: userProfile.restaurant_id,
              total_spent: 0,
              visit_count: 0,
              average_order_value: 0,
              tags: customer.tags || []
            }
          ])
          .select();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDialogOpen(false);
      setCustomerToEdit(null);
      toast({
        title: customerToEdit ? "Customer Updated" : "Customer Added",
        description: customerToEdit
          ? "The customer information has been successfully updated."
          : "A new customer has been successfully added to your database.",
      });
    },
    onError: (error) => {
      console.error("Error saving customer:", error);
      toast({
        title: "Error",
        description: "There was a problem saving the customer information.",
        variant: "destructive",
      });
    },
  });

  // Calculate loyalty tier based on customer data
  function calculateLoyaltyTier(
    totalSpent: number,
    visitCount: number,
    daysSinceFirstVisit: number
  ): Customer['loyalty_tier'] {
    // Simplified loyalty tier calculation
    if (totalSpent > 20000 && visitCount > 15) return "Diamond";
    if (totalSpent > 10000 && visitCount > 10) return "Platinum";
    if (totalSpent > 5000 && visitCount > 8) return "Gold";
    if (totalSpent > 2500 && visitCount > 5) return "Silver";
    if (totalSpent > 1000 || visitCount > 3) return "Bronze";
    return "None";
  }
  
  // Calculate days since a given date
  function calculateDaysSince(dateString?: string | null): number {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleAddCustomer = () => {
    setCustomerToEdit(null);
    setDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
    setDialogOpen(true);
  };

  const handleFilterCustomers = (filters: any) => {
    // Implement filtering logic (would update a state with filter criteria)
    console.log("Filter applied:", filters);
    // This would typically update a state that the CustomerList would use for filtering
  };

  const handleAddNote = (customerId: string, content: string) => {
    // This would typically be implemented as a backend call
    console.log("Add note for customer:", customerId, "Content:", content);
  };

  const handleAddTag = (customerId: string, tag: string) => {
    // This would typically be implemented as a backend call
    console.log("Add tag for customer:", customerId, "Tag:", tag);
  };

  const handleRemoveTag = (customerId: string, tag: string) => {
    // This would typically be implemented as a backend call
    console.log("Remove tag for customer:", customerId, "Tag:", tag);
  };

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Customer Relationship Management
        </h1>
        <p className="text-muted-foreground">
          Manage your customer relationships and track customer data
        </p>
      </div>

      {isLoadingCustomers && customers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-md">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
          <div className="lg:col-span-5 xl:col-span-4 h-[calc(100vh-180px)] overflow-hidden">
            <CustomerList
              customers={customers}
              loading={isLoadingCustomers}
              selectedCustomerId={selectedCustomer?.id || null}
              onSelectCustomer={handleSelectCustomer}
              onAddCustomer={handleAddCustomer}
              onFilterCustomers={handleFilterCustomers}
            />
          </div>

          <div className="lg:col-span-7 xl:col-span-8 h-[calc(100vh-180px)] overflow-hidden">
            {customers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 mb-4">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium">No Customers Found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                  Your customer database is empty. Add your first customer to get started with the CRM module.
                </p>
                <button
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                  onClick={handleAddCustomer}
                >
                  Add Your First Customer
                </button>
              </div>
            ) : (
              <CustomerDetail
                customer={selectedCustomer}
                orders={customerOrders}
                notes={mockNotes}
                activities={mockActivities}
                loading={isLoadingOrders}
                onEditCustomer={handleEditCustomer}
                onAddNote={handleAddNote}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
              />
            )}
          </div>
        </div>
      )}

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={customerToEdit}
        onSave={saveCustomer.mutate}
        isLoading={saveCustomer.isPending}
      />
    </div>
  );
};

export default Customers;
