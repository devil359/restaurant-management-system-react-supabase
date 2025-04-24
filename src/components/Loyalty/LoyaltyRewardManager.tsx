
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Gift } from "lucide-react";
import { LoyaltyReward, LoyaltyTier } from "@/types/customer";
import { Textarea } from "@/components/ui/textarea";

const LoyaltyRewardManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentReward, setCurrentReward] = useState<Partial<LoyaltyReward> | null>(null);
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

  // Fetch loyalty rewards
  const { data: rewards = [], isLoading: isLoadingRewards } = useQuery({
    queryKey: ["loyalty-rewards"],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from("loyalty_rewards")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("points_required", { ascending: true });
        
      if (error) throw error;
      return data as LoyaltyReward[];
    },
    enabled: !!restaurantId
  });

  // Fetch loyalty tiers for dropdown
  const { data: tiers = [], isLoading: isLoadingTiers } = useQuery({
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
  
  // Open dialog to add/edit reward
  const openRewardDialog = (reward?: LoyaltyReward) => {
    if (reward) {
      setCurrentReward({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        points_required: reward.points_required,
        reward_type: reward.reward_type,
        reward_value: reward.reward_value,
        tier_id: reward.tier_id,
        is_active: reward.is_active
      });
    } else {
      setCurrentReward({
        name: '',
        description: '',
        points_required: 100,
        reward_type: 'discount_percentage',
        reward_value: 10,
        tier_id: null,
        is_active: true
      });
    }
    setDialogOpen(true);
  };
  
  // Save reward mutation
  const saveReward = useMutation({
    mutationFn: async (reward: Partial<LoyaltyReward>) => {
      if (!restaurantId) throw new Error("Restaurant ID is required");
      
      if (reward.id) {
        // Update existing reward
        const { data, error } = await supabase
          .from("loyalty_rewards")
          .update({
            name: reward.name,
            description: reward.description,
            points_required: reward.points_required,
            reward_type: reward.reward_type,
            reward_value: reward.reward_value,
            tier_id: reward.tier_id,
            is_active: reward.is_active
          })
          .eq("id", reward.id)
          .select();
          
        if (error) throw error;
        return data;
      } else {
        // Create new reward
        const { data, error } = await supabase
          .from("loyalty_rewards")
          .insert({
            restaurant_id: restaurantId,
            name: reward.name,
            description: reward.description,
            points_required: reward.points_required,
            reward_type: reward.reward_type,
            reward_value: reward.reward_value,
            tier_id: reward.tier_id,
            is_active: reward.is_active
          })
          .select();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards"] });
      setDialogOpen(false);
      toast({
        title: currentReward?.id ? "Reward Updated" : "Reward Added",
        description: `Loyalty reward has been ${currentReward?.id ? "updated" : "added"} successfully.`
      });
    },
    onError: (error) => {
      console.error("Error saving reward:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${currentReward?.id ? "update" : "add"} loyalty reward.`
      });
    }
  });
  
  // Delete reward mutation
  const deleteReward = useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase
        .from("loyalty_rewards")
        .delete()
        .eq("id", rewardId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards"] });
      toast({
        title: "Reward Deleted",
        description: "Loyalty reward has been deleted successfully."
      });
    },
    onError: (error) => {
      console.error("Error deleting reward:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete loyalty reward."
      });
    }
  });

  // Toggle reward active status
  const toggleRewardStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("loyalty_rewards")
        .update({ is_active: isActive })
        .eq("id", id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards"] });
    },
    onError: (error) => {
      console.error("Error toggling reward status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update reward status."
      });
    }
  });
  
  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentReward?.name || !currentReward.points_required) return;
    
    saveReward.mutate(currentReward);
  };

  // Format reward value based on type
  const formatRewardValue = (reward: LoyaltyReward) => {
    switch (reward.reward_type) {
      case 'discount_percentage':
        return `${reward.reward_value}% discount`;
      case 'discount_amount':
        return `₹${reward.reward_value} discount`;
      case 'free_item':
        return `Free item (ID: ${reward.reward_value})`;
      default:
        return `${reward.reward_value}`;
    }
  };

  if (isLoadingRewards || isLoadingTiers) {
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
            <CardTitle>Loyalty Rewards</CardTitle>
            <CardDescription>Define rewards customers can redeem with their points</CardDescription>
          </div>
          <Button onClick={() => openRewardDialog()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Reward
          </Button>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Gift className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Rewards Created</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                Create rewards that your customers can redeem with their loyalty points.
              </p>
              <Button onClick={() => openRewardDialog()} className="mt-4">
                Create First Reward
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Active</TableHead>
                  <TableHead>Reward Name</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Reward Value</TableHead>
                  <TableHead>Tier Requirement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.map((reward) => (
                  <TableRow key={reward.id} className={!reward.is_active ? "opacity-60" : ""}>
                    <TableCell>
                      <Switch 
                        checked={reward.is_active} 
                        onCheckedChange={(checked) => toggleRewardStatus.mutate({ id: reward.id, isActive: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{reward.name}</div>
                        {reward.description && (
                          <div className="text-xs text-muted-foreground">{reward.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{reward.points_required} points</TableCell>
                    <TableCell>{formatRewardValue(reward)}</TableCell>
                    <TableCell>
                      {reward.tier_id ? (
                        <Badge variant="outline">
                          {tiers.find(t => t.id === reward.tier_id)?.name || "Unknown Tier"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Any tier</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openRewardDialog(reward)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the "${reward.name}" reward?`)) {
                              deleteReward.mutate(reward.id);
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
            <DialogTitle>{currentReward?.id ? 'Edit' : 'Add'} Loyalty Reward</DialogTitle>
            <DialogDescription>
              Configure the details for this loyalty reward.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Active</label>
                <Switch 
                  checked={currentReward?.is_active} 
                  onCheckedChange={(checked) => setCurrentReward({ ...currentReward!, is_active: checked })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Reward Name</label>
                <Input
                  value={currentReward?.name || ''}
                  onChange={(e) => setCurrentReward({ ...currentReward!, name: e.target.value })}
                  placeholder="E.g. 10% Discount, Free Dessert"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  value={currentReward?.description || ''}
                  onChange={(e) => setCurrentReward({ ...currentReward!, description: e.target.value })}
                  placeholder="Add details about this reward"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Points Required</label>
                <Input
                  type="number"
                  min="1"
                  value={currentReward?.points_required || 0}
                  onChange={(e) => setCurrentReward({ ...currentReward!, points_required: parseInt(e.target.value) })}
                  placeholder="Points needed to redeem this reward"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Reward Type</label>
                <Select 
                  value={currentReward?.reward_type || 'discount_percentage'} 
                  onValueChange={(value: LoyaltyReward['reward_type']) => 
                    setCurrentReward({ ...currentReward!, reward_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reward type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount_percentage">Percentage Discount</SelectItem>
                    <SelectItem value="discount_amount">Fixed Amount Discount</SelectItem>
                    <SelectItem value="free_item">Free Menu Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {currentReward?.reward_type === 'discount_percentage' && 'Discount Percentage (%)'}
                  {currentReward?.reward_type === 'discount_amount' && 'Discount Amount (₹)'}
                  {currentReward?.reward_type === 'free_item' && 'Menu Item ID'}
                </label>
                <Input
                  type="number"
                  min="0"
                  step={currentReward?.reward_type === 'discount_percentage' ? "1" : "0.01"}
                  value={currentReward?.reward_value || 0}
                  onChange={(e) => setCurrentReward({ ...currentReward!, reward_value: parseFloat(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {currentReward?.reward_type === 'discount_percentage' && 'Enter percentage discount (e.g., 10 for 10%)'}
                  {currentReward?.reward_type === 'discount_amount' && 'Enter the fixed discount amount in rupees'}
                  {currentReward?.reward_type === 'free_item' && 'Enter the menu item ID for the free item'}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tier Restriction (Optional)</label>
                <Select 
                  value={currentReward?.tier_id || ''} 
                  onValueChange={(value: string) => 
                    setCurrentReward({ ...currentReward!, tier_id: value || null })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any tier (No restriction)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any tier (No restriction)</SelectItem>
                    {tiers.map((tier) => (
                      <SelectItem key={tier.id} value={tier.id}>
                        {tier.name} ({tier.points_required}+ points)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Optional: Restrict this reward to customers in a specific tier or higher
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
              <Button type="submit" disabled={saveReward.isPending}>
                {saveReward.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentReward?.id ? 'Update' : 'Create'} Reward
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoyaltyRewardManager;
