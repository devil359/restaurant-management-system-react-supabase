
import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { User, Phone, Mail, MapPin, Calendar, Tag, PenSquare, Plus, Clock, FileText, Trash2, ShoppingCart, MessageSquare, Award, Coins, CreditCard } from "lucide-react";
import { Customer, CustomerOrder, CustomerNote, CustomerActivity, LoyaltyTransaction } from "@/types/customer";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { LoyaltyBadge } from "@/components/Customers/LoyaltyBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  
  // Load customer notes from database
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
      // Use raw RPC call instead of direct table access to avoid type issues
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
  
  // Load customer activities from database
  const loadCustomerActivities = async () => {
    if (!customer) return;
    
    setIsLoadingActivities(true);
    try {
      // Use raw RPC call instead of direct table access to avoid type issues
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
  
  // Enroll customer in loyalty program
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
      
      // Insert activity using a function call instead of direct insert
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
      // Update the current customer in memory with enrolled status
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
  
  // Unenroll customer from loyalty program
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
      
      // Insert activity using a function call instead of direct insert
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
      // Update the current customer in memory with unenrolled status
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
  
  // Add manual loyalty points
  const addManualPoints = useMutation({
    mutationFn: async ({ amount, notes }: { amount: number; notes: string }) => {
      if (!customer) throw new Error("No customer selected");
      if (amount === 0) throw new Error("Points amount cannot be zero");
      
      // Get current points
      const { data: currentCustomer, error: fetchError } = await supabase
        .from("customers")
        .select("loyalty_points")
        .eq("id", customer.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      const newPoints = (currentCustomer?.loyalty_points || 0) + amount;
      
      if (newPoints < 0) throw new Error("Cannot reduce points below zero");
      
      // Update customer points
      const { error: updateError } = await supabase
        .from("customers")
        .update({ loyalty_points: newPoints })
        .eq("id", customer.id);
        
      if (updateError) throw updateError;
      
      const { data: userData } = await supabase.auth.getUser();
      
      // Record transaction using RPC call instead of direct insertion
      await supabase.rpc('add_loyalty_transaction', {
        customer_id_param: customer.id,
        restaurant_id_param: customer.restaurant_id,
        transaction_type_param: amount > 0 ? 'earn' : 'adjust',
        points_param: amount,
        source_param: 'manual',
        notes_param: notes,
        created_by_param: userData.user?.id || null
      });
      
      // Add activity using RPC call
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
  
  // Load loyalty transactions
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
  
  // Get next tier information
  const getNextTierInfo = () => {
    if (!customer) return null;
    
    // Mock tiers with points thresholds - replace with real data when available
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
    
    // If customer is at the highest tier or not enrolled
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
  
  // Handle adding notes
  const handleAddNote = async () => {
    if (!customer || !newNote) return;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Add note using RPC call
      const { data, error } = await supabase.rpc('add_customer_note', {
        customer_id_param: customer.id,
        restaurant_id_param: customer.restaurant_id,
        content_param: newNote,
        created_by_param: userData.user?.email || 'Staff'
      });
      
      if (error) throw error;
      
      // Add activity for note
      await supabase.rpc('add_customer_activity', {
        customer_id_param: customer.id,
        restaurant_id_param: customer.restaurant_id,
        activity_type_param: 'note_added',
        description_param: 'Staff added note about customer'
      });
      
      setNewNote('');
      
      // Refresh the notes list
      loadCustomerNotes();
      
      toast({
        title: "Note Added",
        description: "Your note has been added successfully."
      });
      
      // Also reload activities to show the note activity
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

  // Handle adding tags
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !newTag) return;

    try {
      // Check if customer already has this tag
      if (customer.tags && customer.tags.includes(newTag)) {
        toast({
          variant: "destructive",
          title: "Duplicate Tag",
          description: "This tag already exists for this customer."
        });
        return;
      }

      // Create new tags array
      const updatedTags = customer.tags ? [...customer.tags, newTag] : [newTag];

      // Update customer tags in database
      const { error } = await supabase
        .from('customers')
        .update({ tags: updatedTags })
        .eq('id', customer.id);

      if (error) throw error;

      // Update local state
      if (customer) {
        customer.tags = updatedTags;
      }

      // Add activity
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

  // Handle removing tags
  const handleRemoveTag = async (tag: string) => {
    if (!customer) return;

    try {
      // Create new tags array without the removed tag
      const updatedTags = customer.tags.filter(t => t !== tag);

      // Update customer tags in database
      const { error } = await supabase
        .from('customers')
        .update({ tags: updatedTags })
        .eq('id', customer.id);

      if (error) throw error;

      // Update local state
      if (customer) {
        customer.tags = updatedTags;
      }

      // Add activity
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

  // Handle updating preferences
  const handleUpdatePreferences = async () => {
    if (!customer) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({ preferences: preferences })
        .eq('id', customer.id);

      if (error) throw error;

      // Update local state
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

  // Handle canceling preference edit
  const handleCancelPreferences = () => {
    setPreferences(customer?.preferences || '');
    setIsEditingPreferences(false);
  };

  // Initialize preferences when customer changes
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
      {/* Customer header */}
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
        <Button onClick={() => onEditCustomer(customer)} variant="outline" className="flex items-center gap-2">
          <PenSquare className="h-4 w-4" />
          Edit Customer
        </Button>
      </div>

      {/* Customer content */}
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
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Loyalty</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {customer.loyalty_enrolled ? (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <Award className="h-5 w-5 text-primary" />
                          <div className="text-lg font-semibold">
                            {customer.loyalty_tier} Tier Member
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Current Points</span>
                          <Badge 
                            variant="secondary" 
                            className="text-sm flex items-center gap-1"
                          >
                            <Coins className="h-3.5 w-3.5" />
                            {customer.loyalty_points} points
                          </Badge>
                        </div>
                        
                        {nextTierInfo ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress to {nextTierInfo.nextTier}</span>
                              <span>{nextTierInfo.pointsNeeded} points needed</span>
                            </div>
                            <Progress value={nextTierInfo.progress} className="h-2" />
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Highest tier achieved
                          </div>
                        )}
                        
                        <Separator className="my-4" />
                        
                        <div className="space-y-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full flex items-center gap-2"
                            onClick={() => setLoyaltyDialogOpen(true)}
                          >
                            <CreditCard className="h-4 w-4" />
                            Adjust Points
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full flex items-center gap-2"
                            onClick={loadTransactions}
                          >
                            <Clock className="h-4 w-4" />
                            View Points History
                          </Button>
                          
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              if (window.confirm("Are you sure you want to remove this customer from the loyalty program? They will lose all accumulated points.")) {
                                unenrollCustomer.mutate();
                              }
                            }}
                          >
                            Remove from Loyalty Program
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Award className="h-12 w-12 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium mb-2">Not Enrolled</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          This customer is not enrolled in your loyalty program yet.
                        </p>
                        <Button onClick={() => enrollCustomer.mutate()} className="w-full">
                          Enroll Customer
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Customer Tags</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    {customer.tags && customer.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {customer.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button 
                              className="ml-1 h-4 w-4 rounded-full hover:bg-primary/20 inline-flex items-center justify-center" 
                              onClick={() => handleRemoveTag(tag)}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No tags added yet</div>
                    )}
                  </div>
                  
                  <form onSubmit={handleAddTag} className="flex gap-2">
                    <Input 
                      value={newTag} 
                      onChange={(e) => setNewTag(e.target.value)} 
                      placeholder="Add a tag" 
                      className="flex-1"
                    />
                    <Button type="submit" size="sm" variant="outline" disabled={!newTag}>
                      <Tag className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>Preferences</span>
                    {!isEditingPreferences && (
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingPreferences(true)}
                      >
                        <PenSquare className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditingPreferences ? (
                    <div className="space-y-4">
                      <Textarea 
                        value={preferences} 
                        onChange={(e) => setPreferences(e.target.value)} 
                        placeholder="Customer preferences, dietary restrictions, etc."
                        rows={4}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={handleCancelPreferences}>
                          Cancel
                        </Button>
                        <Button onClick={handleUpdatePreferences}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">
                      {customer.preferences || "No preferences added yet."}
                    </p>
                  )}
                </CardContent>
              </Card>
              
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
            </TabsContent>
            
            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>
                    {orders.length} order{orders.length !== 1 ? 's' : ''} placed by this customer
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
                        This customer hasn't placed any orders yet.
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
            </TabsContent>
            
            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Notes</CardTitle>
                  <CardDescription>
                    Add private notes about this customer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 space-y-2">
                    <Textarea 
                      placeholder="Add a note about this customer..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleAddNote} 
                        disabled={!newNote.trim()}
                        size="sm"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {isLoadingNotes ? (
                    <div className="flex justify-center py-6">
                      <svg className="animate-spin h-6 w-6 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : customerNotes.length === 0 ? (
                    <div className="text-center py-6">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-lg font-medium">No Notes</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        There are no notes for this customer yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customerNotes.map(note => (
                        <div key={note.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 flex-1">
                              <p className="whitespace-pre-wrap">{note.content}</p>
                              <div className="text-xs text-muted-foreground">
                                By {note.created_by} • {format(new Date(note.created_at), 'MMMM d, yyyy • h:mm a')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                  <CardDescription>
                    Recent customer activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingActivities ? (
                    <div className="flex justify-center py-6">
                      <svg className="animate-spin h-6 w-6 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : customerActivities.length === 0 ? (
                    <div className="text-center py-6">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-lg font-medium">No Activity</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        No activity has been recorded for this customer yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerActivities.map(activity => (
                        <div key={activity.id} className="flex items-start gap-3 border-b border-border/30 pb-3 last:border-0">
                          {activity.activity_type === 'note_added' && <MessageSquare className="w-5 h-5 text-blue-500" />}
                          {activity.activity_type === 'order_placed' && <ShoppingCart className="w-5 h-5 text-green-500" />}
                          {activity.activity_type === 'tag_added' && <Tag className="w-5 h-5 text-purple-500" />}
                          {activity.activity_type === 'tag_removed' && <Tag className="w-5 h-5 text-red-500" />}
                          {activity.activity_type === 'promotion_sent' && <Award className="w-5 h-5 text-amber-500" />}
                          {activity.activity_type === 'email_sent' && <Mail className="w-5 h-5 text-indigo-500" />}
                          <div className="flex-1">
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(activity.created_at), 'MMMM d, yyyy • h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </ScrollArea>
      
      {/* Loyalty Points Dialog */}
      <Dialog open={loyaltyDialogOpen} onOpenChange={setLoyaltyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Loyalty Points</DialogTitle>
            <DialogDescription>
              Add or remove loyalty points for {customer.name}. Use negative values to deduct points.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="font-medium">Current Points: {customer.loyalty_points}</div>
              <Input
                type="number"
                placeholder="Enter points amount"
                value={manualPointsAmount === 0 ? '' : manualPointsAmount}
                onChange={(e) => setManualPointsAmount(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <div className="font-medium">Note</div>
              <Textarea
                placeholder="Reason for adjustment"
                value={manualPointsNote}
                onChange={(e) => setManualPointsNote(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoyaltyDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => addManualPoints.mutate({ amount: manualPointsAmount, notes: manualPointsNote })} 
              disabled={manualPointsAmount === 0 || addManualPoints.isPending}
            >
              {addManualPoints.isPending ? "Updating..." : "Update Points"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Loyalty Transactions History Dialog */}
      {showTransactionHistory && (
        <Dialog open={showTransactionHistory} onOpenChange={setShowTransactionHistory}>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Loyalty Points History</DialogTitle>
              <DialogDescription>
                Transaction history for {customer.name}'s loyalty points
              </DialogDescription>
            </DialogHeader>
            
            <div className="overflow-y-auto max-h-[60vh]">
              {loadingTransactions ? (
                <div className="flex justify-center py-6">
                  <svg className="animate-spin h-6 w-6 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : loyaltyTransactions.length === 0 ? (
                <div className="text-center py-6">
                  <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium">No Transactions</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    No loyalty points transactions have been recorded yet
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loyaltyTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            transaction.transaction_type === 'earn' ? 'success' : 
                            transaction.transaction_type === 'redeem' ? 'destructive' : 
                            'warning'
                          }>
                            {transaction.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell className={transaction.transaction_type === 'earn' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.transaction_type === 'earn' ? '+' : '-'}{Math.abs(transaction.points)}
                        </TableCell>
                        <TableCell>{transaction.source}</TableCell>
                        <TableCell>{transaction.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            
            <DialogFooter>
              <Button onClick={() => setShowTransactionHistory(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CustomerDetail;
