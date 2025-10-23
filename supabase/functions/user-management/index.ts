import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation schemas
const systemRoles = ['owner', 'admin', 'manager', 'chef', 'waiter', 'staff', 'viewer'] as const

const createUserSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password too long'),
  first_name: z.string().trim().min(1, 'First name required').max(100, 'First name too long'),
  last_name: z.string().trim().min(1, 'Last name required').max(100, 'Last name too long'),
  // Optional support for custom roles via role_id/role_name_text
  role: z.enum(systemRoles).optional().default('staff'),
  role_id: z.string().uuid('Invalid role id').optional(),
  role_name_text: z.string().trim().max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional()
})

const updateUserSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
  email: z.string().email('Invalid email format').max(255, 'Email too long').optional(),
  first_name: z.string().trim().min(1, 'First name required').max(100, 'First name too long').optional(),
  last_name: z.string().trim().min(1, 'Last name required').max(100, 'Last name too long').optional(),
  role: z.enum(systemRoles).optional(),
  role_id: z.string().uuid('Invalid role id').optional(),
  role_name_text: z.string().trim().max(100).optional(),
  new_password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password too long').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  is_active: z.boolean().optional()
})

const actionSchema = z.enum(['create_user', 'update_user', 'delete_user', 'reset_password'], {
  errorMap: () => ({ message: 'Invalid action' })
})

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user has admin permissions
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role, restaurant_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      throw new Error('Insufficient permissions')
    }

    const requestBody = await req.json()
    
    // Validate action
    const validationResult = actionSchema.safeParse(requestBody.action)
    if (!validationResult.success) {
      throw new Error(`Invalid action: ${validationResult.error.errors[0].message}`)
    }
    
    const action = validationResult.data
    const userData = requestBody.userData

    console.log('User management action:', action, 'by user:', user.id)

    switch (action) {
      case 'create_user': {
        // Validate input
        const validated = createUserSchema.parse(userData)

        // Create new user account
        const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
          email: validated.email,
          password: validated.password,
          email_confirm: true,
          user_metadata: {
            first_name: validated.first_name,
            last_name: validated.last_name
          }
        })

        if (createError) throw createError

        const isSystemRole = !validated.role_id

        // Create profile for the new user (supports custom roles)
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .insert({
            id: newUser.user.id,
            first_name: validated.first_name,
            last_name: validated.last_name,
            role: isSystemRole ? (validated.role ?? 'staff') : 'staff',
            role_id: isSystemRole ? null : validated.role_id,
            role_name_text: isSystemRole ? null : (validated.role_name_text ?? null),
            restaurant_id: profile.restaurant_id,
            phone: validated.phone || null,
            is_active: true
          })

        if (profileError) throw profileError

        return new Response(
          JSON.stringify({ success: true, user: newUser.user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_user': {
        // Validate input
        const validated = updateUserSchema.parse(userData)

        // Build admin update payload conditionally
        const adminUpdate: any = {}
        if (validated.email) adminUpdate.email = validated.email
        if (validated.new_password) adminUpdate.password = validated.new_password
        if (validated.first_name || validated.last_name) {
          adminUpdate.user_metadata = {
            ...(validated.first_name ? { first_name: validated.first_name } : {}),
            ...(validated.last_name ? { last_name: validated.last_name } : {}),
          }
        }

        if (Object.keys(adminUpdate).length > 0) {
          const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
            validated.id,
            adminUpdate
          )
          if (updateError) throw updateError
        }

        // Prepare profile update
        const profileUpdate: Record<string, any> = {}
        if (validated.first_name) profileUpdate.first_name = validated.first_name
        if (validated.last_name) profileUpdate.last_name = validated.last_name

        const isSystemRole = !validated.role_id
        if (validated.role || validated.role_id || validated.role_name_text) {
          profileUpdate.role = isSystemRole ? (validated.role ?? 'staff') : 'staff'
          profileUpdate.role_id = isSystemRole ? null : (validated.role_id ?? null)
          profileUpdate.role_name_text = isSystemRole ? null : (validated.role_name_text ?? null)
        }
        if (validated.phone !== undefined) profileUpdate.phone = validated.phone
        if (validated.is_active !== undefined) profileUpdate.is_active = validated.is_active

        if (Object.keys(profileUpdate).length > 0) {
          const { error: profileError } = await supabaseClient
            .from('profiles')
            .update(profileUpdate)
            .eq('id', validated.id)
          if (profileError) throw profileError
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete_user': {
        // Validate user ID
        const userIdSchema = z.object({ id: z.string().uuid('Invalid user ID') })
        const { id: validatedId } = userIdSchema.parse(userData)
        
        // Deactivate user instead of deleting
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .update({ is_active: false })
          .eq('id', validatedId)

        if (profileError) throw profileError

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'reset_password': {
        // Validate email
        const emailSchema = z.object({ email: z.string().email('Invalid email format').max(255) })
        const { email: validatedEmail } = emailSchema.parse(userData)
        
        // Send password reset email
        const { error: resetError } = await supabaseClient.auth.admin.generateLink({
          type: 'recovery',
          email: validatedEmail
        })

        if (resetError) throw resetError

        return new Response(
          JSON.stringify({ success: true, message: 'Password reset email sent' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('User management error:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: error.errors.map(e => e.message).join(', ')
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})