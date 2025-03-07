
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { messages } = requestData;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get API key and base URL from environment variables
    const apiKey = Deno.env.get('API_KEY');
    const baseUrl = Deno.env.get('BASE_URL') || 'https://api.sree.shop/v1';

    if (!apiKey) {
      console.error("API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ error: 'API key is not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Using base URL: ${baseUrl}`);
    console.log(`Making request with ${messages.length} messages`);

    // Check if any message contains a file URL
    const hasFileForAnalysis = messages.some(msg => 
      typeof msg.content === 'string' && 
      (msg.content.includes('.xlsx') || 
       msg.content.includes('.csv') || 
       msg.content.includes('.pdf') || 
       msg.content.includes('image'))
    );

    let systemPrompt = "You are a restaurant assistant bot. You help answer questions about restaurant operations, menu items, and general restaurant management advice.";
    
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
              content: "I'm sorry, I encountered an error processing your file. Please try uploading a different file format or contact support if the issue persists."
            }
          }
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
