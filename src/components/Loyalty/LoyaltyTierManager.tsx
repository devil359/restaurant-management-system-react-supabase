
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, ChevronUp, ChevronDown, Medal } from "lucide-react";
import { LoyaltyTier } from "@/types/customer";
import { Textarea } from "@/components/ui/textarea";

const LoyaltyTierManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTier, setCurrentTier] = useState<Partial<LoyaltyTier> | null>(null);
  const [newBenefit, setNewBenefit] = useState("");
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Get restaurant ID for the current user
  useEffect(() => {
    const getRestaurantId = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();
        
      if (profile?.restaurant_id) {
        setRestaurantId(profile.restaurant_id);
      }
    };
    
    getRestaurantId();
  }, []);

  // Fetch loyalty tiers
  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ["loyalty-tiers"],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from("loyalty_tiers")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("points_required", { ascending: true });
        
      if (error) throw error;
      return data as LoyaltyTier[];
    },
    enabled: !!restaurantId
  });
  
  // Open dialog to add/edit tier
  const openTierDialog = (tier?: LoyaltyTier) => {
    if (tier) {
      setCurrentTier({
        id: tier.id,
        name: tier.name,
        points_required: tier.points_required,
        benefits: tier.benefits,
        display_order: tier.display_order
      });
    } else {
      setCurrentTier({
        name: '',
        points_required: tiers.length ? tiers[tiers.length - 1].points_required + 500 : 500,
        benefits: [],
        display_order: tiers.length
      });
    }
    setDialogOpen(true);
  };
  
  // Save tier mutation
  const saveTier = useMutation({
    mutationFn: async (tier: Partial<LoyaltyTier>) => {
      if (!restaurantId) throw new Error("Restaurant ID is required");
      
      if (tier.id) {
        // Update existing tier
        const { data, error } = await supabase
          .from("loyalty_tiers")
          .update({
            name: tier.name,
            points_required: tier.points_required,
            benefits: tier.benefits,
            display_order: tier.display_order
          })
          .eq("id", tier.id)
          .select();
          
        if (error) throw error;
        return data;
      } else {
        // Create new tier
        const { data, error } = await supabase
          .from("loyalty_tiers")
          .insert({
            restaurant_id: restaurantId,
            name: tier.name,
            points_required: tier.points_required,
            benefits: tier.benefits,
            display_order: tier.display_order
          })
          .select();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-tiers"] });
      setDialogOpen(false);
      toast({
        title: currentTier?.id ? "Tier Updated" : "Tier Added",
        description: `Loyalty tier has been ${currentTier?.id ? "updated" : "added"} successfully.`
      });
    },
    onError: (error) => {
      console.error("Error saving tier:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${currentTier?.id ? "update" : "add"} loyalty tier.`
      });
    }
  });
  
  // Delete tier mutation
  const deleteTier = useMutation({
    mutationFn: async (tierId: string) => {
      const { error } = await supabase
        .from("loyalty_tiers")
        .delete()
        .eq("id", tierId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-tiers"] });
      toast({
        title: "Tier Deleted",
        description: "Loyalty tier has been deleted successfully."
      });
    },
    onError: (error) => {
      console.error("Error deleting tier:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete loyalty tier."
      });
    }
  });
  
  // Move tier order mutation
  const moveTierOrder = useMutation({
    mutationFn: async ({ tierId, direction }: { tierId: string; direction: 'up' | 'down' }) => {
      const tierIndex = tiers.findIndex(t => t.id === tierId);
      if (tierIndex === -1) throw new Error("Tier not found");
      
      const newTiers = [...tiers];
      const swapIndex = direction === 'up' ? tierIndex - 1 : tierIndex + 1;
      
      if (swapIndex < 0 || swapIndex >= newTiers.length) {
        throw new Error("Cannot move tier further");
      }
      
      // Swap display orders
      const currentOrder = newTiers[tierIndex].display_order;
      const targetOrder = newTiers[swapIndex].display_order;
      
      const { error: error1 } = await supabase
        .from("loyalty_tiers")
        .update({ display_order: targetOrder })
        .eq("id", tierId);
        
      if (error1) throw error1;
      
      const { error: error2 } = await supabase
        .from("loyalty_tiers")
        .update({ display_order: currentOrder })
        .eq("id", newTiers[swapIndex].id);
        
      if (error2) throw error2;
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-tiers"] });
    },
    onError: (error) => {
      console.error("Error moving tier:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change tier order."
      });
    }
  });
  
  // Add a benefit to the current tier being edited
  const addBenefit = () => {
    if (!newBenefit.trim() || !currentTier) return;
    
    const updatedBenefits = [...(currentTier.benefits || []), newBenefit.trim()];
    setCurrentTier({ ...currentTier, benefits: updatedBenefits });
    setNewBenefit("");
  };
  
  // Remove a benefit from the current tier being edited
  const removeBenefit = (index: number) => {
    if (!currentTier) return;
    
    const updatedBenefits = [...(currentTier.benefits || [])];
    updatedBenefits.splice(index, 1);
    setCurrentTier({ ...currentTier, benefits: updatedBenefits });
  };
  
  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTier?.name || !currentTier.points_required) return;
    
    saveTier.mutate(currentTier);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Loyalty Tiers</CardTitle>
            <CardDescription>Configure tiers for your loyalty program</CardDescription>
          </div>
          <Button onClick={() => openTierDialog()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Tier
          </Button>
        </CardHeader>
        <CardContent>
          {tiers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Medal className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Tiers Created</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                Create tiers to reward your customers based on their loyalty points.
              </p>
              <Button onClick={() => openTierDialog()} className="mt-4">
                Create First Tier
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Tier Name</TableHead>
                  <TableHead>Points Required</TableHead>
                  <TableHead>Benefits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell className="w-24">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveTierOrder.mutate({ tierId: tier.id, direction: 'up' })}
                          disabled={tier.display_order === 0}
                          className="h-8 w-8"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveTierOrder.mutate({ tierId: tier.id, direction: 'down' })}
                          disabled={tier.display_order === tiers.length - 1}
                          className="h-8 w-8"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{tier.name}</TableCell>
                    <TableCell>{tier.points_required} points</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tier.benefits?.length ? (
                          tier.benefits.map((benefit, idx) => (
                            <Badge key={idx} variant="secondary">
                              {benefit}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No benefits defined</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openTierDialog(tier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the ${tier.name} tier?`)) {
                              deleteTier.mutate(tier.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{currentTier?.id ? 'Edit' : 'Add'} Loyalty Tier</DialogTitle>
            <DialogDescription>
              Configure the details for this loyalty tier.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tier Name</label>
                <Input
                  value={currentTier?.name || ''}
                  onChange={(e) => setCurrentTier({ ...currentTier!, name: e.target.value })}
                  placeholder="E.g. Bronze, Silver, Gold"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Points Required</label>
                <Input
                  type="number"
                  min="0"
                  value={currentTier?.points_required || 0}
                  onChange={(e) => setCurrentTier({ ...currentTier!, points_required: parseInt(e.target.value) })}
                  placeholder="Minimum points needed for this tier"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Benefits</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {currentTier?.benefits?.map((benefit, idx) => (
                    <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                      {benefit}
                      <button
                        type="button"
                        onClick={() => removeBenefit(idx)}
                        className="ml-1 h-4 w-4 rounded-full hover:bg-destructive/20 inline-flex items-center justify-center"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {!currentTier?.benefits?.length && (
                    <span className="text-xs text-muted-foreground">No benefits added yet</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Input
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Add a benefit"
                  />
                  <Button type="button" onClick={addBenefit} size="sm">
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Benefits are displayed to customers to show tier advantages
                </p>
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveTier.isPending}>
                {saveTier.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentTier?.id ? 'Update' : 'Create'} Tier
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoyaltyTierManager;
