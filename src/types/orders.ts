export interface Order {
  id: string;
  customer_name: string;
  items: string[];
  total: number;
  status: string;
  created_at: string;
  restaurant_id: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  menuItemId?: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: string[];
}

export interface TableData {
  id: string;
  name: string;
  capacity: number;
  restaurant_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ActiveOrder {
  id: string;
  source: string;
  status: "new" | "preparing" | "ready" | "completed";
  items: OrderItem[];
  created_at: string;
}
