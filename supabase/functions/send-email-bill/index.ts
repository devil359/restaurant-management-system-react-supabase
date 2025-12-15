import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  checkRateLimit, 
  createRateLimitResponse, 
  getRequestIdentifier 
} from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit config for email sending
const EMAIL_RATE_LIMIT = {
  maxRequests: 50,        // 50 emails
  windowMs: 60 * 60 * 1000, // per hour
  keyPrefix: 'email',
};

interface EmailBillRequest {
  orderId: string;
  email: string;
  customerName: string;
  restaurantName: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  tableNumber?: string;
  orderDate?: string;
  discount?: number;
  promotionName?: string;
}

async function sendEmailViaResend(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    console.error("Missing RESEND_API_KEY environment variable");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Restaurant Bill <onboarding@resend.dev>", // Free tier uses resend.dev domain
        to: [to],
        subject: subject,
        html: htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", result);
      return { success: false, error: result.message || "Failed to send email" };
    }

    console.log("Email sent successfully:", result);
    return { success: true, id: result.id };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: error.message };
  }
}

function generateBillHTML(data: EmailBillRequest): string {
  const {
    customerName,
    restaurantName,
    restaurantAddress,
    restaurantPhone,
    total,
    items,
    tableNumber,
    orderDate,
    discount,
    promotionName,
  } = data;

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const formattedDate = orderDate || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsHTML = items.map(item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Bill from ${restaurantName}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🍽️ ${restaurantName}</h1>
    ${restaurantAddress ? `<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">${restaurantAddress}</p>` : ''}
    ${restaurantPhone ? `<p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">📞 ${restaurantPhone}</p>` : ''}
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="border-bottom: 2px dashed #eee; padding-bottom: 20px; margin-bottom: 20px;">
      <h2 style="color: #333; margin: 0 0 10px 0;">Dear ${customerName},</h2>
      <p style="color: #666; margin: 0;">Thank you for dining with us! Here's your bill:</p>
    </div>
    
    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <table style="width: 100%; font-size: 14px; color: #666;">
        <tr>
          <td><strong>Date:</strong> ${formattedDate}</td>
          ${tableNumber ? `<td style="text-align: right;"><strong>Table:</strong> ${tableNumber}</td>` : ''}
        </tr>
      </table>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background: #f0f0f0;">
          <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #333;">Item</th>
          <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #333;">Qty</th>
          <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #333;">Rate</th>
          <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #333;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>
    
    <div style="border-top: 2px solid #eee; padding-top: 15px;">
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 5px 0; color: #666;">Subtotal</td>
          <td style="padding: 5px 0; text-align: right; color: #666;">₹${subtotal.toFixed(2)}</td>
        </tr>
        ${discount && discount > 0 ? `
        <tr>
          <td style="padding: 5px 0; color: #27ae60;">Discount ${promotionName ? `(${promotionName})` : ''}</td>
          <td style="padding: 5px 0; text-align: right; color: #27ae60;">-₹${discount.toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr style="font-size: 18px; font-weight: bold;">
          <td style="padding: 15px 0 5px 0; color: #333; border-top: 2px solid #333;">Total Amount</td>
          <td style="padding: 15px 0 5px 0; text-align: right; color: #667eea; border-top: 2px solid #333;">₹${total.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;">
      <p style="color: white; margin: 0; font-size: 18px;">🙏 Thank You!</p>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">We hope you enjoyed your meal. Please visit again!</p>
    </div>
  </div>
  
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
    This is an automated email from ${restaurantName}. Please do not reply.
  </p>
</body>
</html>
  `;
}

serve(async (req) => {
  console.log(`${req.method} request received at ${new Date().toISOString()}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  // Rate limiting check
  const authHeader = req.headers.get('authorization');
  const identifier = getRequestIdentifier(req, authHeader);
  const rateLimitResult = checkRateLimit(identifier, EMAIL_RATE_LIMIT);
  
  if (!rateLimitResult.allowed) {
    console.log(`Email rate limit exceeded for ${identifier}`);
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  try {
    const requestBody = await req.json() as EmailBillRequest;
    const { orderId, email, customerName, restaurantName, total, items } = requestBody;
    
    console.log("Processing email bill request:", {
      orderId,
      email: email ? `${email.substring(0, 3)}***` : 'Missing',
      customerName,
      restaurantName,
      itemCount: items?.length || 0,
      total
    });
    
    // Validate required fields
    if (!email || !items || items.length === 0) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required parameters: email and items are required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid email format' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    // Generate bill HTML
    const htmlContent = generateBillHTML(requestBody);
    const subject = `Your Bill from ${restaurantName || 'Restaurant'} - ₹${total.toFixed(2)}`;

    // Send email via Resend
    const emailResult = await sendEmailViaResend(email, subject, htmlContent);

    if (!emailResult.success) {
      console.error("Failed to send email:", emailResult.error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: emailResult.error || 'Failed to send email'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }

    // Update order record if orderId provided
    if (orderId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          // Try to update kitchen_orders
          const { error: updateError } = await supabase
            .from('kitchen_orders')
            .update({ 
              email_sent: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

          if (updateError) {
            console.warn("Could not update kitchen_orders:", updateError);
          } else {
            console.log("✅ Order record updated with email_sent flag");
          }
        }
      } catch (dbError) {
        console.error("Database update error:", dbError);
        // Don't fail the request if DB update fails
      }
    }

    console.log("✅ Email bill sent successfully!");

    return new Response(
      JSON.stringify({
        success: true,
        message: `Bill sent successfully to ${email}`,
        emailId: emailResult.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error("❌ Unexpected error in send-email-bill function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Internal server error",
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
