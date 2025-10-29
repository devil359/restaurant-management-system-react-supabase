import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { mobileNumber } = await req.json();

    if (!mobileNumber) {
      console.log('❌ No mobile number provided');
      return new Response(
        JSON.stringify({ error: 'Mobile number is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('🔍 Searching for active reservation with phone:', mobileNumber);

    // Query the reservations table for an active reservation with this phone number
    // Status 'occupied' means the guest is currently checked in
    const { data: reservation, error } = await supabaseClient
      .from('reservations')
      .select(`
        id,
        room_id,
        customer_name,
        customer_phone,
        status,
        rooms:room_id (
          id,
          name
        )
      `)
      .eq('customer_phone', mobileNumber)
      .eq('status', 'occupied')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ Error querying reservations:', error);
      return new Response(
        JSON.stringify({ error: 'Database query failed', details: error }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    if (!reservation) {
      console.log('ℹ️ No active reservation found for this mobile number');
      return new Response(
        JSON.stringify({ found: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Found active reservation:', reservation.id);

    // Extract room information
    const room = Array.isArray(reservation.rooms) ? reservation.rooms[0] : reservation.rooms;
    const roomName = room?.name || `Room ${room?.id?.slice(0, 8)}`;

    return new Response(
      JSON.stringify({
        found: true,
        reservation_id: reservation.id,
        room_id: reservation.room_id,
        roomName: roomName,
        customerName: reservation.customer_name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
