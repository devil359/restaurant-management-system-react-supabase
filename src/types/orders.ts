
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: string[];
}

export interface Order {
  id: string;
  restaurant_id: string;
  customer_name: string;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  items: string[];
}
