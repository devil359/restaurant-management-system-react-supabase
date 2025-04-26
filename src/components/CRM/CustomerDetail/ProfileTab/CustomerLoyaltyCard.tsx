
import React, { useState } from "react";
import { Award, Coins, CreditCard, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Customer } from "@/types/customer";

interface CustomerLoyaltyCardProps {
  customer: Customer;
  nextTierInfo: { nextTier: string; pointsNeeded: number; progress: number } | null;
  onAdjustPoints: () => void;
  onViewHistory: () => void;
  onUnenroll: () => void;
}

const CustomerLoyaltyCard: React.FC<CustomerLoyaltyCardProps> = ({
  customer,
  nextTierInfo,
  onAdjustPoints,
  onViewHistory,
  onUnenroll
}) => {
  if (!customer.loyalty_enrolled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Loyalty</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <Award className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-2">Not Enrolled</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This customer is not enrolled in your loyalty program yet.
          </p>
          <Button className="w-full">Enroll Customer</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Loyalty</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            onClick={onAdjustPoints}
          >
            <CreditCard className="h-4 w-4" />
            Adjust Points
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center gap-2"
            onClick={onViewHistory}
          >
            <Clock className="h-4 w-4" />
            View Points History
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full"
            onClick={onUnenroll}
          >
            Remove from Loyalty Program
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerLoyaltyCard;
