
import React, { useState, useEffect } from "react";
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

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("restaurant_id", userProfile.restaurant_id);

      if (error) throw error;
      
      return data.map((customer): Customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email || null,
        phone: customer.phone || null,
        address: customer.address || null,
        birthday: customer.birthday || null,
        created_at: customer.created_at,
        restaurant_id: customer.restaurant_id,
        loyalty_points: customer.loyalty_points || 0,
        loyalty_tier: calculateLoyaltyTier(
          customer.total_spent || 0,
          customer.visit_count || 0,
          calculateDaysSince(customer.last_visit_date)
        ),
        tags: customer.tags || [],
        preferences: customer.preferences || null,
        last_visit_date: customer.last_visit_date || null,
        total_spent: customer.total_spent || 0,
        visit_count: customer.visit_count || 0,
        average_order_value: customer.average_order_value || 0,
        loyalty_enrolled: customer.loyalty_enrolled || false,
        loyalty_tier_id: customer.loyalty_tier_id
      }));
    },
  });
  
  // Fetch customer orders
  const { data: customerOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["customer-orders", selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No user found");

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", profile.user.id)
        .single();
        
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

  // Fetch customer notes
  const { data: customerNotes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ["customer-notes", selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      
      const { data, error } = await supabase
        .from("customer_notes")
        .select("*")
        .eq("customer_id", selectedCustomer.id)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      return data as CustomerNote[];
    },
    enabled: !!selectedCustomer,
  });

  // Fetch customer activities
  const { data: customerActivities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["customer-activities", selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      
      const { data, error } = await supabase
        .from("customer_activities")
        .select("*")
        .eq("customer_id", selectedCustomer.id)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      // Ensure the activity_type is one of the valid types
      const activities = data || [];
      return activities.map(activity => {
        const validTypes = ['note_added', 'email_sent', 'order_placed', 'tag_added', 'tag_removed', 'promotion_sent'];
        const validType = validTypes.includes(activity.activity_type) 
          ? activity.activity_type 
          : 'note_added';
          
        return {
          ...activity,
          activity_type: validType
        } as CustomerActivity;
      });
    },
    enabled: !!selectedCustomer,
  });

  // Check if tables exist and use direct queries instead of RPC calls
  useEffect(() => {
    const verifyTables = async () => {
      try {
        // Check if customer_notes table exists
        const { error: notesExistError } = await supabase
          .from('customer_notes')
          .select('id')
          .limit(1);
          
        if (notesExistError && notesExistError.message.includes('does not exist')) {
          console.error("The customer_notes table does not exist", notesExistError);
          toast({
            variant: "destructive",
            title: "Database Error",
            description: "Customer notes functionality is not available. Please contact support."
          });
        }
        
        // Check if customer_activities table exists
        const { error: activitiesExistError } = await supabase
          .from('customer_activities')
          .select('id')
          .limit(1);
          
        if (activitiesExistError && activitiesExistError.message.includes('does not exist')) {
          console.error("The customer_activities table does not exist", activitiesExistError);
          toast({
            variant: "destructive",
            title: "Database Error",
            description: "Customer activities functionality is not available. Please contact support."
          });
        }
      } catch (error) {
        console.error("Error checking tables:", error);
      }
    };
    
    verifyTables();
  }, [toast]);

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
          .from("customers")
          .update({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            birthday: customer.birthday,
            preferences: customer.preferences,
            tags: customer.tags || []
          })
          .eq("id", customer.id)
          .select();
          
        if (error) throw error;
        return data;
      } 
      // If creating new customer
      else {
        const { data, error } = await supabase
          .from("customers")
          .insert([
            {
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              birthday: customer.birthday,
              preferences: customer.preferences,
              restaurant_id: userProfile.restaurant_id,
              tags: customer.tags || [],
              loyalty_enrolled: false,
              loyalty_points: 0,
              total_spent: 0,
              visit_count: 0,
              average_order_value: 0
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

  // Handle adding notes
  const handleAddNote = async (customerId: string, content: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Get customer info for restaurant_id
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('restaurant_id')
        .eq('id', customerId)
        .single();
        
      if (customerError) throw customerError;
      
      // Insert note
      const { error } = await supabase
        .from('customer_notes')
        .insert({
          customer_id: customerId,
          restaurant_id: customerData.restaurant_id,
          content: content,
          created_by: userData.user?.email || 'Staff'
        });
        
      if (error) throw error;
      
      // Record activity
      await supabase
        .from('customer_activities')
        .insert({
          customer_id: customerId,
          restaurant_id: customerData.restaurant_id,
          activity_type: 'note_added',
          description: 'Staff added note about customer'
        });
      
      queryClient.invalidateQueries({ queryKey: ["customer-notes", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customer-activities", customerId] });
      
      toast({
        title: "Note Added",
        description: "Your note has been successfully added."
      });
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add note."
      });
    }
  };

  // Handle adding tag
  const handleAddTag = async (customerId: string, tag: string) => {
    if (!selectedCustomer) return;
    
    try {
      // Check if customer already has this tag
      if (selectedCustomer.tags && selectedCustomer.tags.includes(tag)) {
        toast({
          variant: "destructive",
          title: "Duplicate Tag",
          description: "This tag already exists for this customer."
        });
        return;
      }

      // Create new tags array
      const updatedTags = selectedCustomer.tags ? [...selectedCustomer.tags, tag] : [tag];

      // Update customer tags in database
      const { error } = await supabase
        .from('customers')
        .update({ tags: updatedTags })
        .eq('id', customerId);

      if (error) throw error;

      // Add activity
      await supabase
        .from('customer_activities')
        .insert({
          customer_id: customerId,
          restaurant_id: selectedCustomer.restaurant_id,
          activity_type: 'tag_added',
          description: `Added tag "${tag}"`
        });

      // Update selected customer in local state
      setSelectedCustomer({
        ...selectedCustomer,
        tags: updatedTags
      });

      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-activities", customerId] });

      toast({
        title: "Tag Added",
        description: "Tag has been added to the customer."
      });
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add tag."
      });
    }
  };

  // Handle removing tag
  const handleRemoveTag = async (customerId: string, tag: string) => {
    if (!selectedCustomer) return;
    
    try {
      // Create new tags array without the removed tag
      const updatedTags = selectedCustomer.tags.filter(t => t !== tag);

      // Update customer tags in database
      const { error } = await supabase
        .from('customers')
        .update({ tags: updatedTags })
        .eq('id', customerId);

      if (error) throw error;

      // Add activity
      await supabase
        .from('customer_activities')
        .insert({
          customer_id: customerId,
          restaurant_id: selectedCustomer.restaurant_id,
          activity_type: 'tag_removed',
          description: `Removed tag "${tag}"`
        });

      // Update selected customer in local state
      setSelectedCustomer({
        ...selectedCustomer,
        tags: updatedTags
      });

      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-activities", customerId] });

      toast({
        title: "Tag Removed",
        description: "Tag has been removed from the customer."
      });
    } catch (error) {
      console.error('Error removing tag:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove tag."
      });
    }
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
                notes={customerNotes}
                activities={customerActivities}
                loading={isLoadingOrders || isLoadingNotes || isLoadingActivities}
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
