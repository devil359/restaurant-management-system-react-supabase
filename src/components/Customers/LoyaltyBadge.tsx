
import React from "react";
import { Badge } from "@/components/ui/badge";
import { LoyaltyTierType } from "@/types/customer";
import { Award } from "lucide-react";

interface LoyaltyBadgeProps {
  tier: LoyaltyTierType;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const LoyaltyBadge = ({ tier, showIcon = true, size = 'md' }: LoyaltyBadgeProps) => {
  // Define styling based on loyalty tier
  const getTierStyles = () => {
    switch (tier) {
      case 'Bronze':
        return {
          backgroundColor: 'bg-amber-100',
          textColor: 'text-amber-800',
          borderColor: 'border-amber-200'
        };
      case 'Silver':
        return {
          backgroundColor: 'bg-slate-100',
          textColor: 'text-slate-800',
          borderColor: 'border-slate-200'
        };
      case 'Gold':
        return {
          backgroundColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'Platinum':
        return {
          backgroundColor: 'bg-cyan-100', 
          textColor: 'text-cyan-800',
          borderColor: 'border-cyan-200'
        };
      case 'Diamond':
        return {
          backgroundColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-200'
        };
      case 'None':
      default:
        return {
          backgroundColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };
  
  // Skip rendering for 'None' tier
  if (tier === 'None') {
    return null;
  }

  const styles = getTierStyles();
  
  return (
    <Badge 
      variant="outline" 
      className={`
        flex items-center gap-1
        ${styles.backgroundColor} 
        ${styles.textColor} 
        ${styles.borderColor}
        ${size === 'sm' ? 'text-xs py-0 px-1.5' : 'px-2 py-0.5'}
      `}
    >
      {showIcon && <Award className={size === 'sm' ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} />}
      {tier}
    </Badge>
  );
};

export default LoyaltyBadge;
