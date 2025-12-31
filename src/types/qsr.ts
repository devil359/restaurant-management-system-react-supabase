export interface QSROrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  modifiers?: string[];
}

export interface QSROrder {
  id?: string;
  items: QSROrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'paid' | 'pending_kot' | 'cancelled';
  created_at?: string;
  restaurant_id?: string;
  customer_name?: string;
}

export type ViewMode = 'order' | 'history';
export type OrderMode = 'dine_in' | 'takeaway' | 'delivery' | 'non_chargeable';
