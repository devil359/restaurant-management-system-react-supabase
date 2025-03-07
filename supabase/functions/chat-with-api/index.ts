
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const requestData = await req.json();
    const { messages, restaurantId } = requestData;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get API key and base URL from environment variables
    const apiKey = Deno.env.get('API_KEY');
    const baseUrl = Deno.env.get('BASE_URL') || 'https://api.sree.shop/v1';
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!apiKey) {
      console.error("API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ error: 'API key is not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    let restaurantData = null;
    
    // Create Supabase client with service role key if restaurant data access is needed
    if (restaurantId && supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        console.log(`Fetching data for restaurant ID: ${restaurantId}`);
        
        // Fetch restaurant data for context
        const [
          { data: revenueStats },
          { data: customerInsights },
          { data: recentOrders },
          { data: menuItems },
          { data: inventoryItems }
        ] = await Promise.all([
          supabase.from("daily_revenue_stats").select("*")
            .eq("restaurant_id", restaurantId)
            .order("date", { ascending: false })
            .limit(30),
          supabase.from("customer_insights").select("*")
            .eq("restaurant_id", restaurantId)
            .order("total_spent", { ascending: false })
            .limit(50),
          supabase.from("orders").select("*")
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase.from("menu_items").select("*")
            .eq("restaurant_id", restaurantId),
          supabase.from("inventory_items").select("*")
            .eq("restaurant_id", restaurantId)
        ]);
        
        restaurantData = {
          revenueStats: revenueStats || [],
          customerInsights: customerInsights || [],
          recentOrders: recentOrders || [],
          menuItems: menuItems || [],
          inventoryItems: inventoryItems || [],
        };
        
        console.log(`Successfully fetched restaurant data. Found ${revenueStats?.length || 0} revenue records, ${recentOrders?.length || 0} orders`);
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
      }
    }

    // Check if any message contains a file URL
    const hasFileForAnalysis = messages.some(msg => 
      typeof msg.content === 'string' && 
      (msg.content.includes('.xlsx') || 
       msg.content.includes('.csv') || 
       msg.content.includes('.pdf') || 
       msg.content.includes('image'))
    );

    let systemPrompt = "You are a restaurant assistant bot. You help answer questions about restaurant operations, menu items, and general restaurant management advice.";
    
    if (restaurantData) {
      systemPrompt += " You have access to the restaurant's data and can provide specific insights based on their sales, orders, customers, menu, and inventory information.";
      
      // Add a summary of available data
      systemPrompt += `\n\nAvailable data summary:
- Revenue Stats: ${restaurantData.revenueStats.length} records
- Customer Insights: ${restaurantData.customerInsights.length} records 
- Recent Orders: ${restaurantData.recentOrders.length} records
- Menu Items: ${restaurantData.menuItems.length} items
- Inventory Items: ${restaurantData.inventoryItems.length} items`;
    }
    
    if (hasFileForAnalysis) {
      systemPrompt += " When provided with data files like images, CSV, Excel, or PDF files, analyze them and provide insights and recommendations for the restaurant owner. For Excel/CSV files, assume they contain restaurant data like sales, inventory, or customer information and provide relevant analysis.";
    }

    // Create the payload for the API request
    const payload = {
      model: "gpt-4o", // Explicitly set to gpt-4o
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        ...messages
      ]
    };

    // Add context data if available
    if (restaurantData) {
      // Add a hidden context message with the restaurant data
      payload.messages.splice(1, 0, {
        role: "system",
        content: `Here is the restaurant data to inform your answers:
        
REVENUE STATS (last 30 days):
${JSON.stringify(restaurantData.revenueStats, null, 2)}

RECENT ORDERS (last 50):
${JSON.stringify(restaurantData.recentOrders, null, 2)}

CUSTOMER INSIGHTS (top 50 by spending):
${JSON.stringify(restaurantData.customerInsights, null, 2)}

MENU ITEMS:
${JSON.stringify(restaurantData.menuItems, null, 2)}

INVENTORY ITEMS:
${JSON.stringify(restaurantData.inventoryItems, null, 2)}

Use this data to provide specific, data-driven answers to the user's questions about their restaurant business. Refer to specific metrics when relevant.`
      });
    }

    console.log("Sending API request with payload:", JSON.stringify(payload));

    // Make the API request to your custom server
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: Status ${response.status}`, errorText);
      throw new Error(`API returned error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Received successful API response');

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chat function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during chat request',
        details: error.stack,
        choices: [
          {
            message: {
              role: "assistant",
              content: "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists."
            }
          }
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
