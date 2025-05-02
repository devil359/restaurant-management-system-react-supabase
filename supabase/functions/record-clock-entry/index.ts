
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    // Get request body
    const { staff_id, restaurant_id, action, notes } = await req.json();
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (action === "in") {
      // Check if there's already an active session
      const { data: activeSessions, error: checkError } = await supabaseClient
        .from("staff_time_clock")
        .select("*")
        .eq("staff_id", staff_id)
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1);

      if (checkError) {
        throw new Error(`Error checking active sessions: ${checkError.message}`);
      }

      if (activeSessions && activeSessions.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: "Active session exists", 
            message: "You already have an active clock-in session" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Create clock-in record
      const { data, error } = await supabaseClient
        .from("staff_time_clock")
        .insert([{
          staff_id,
          restaurant_id,
          clock_in: new Date().toISOString(),
          notes
        }])
        .select();

      if (error) {
        throw new Error(`Error clocking in: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, data, action: "in" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } else if (action === "out") {
      // Find the active session to clock out
      const { data: activeSessions, error: findError } = await supabaseClient
        .from("staff_time_clock")
        .select("*")
        .eq("staff_id", staff_id)
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1);

      if (findError) {
        throw new Error(`Error finding active session: ${findError.message}`);
      }

      if (!activeSessions || activeSessions.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: "No active session", 
            message: "No active clock-in session found to clock out from" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const activeSession = activeSessions[0];
      
      // Update the session with clock-out time
      const { data, error } = await supabaseClient
        .from("staff_time_clock")
        .update({
          clock_out: new Date().toISOString(),
          notes: notes ? `${activeSession.notes || ''} ${notes}`.trim() : activeSession.notes
        })
        .eq("id", activeSession.id)
        .select();

      if (error) {
        throw new Error(`Error clocking out: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, data, action: "out" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action", message: "Action must be 'in' or 'out'" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
