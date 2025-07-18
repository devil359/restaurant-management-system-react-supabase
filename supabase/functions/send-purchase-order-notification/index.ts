import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      supplierEmail, 
      supplierName, 
      orderNumber, 
      items, 
      totalAmount, 
      restaurantName 
    } = await req.json()

    // For now, we'll just log the notification
    // In a real implementation, you would send email via a service like SendGrid, Resend, etc.
    console.log('Purchase Order Notification:', {
      supplierEmail,
      supplierName,
      orderNumber,
      items,
      totalAmount,
      restaurantName
    })

    // Simulate email sending
    const emailContent = `
      Dear ${supplierName},

      You have received a new purchase order from ${restaurantName}.

      Order Number: ${orderNumber}
      Total Amount: ₹${totalAmount}

      Items:
      ${items.map((item: any) => `- ${item.itemName} (${item.quantity} ${item.unit}) - ₹${item.totalPrice}`).join('\n')}

      Please confirm receipt and expected delivery date.

      Best regards,
      ${restaurantName}
    `

    // In a real implementation, you would use an email service here
    // Example with Resend:
    // const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    // await resend.emails.send({
    //   from: 'orders@yourrestaurant.com',
    //   to: supplierEmail,
    //   subject: `New Purchase Order - ${orderNumber}`,
    //   text: emailContent
    // })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Purchase order notification sent successfully',
        emailContent // For demo purposes
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending purchase order notification:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})