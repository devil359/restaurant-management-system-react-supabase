-- Add table_number and customer_name columns to kitchen_orders table
ALTER TABLE kitchen_orders 
ADD COLUMN IF NOT EXISTS table_number text,
ADD COLUMN IF NOT EXISTS customer_name text;