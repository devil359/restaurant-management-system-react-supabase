
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  reorder_level: number;
  unit: string;
  restaurant_id: string;
  notification_sent: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request to get restaurant_id (optional)
    let restaurantId: string | null = null;
    try {
      const body = await req.json();
      restaurantId = body.restaurant_id || null;
    } catch (e) {
      console.error('Error parsing request body:', e);
      // Continue execution even if body parsing fails
    }

    // Build query for low stock items
    let query = supabase
      .from('inventory_items')
      .select('id, name, quantity, reorder_level, unit, restaurant_id')
      .lt('quantity', supabase.raw('reorder_level'))
      .eq('notification_sent', false);
    
    // Add restaurant_id filter if provided
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    // Execute query
    const { data: lowStockItems, error } = await query;

    if (error) {
      console.error('Error checking low stock:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to check inventory' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Process low stock items
    const updatedItems = []
    const notifications = []

    for (const item of (lowStockItems || []) as InventoryItem[]) {
      try {
        // Mark notification as sent
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({ notification_sent: true })
          .eq('id', item.id)

        if (updateError) {
          console.error(`Error updating notification for item ${item.id}:`, updateError)
          continue
        }

        updatedItems.push(item.id)

        // Get notification preferences for the restaurant
        const { data: preferences, error: prefError } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('restaurant_id', item.restaurant_id)
          .single()

        if (prefError || !preferences || !preferences.notify_low_stock) {
          console.log(`Skipping notification for restaurant ${item.restaurant_id}`)
          continue
        }

        notifications.push({
          item: item.name,
          quantity: item.quantity,
          reorder_level: item.reorder_level,
          unit: item.unit,
          restaurant_id: item.restaurant_id,
          recipients: preferences.email_recipients || []
        })
      } catch (itemError) {
        console.error(`Error processing item ${item.id}:`, itemError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated_items: updatedItems,
        notifications: notifications
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
