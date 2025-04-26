import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Customer, CustomerOrder, CustomerNote, CustomerActivity, LoyaltyTransaction } from "@/types/customer";

import CustomerHeader from "./CustomerHeader";
import ProfileTab from "./CustomerProfile/ProfileTab";
import LoyaltyPointsDialog from "./CustomerLoyalty/LoyaltyPointsDialog";
import OrdersTab from "./TabContent/OrdersTab";
import NotesTab from "./TabContent/NotesTab";
import ActivityTab from "./TabContent/ActivityTab";

interface CustomerDetailProps {
  customer: Customer | null;
  orders: CustomerOrder[];
  notes: CustomerNote[];
  activities: CustomerActivity[];
  loading: boolean;
  onEditCustomer: (customer: Customer) => void;
  onAddNote: (customerId: string, content: string) => void;
  onAddTag: (customerId: string, tag: string) => void;
  onRemoveTag: (customerId: string, tag: string) => void;
}

const CustomerDetail = ({
  customer,
  orders,
  notes,
  activities,
  loading,
  onEditCustomer,
  onAddNote,
  onAddTag,
  onRemoveTag
}: CustomerDetailProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [newTag, setNewTag] = useState("");
  const [loyaltyDialogOpen, setLoyaltyDialogOpen] = useState(false);
  const [manualPointsAmount, setManualPointsAmount] = useState(0);
  const [manualPointsNote, setManualPointsNote] = useState("");
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([]);
  const [customerActivities, setCustomerActivities] = useState<CustomerActivity[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [preferences, setPreferences] = useState<string>(customer?.preferences || '');
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  
  useEffect(() => {
    if (customer) {
      loadCustomerNotes();
      loadCustomerActivities();
    }
  }, [customer?.id]);
  
  const loadCustomerNotes = async () => {
    if (!customer) return;
    
    setIsLoadingNotes(true);
    try {
      const { data, error } = await supabase.rpc('get_customer_notes', {
        customer_id_param: customer.id
      });
      
      if (error) throw error;
      
      setCustomerNotes(data || []);
    } catch (error) {
      console.error("Error loading customer notes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load customer notes."
      });
    } finally {
      setIsLoadingNotes(false);
    }
  };
  
  const loadCustomerActivities = async () => {
    if (!customer) return;
    
    setIsLoadingActivities(true);
    try {
      const { data, error } = await supabase.rpc('get_customer_activities', {
        customer_id_param: customer.id
      });
      
      if (error) throw error;
      
      setCustomerActivities(data || []);
    } catch (error) {
      console.error("Error loading customer activities:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load customer activities."
      });
    } finally {
      setIsLoadingActivities(false);
    }
  };
  
  const enrollCustomer = useMutation({
    mutationFn: async () => {
      if (!customer) throw new Error("No customer selected");
      
      const { error } = await supabase
        .from("customers")
        .update({ 
          loyalty_enrolled: true,
          loyalty_points: 0
        })
        .eq("id", customer.id);
        
      if (error) throw error;
      
      await supabase.rpc('add_customer_activity', {
        customer_id_param: customer.id,
        restaurant_id_param: customer.restaurant_id,
        activity_type_param: 'promotion_sent',
        description_param: 'Enrolled in loyalty program'
      });
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Customer Enrolled",
        description: "Customer has been successfully enrolled in the loyalty program."
      });
      if (customer) {
        customer.loyalty_enrolled = true;
      }
    },
    onError: (error) => {
      console.error("Error enrolling customer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to enroll customer in loyalty program."
      });
    }
  });
  
  const unenrollCustomer = useMutation({
    mutationFn: async () => {
      if (!customer) throw new Error("No customer selected");
      
      const { error } = await supabase
        .from("customers")
        .update({ 
          loyalty_enrolled: false,
          loyalty_points: 0,
          loyalty_tier_id: null
        })
        .eq("id", customer.id);
        
      if (error) throw error;
      
      await supabase.rpc('add_customer_activity', {
        customer_id_param: customer.id,
        restaurant_id_param: customer.restaurant_id,
        activity_type_param: 'promotion_sent',
        description_param: 'Removed from loyalty program'
      });
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Customer Unenrolled",
        description: "Customer has been removed from the loyalty program."
      });
      if (customer) {
        customer.loyalty_enrolled = false;
      }
    },
    onError: (error) => {
      console.error("Error unenrolling customer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unenroll customer from loyalty program."
      });
    }
  });
  
  const addManualPoints = useMutation({
    mutationFn: async ({ amount, notes }: { amount: number; notes: string }) => {
      if (!customer) throw new Error("No customer selected");
      if (amount === 0) throw new Error("Points amount cannot be zero");
      
      const { data: currentCustomer, error: fetchError } = await supabase
        .from("customers")
        .select("loyalty_points")
        .eq("id", customer.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      const newPoints = (currentCustomer?.loyalty_points || 0) + amount;
      
      if (newPoints < 0) throw new Error("Cannot reduce points below zero");
      
      const { error: updateError } = await supabase
        .from("customers")
        .update({ loyalty_points: newPoints })
        .eq("id", customer.id);
        
      if (updateError) throw updateError;
      
      const { data: userData } = await supabase.auth.getUser();
      
      await supabase.rpc('add_loyalty_transaction', {
        customer_id_param: customer.id,
        restaurant_id_param: customer.restaurant_id,
        transaction_type_param: amount > 0 ? 'earn' : 'adjust',
        points_param: amount,
        source_param: 'manual',
        notes_param: notes,
        created_by_param: userData.user?.id || null
      });
      
      await supabase.rpc('add_customer_activity', {
        customer_id_param: customer.id,
        restaurant_id_param: customer.restaurant_id,
        activity_type_param: 'promotion_sent',
        description_param: `${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} loyalty points manually`
      });
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setManualPointsAmount(0);
      setManualPointsNote("");
      setLoyaltyDialogOpen(false);
      toast({
        title: "Points Updated",
        description: "Customer loyalty points have been updated successfully."
      });
    },
    onError: (error: any) => {
      console.error("Error updating points:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update loyalty points."
      });
    }
  });
  
  const loadTransactions = async () => {
    if (!customer) return;
    
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase.rpc('get_loyalty_transactions', {
        customer_id_param: customer.id
      });
      
      if (error) throw error;
      
      setLoyaltyTransactions(data as LoyaltyTransaction[]);
      setShowTransactionHistory(true);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load loyalty transaction history."
      });
    } finally {
      setLoadingTransactions(false);
    }
  };
  
  const getNextTierInfo = () => {
    if (!customer) return null;
    
    const tiers = [
      { name: "Bronze", points: 500 },
      { name: "Silver", points: 1000 },
      { name: "Gold", points: 2000 },
      { name: "Platinum", points: 5000 },
      { name: "Diamond", points: 10000 }
    ];
    
    let currentTierIndex = -1;
    for (let i = 0; i < tiers.length; i++) {
      if (tiers[i].name === customer.loyalty_tier) {
        currentTierIndex = i;
        break;
      }
    }
    
    if (currentTierIndex === tiers.length - 1 || currentTierIndex === -1) {
      return null;
    }
    
    const nextTier = tiers[currentTierIndex + 1];
    const pointsNeeded = nextTier.points - customer.loyalty_points;
    const progress = Math.min(100, (customer.loyalty_points / nextTier.points) * 100);
    
    return {
      nextTier: nextTier.name,
      pointsNeeded,
      progress
    };
  };
  
  const nextTierInfo = getNextTierInfo();
  
  const handleAddNote = async () => {
    if (!customer || !newNote) return;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc('add_customer_note', {
        customer_id_param: customer.id,
        restaurant_id_param: customer.restaurant_id,
        content_param: newNote,
        created_by_param: userData.user?.email || 'Staff'
      });
      
      if (error) throw error;
      
      await supabase.rpc('add_customer_activity', {
        customer_id_param: customer.id,
        restaurant_id_param: customer.restaurant_id,
        activity_type_param: 'note_added',
        description_param: 'Staff added note about customer'
      });
      
      setNewNote('');
      
      loadCustomerNotes();
      
      toast({
        title: "Note Added",
        description: "Your note has been added successfully."
      });
      
      loadCustomerActivities();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add note."
      });
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !newTag) return;

    try {
      if (customer.tags && customer.tags.includes(newTag)) {
        toast({
          variant: "destructive",
          title: "Duplicate Tag",
          description: "This tag already exists for this customer."
        });
        return;
      }

      const updatedTags = customer.tags ? [...customer.tags, newTag] : [newTag];

      const { error } = await supabase
        .from('customers')
        .update({ tags: updatedTags })
        .eq('id', customer.id);

      if (error) throw error;

      if (customer) {
        customer.tags = updatedTags;
      }

      await supabase.rpc('add_customer_activity', {
        customer_id_param: customer.id,
        restaurant_id_param: customer.restaurant_id,
        activity_type_param: 'tag_added',
        description_param: `Added tag "${newTag}"`
      });

      setNewTag('');
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      loadCustomerActivities();

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

  const handleRemoveTag = async (tag: string) => {
    if (!customer) return;

    try {
      const updatedTags = customer.tags.filter(t => t !== tag);

      const { error } = await supabase
        .from('customers')
        .update({ tags: updatedTags })
        .eq('id', customer.id);

      if (error) throw error;

      if (customer) {
        customer.tags = updatedTags;
      }

      await supabase.rpc('add_customer_activity', {
        customer_id_param: customer.id,
        restaurant_id_param: customer.restaurant_id,
        activity_type_param: 'tag_removed',
        description_param: `Removed tag "${tag}"`
      });

      queryClient.invalidateQueries({ queryKey: ["customers"] });
      loadCustomerActivities();

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

  const handleUpdatePreferences = async () => {
    if (!customer) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({ preferences: preferences })
        .eq('id', customer.id);

      if (error) throw error;

      if (customer) {
        customer.preferences = preferences;
      }

      setIsEditingPreferences(false);
      queryClient.invalidateQueries({ queryKey: ["customers"] });

      toast({
        title: "Preferences Updated",
        description: "Customer preferences have been updated successfully."
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update preferences."
      });
    }
  };

  const handleCancelPreferences = () => {
    setPreferences(customer?.preferences || '');
    setIsEditingPreferences(false);
  };

  useEffect(() => {
    if (customer) {
      setPreferences(customer.preferences || '');
    }
  }, [customer?.id, customer?.preferences]);

  if (!customer) {
    return (
      <div className="h-full p-6 flex flex-col items-center justify-center">
        <User className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-medium">Select a customer</h2>
        <p className="mt-2 text-muted-foreground text-center max-w-md">
          Choose a customer from the list to view their details, orders, and activity history
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <CustomerHeader customer={customer} onEditCustomer={onEditCustomer} />

      <ScrollArea className="flex-1 overflow-auto">
        <Tabs defaultValue="profile">
          <div className="px-6 pt-4 border-b">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-6">
            <TabsContent value="profile" className="mt-0">
              <ProfileTab
                customer={customer}
                nextTierInfo={nextTierInfo}
                preferences={preferences}
                isEditingPreferences={isEditingPreferences}
                onStartEditingPreferences={() => setIsEditingPreferences(true)}
                onPreferencesChange={setPreferences}
                onSavePreferences={handleUpdatePreferences}
                onCancelPreferences={handleCancelPreferences}
                onAdjustPoints={() => setLoyaltyDialogOpen(true)}
                onViewPointsHistory={loadTransactions}
                onUnenroll={() => {
                  if (window.confirm("Are you sure you want to remove this customer from the loyalty program? They will lose all accumulated points.")) {
                    unenrollCustomer.mutate();
                  }
                }}
                onEnroll={() => enrollCustomer.mutate()}
                onAddTag={(tag) => onAddTag(customer.id, tag)}
                onRemoveTag={(tag) => onRemoveTag(customer.id, tag)}
                isLoading={enrollCustomer.isPending || unenrollCustomer.isPending}
              />
            </TabsContent>
            
            <TabsContent value="orders" className="mt-0">
              <OrdersTab orders={orders} loading={loading} />
            </TabsContent>
            
            <TabsContent value="notes" className="mt-0">
              <NotesTab
                notes={customerNotes}
                loading={isLoadingNotes}
                newNote={newNote}
                onNewNoteChange={setNewNote}
                onAddNote={handleAddNote}
              />
            </TabsContent>
            
            <TabsContent value="activity" className="mt-0">
              <ActivityTab
                activities={customerActivities}
                loading={isLoadingActivities}
              />
            </TabsContent>
          </div>
        </Tabs>
      </ScrollArea>

      <LoyaltyPointsDialog
        open={loyaltyDialogOpen}
        onOpenChange={setLoyaltyDialogOpen}
        manualPointsAmount={manualPointsAmount}
        manualPointsNote={manualPointsNote}
        onManualPointsAmountChange={setManualPointsAmount}
        onManualPointsNoteChange={setManualPointsNote}
        onSubmit={() => addManualPoints.mutate({ 
          amount: manualPointsAmount, 
          notes: manualPointsNote 
        })}
        loading={addManualPoints.isPending}
      />
    </div>
  );
};

export default CustomerDetail;
