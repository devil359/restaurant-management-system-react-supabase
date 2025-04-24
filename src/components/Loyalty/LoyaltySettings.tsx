
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Loader2, Settings, Medal, Gift, Plus, Info, Save, Trash2 } from "lucide-react";
import { LoyaltyProgram, LoyaltyTier, LoyaltyReward } from "@/types/customer";
import LoyaltyTierManager from "./LoyaltyTierManager";
import LoyaltyRewardManager from "./LoyaltyRewardManager";

const LoyaltySettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Fetch loyalty program settings
  const { data: loyaltyProgram, isLoading: isLoadingProgram } = useQuery({
    queryKey: ["loyalty-program"],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.restaurant_id) {
        throw new Error("No restaurant found for user");
      }

      const { data, error } = await supabase
        .from("loyalty_programs")
        .select("*")
        .eq("restaurant_id", profile.restaurant_id)
        .maybeSingle();

      if (error) throw error;
      
      // If no program exists, return default values
      if (!data) {
        return {
          id: "",
          restaurant_id: profile.restaurant_id,
          is_enabled: false,
          points_per_amount: 1,
          amount_per_point: 100,
          points_expiry_days: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as LoyaltyProgram;
      }
      
      return data as LoyaltyProgram;
    }
  });

  // Form state
  const [programSettings, setProgramSettings] = useState<Partial<LoyaltyProgram>>({
    is_enabled: false,
    points_per_amount: 1,
    amount_per_point: 100,
    points_expiry_days: null
  });

  // Update form when data is loaded
  useEffect(() => {
    if (loyaltyProgram) {
      setProgramSettings({
        is_enabled: loyaltyProgram.is_enabled,
        points_per_amount: loyaltyProgram.points_per_amount,
        amount_per_point: loyaltyProgram.amount_per_point,
        points_expiry_days: loyaltyProgram.points_expiry_days
      });
    }
  }, [loyaltyProgram]);

  // Save program settings
  const saveSettings = async () => {
    if (!loyaltyProgram?.restaurant_id) return;
    
    try {
      setSaving(true);
      
      if (loyaltyProgram.id) {
        // Update existing program
        const { error } = await supabase
          .from("loyalty_programs")
          .update({
            is_enabled: programSettings.is_enabled,
            points_per_amount: programSettings.points_per_amount,
            amount_per_point: programSettings.amount_per_point,
            points_expiry_days: programSettings.points_expiry_days
          })
          .eq("id", loyaltyProgram.id);
          
        if (error) throw error;
      } else {
        // Create new program
        const { error } = await supabase
          .from("loyalty_programs")
          .insert({
            restaurant_id: loyaltyProgram.restaurant_id,
            is_enabled: programSettings.is_enabled,
            points_per_amount: programSettings.points_per_amount,
            amount_per_point: programSettings.amount_per_point,
            points_expiry_days: programSettings.points_expiry_days
          });
          
        if (error) throw error;
      }
      
      queryClient.invalidateQueries({ queryKey: ["loyalty-program"] });
      
      toast({
        title: "Settings Saved",
        description: "Loyalty program settings have been updated successfully"
      });
    } catch (error) {
      console.error("Error saving loyalty program settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save loyalty program settings"
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingProgram) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Loyalty Program Settings</h2>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </div>
      
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="tiers" className="flex items-center gap-2">
            <Medal className="h-4 w-4" />
            Loyalty Tiers
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Rewards
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Program Status</CardTitle>
              <CardDescription>Enable or disable the loyalty program for your restaurant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={programSettings.is_enabled} 
                  onCheckedChange={(checked) => setProgramSettings({...programSettings, is_enabled: checked})}
                />
                <span>{programSettings.is_enabled ? "Enabled" : "Disabled"}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Points Configuration</CardTitle>
              <CardDescription>Configure how points are earned and managed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Points Earned Per Amount
                    <span className="text-xs text-muted-foreground">(How many points customers earn)</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="number" 
                      min="0.1" 
                      step="0.1" 
                      value={programSettings.points_per_amount} 
                      onChange={(e) => setProgramSettings({...programSettings, points_per_amount: parseFloat(e.target.value)})}
                      className="w-24"
                    />
                    <span>point(s) per</span>
                    <Input 
                      type="number" 
                      min="1" 
                      value={programSettings.amount_per_point} 
                      onChange={(e) => setProgramSettings({...programSettings, amount_per_point: parseFloat(e.target.value)})}
                      className="w-24"
                    />
                    <span>₹ spent</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Example: With current settings, a ₹{programSettings.amount_per_point} purchase would earn {programSettings.points_per_amount} point(s).
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Points Expiry
                    <span className="text-xs text-muted-foreground">(Leave blank for no expiry)</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="number" 
                      min="0" 
                      value={programSettings.points_expiry_days || ''} 
                      onChange={(e) => setProgramSettings({...programSettings, points_expiry_days: e.target.value ? parseInt(e.target.value) : null})}
                      className="w-24"
                      placeholder="Never"
                    />
                    <span>days after earning</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tiers" className="pt-4">
          <LoyaltyTierManager />
        </TabsContent>
        
        <TabsContent value="rewards" className="pt-4">
          <LoyaltyRewardManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoyaltySettings;
