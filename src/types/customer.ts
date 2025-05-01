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
