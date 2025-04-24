
export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  birthday?: string | null;
  created_at: string;
  restaurant_id: string;
  loyalty_points: number;
  loyalty_tier: LoyaltyTierType;
  tags: string[];
  preferences?: string | null;
  last_visit_date?: string | null;
  total_spent: number;
  visit_count: number;
  average_order_value: number;
}

export type LoyaltyTierType = 'None' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface CustomerOrder {
  id: string;
  date: string;
  amount: number;
  order_id: string;
  status: string;
  items: string[];
}

export interface CustomerNote {
  id: string;
  customer_id: string;
  content: string;
  created_at: string;
  created_by: string;
}

export interface CustomerActivity {
  id: string;
  customer_id: string;
  activity_type: 'note_added' | 'email_sent' | 'order_placed' | 'tag_added' | 'tag_removed' | 'promotion_sent';
  description: string;
  created_at: string;
}

// Loyalty program types
export interface LoyaltyProgram {
  id: string;
  restaurant_id: string;
  is_enabled: boolean;
  points_per_amount: number;
  amount_per_point: number;
  points_expiry_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTier {
  id: string;
  restaurant_id: string;
  name: string;
  points_required: number;
  benefits: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyReward {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  points_required: number;
  reward_type: 'discount_amount' | 'discount_percentage' | 'free_item';
  reward_value: number;
  tier_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  customer_id: string;
  restaurant_id: string;
  transaction_type: 'earn' | 'redeem' | 'adjust' | 'expire';
  points: number;
  source: 'order' | 'manual' | 'system';
  source_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface LoyaltyRedemption {
  id: string;
  customer_id: string;
  restaurant_id: string;
  reward_id: string;
  order_id: string;
  points_used: number;
  discount_applied: number;
  created_at: string;
}
