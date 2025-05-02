
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClockRequest {
  staff_id: string
  restaurant_id: string
  action: 'in' | 'out'
  notes?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Parse the request body
    const { staff_id, restaurant_id, action, notes } = await req.json() as ClockRequest

    // Validate required fields
    if (!staff_id || !restaurant_id || !action) {
      throw new Error('Missing required fields')
    }

    const now = new Date().toISOString()

    // Handle clock in
    if (action === 'in') {
      // Check if there's already an active session
      const { data: activeSessions } = await supabaseClient
        .from('staff_time_clock')
        .select('*')
        .eq('staff_id', staff_id)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })

      if (activeSessions && activeSessions.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Active session exists',
            message: 'You already have an active clock-in session'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      // Create new clock in record
      const { data, error } = await supabaseClient
        .from('staff_time_clock')
        .insert({
          staff_id,
          restaurant_id,
          clock_in: now,
          notes,
        })
        .select()

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Clock in successful',
          data 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } 
    // Handle clock out
    else if (action === 'out') {
      // Find the active session
      const { data: activeSessions, error: findError } = await supabaseClient
        .from('staff_time_clock')
        .select('*')
        .eq('staff_id', staff_id)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1)

      if (findError) throw findError

      if (!activeSessions || activeSessions.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: 'No active session',
            message: 'No active clock-in session found'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      // Update the session with clock out time
      const { data, error } = await supabaseClient
        .from('staff_time_clock')
        .update({ 
          clock_out: now,
          notes: notes || activeSessions[0].notes
        })
        .eq('id', activeSessions[0].id)
        .select()

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Clock out successful',
          data 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    throw new Error('Invalid action')
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
