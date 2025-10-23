import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  componentIds: z.array(z.string().uuid()),
});

const updateRoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional().nullable(),
  componentIds: z.array(z.string().uuid()).optional(),
});

const deleteRoleSchema = z.object({
  id: z.string().uuid(),
});

const logError = (context: string, error: any, details?: any) => {
  console.error(`[${new Date().toISOString()}] Error in ${context}:`, {
    error: error.message || error,
    details,
    stack: error.stack
  });
};

const logInfo = (context: string, message: string, data?: any) => {
  console.log(`[${new Date().toISOString()}] ${context}:`, message, data || '');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logInfo('Request', 'Starting request processing', {
      method: req.method,
      url: req.url
    });

    // Validate content type and request body
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }

    let payload;
    try {
      const text = await req.text();
      logInfo('Request Body', 'Raw request body received', { text });
      
      if (!text) {
        throw new Error('Empty request body');
      }
      
      payload = JSON.parse(text);
      logInfo('Request Body', 'Parsed JSON payload', { payload });
    } catch (e) {
      logError('JSON Parsing', e, { contentType });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON body', 
          details: e.message,
          received: e.details || 'Could not read body'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    const { action, ...data } = payload;
    logInfo('Action', `Processing action: ${action}`, { data });

    // Auth validation
    try {
      const authHeader =
        req.headers.get('Authorization') ||
        req.headers.get('authorization') ||
        req.headers.get('X-Authorization') ||
        req.headers.get('x-authorization');

      console.log('Auth header received:', authHeader ? 'Yes' : 'No');

      if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
        console.error('Missing or invalid auth header');
        return new Response(
          JSON.stringify({ error: 'Missing or invalid authorization header' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      // Verify user is authenticated and has admin/owner role using the Bearer token explicitly
      const token = (authHeader || '').replace(/bearer\s+/i, '').trim();
      console.log('Token extracted:', { 
        hasToken: !!token, 
        tokenLength: token?.length,
        tokenStart: token?.substring(0, 20) + '...'
      });
      
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
      console.log('User fetch result:', { 
        userId: user?.id, 
        hasError: !!userError,
        errorDetails: userError 
      });
      
      if (userError) {
        console.error('User authentication error:', userError);
        return new Response(
          JSON.stringify({ error: 'Authentication failed', details: userError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      if (!user) {
        console.error('No user found in token');
        return new Response(
          JSON.stringify({ error: 'No user found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      // Profile validation
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('restaurant_id, role, role_id')
        .eq('id', user.id)
        .single();

      logInfo('Profile', 'Profile fetch result', {
        hasProfile: !!profile,
        restaurantId: profile?.restaurant_id,
        roleInfo: { role: profile?.role, roleId: profile?.role_id }
      });

      if (profileError) {
        logError('Profile', profileError);
        throw new Error('Failed to fetch user profile');
      }

      // Role validation with fallback
      let roleName = null;
      try {
        if (profile?.role_id) {
          const { data: roleData } = await supabaseClient
            .from('roles')
            .select('name')
            .eq('id', profile.role_id)
            .single();
          roleName = roleData?.name;
        }
        roleName = roleName || profile?.role;

        logInfo('Role', 'Role validation result', { 
          roleName,
          fromRoleId: !!profile?.role_id,
          fromLegacyRole: !!profile?.role 
        });
      } catch (roleError) {
        logError('Role Lookup', roleError);
        throw new Error('Failed to validate user role');
      }

      // Process action with proper error handling
      switch (action) {
        case 'create': {
          try {
            const validated = createRoleSchema.parse(data);
            logInfo('Create Role', 'Validation passed', validated);

            // Create role
            const { data: newRole, error: roleError } = await supabaseClient
              .from('roles')
              .insert({
                name: validated.name,
                description: validated.description,
                restaurant_id: profile.restaurant_id,
                is_deletable: true,
              })
              .select()
              .single();

            if (roleError) throw roleError;

            // Add component permissions
            if (validated.componentIds.length > 0) {
              const roleComponents = validated.componentIds.map(componentId => ({
                role_id: newRole.id,
                component_id: componentId,
              }));

              const { error: compError } = await supabaseClient
                .from('role_components')
                .insert(roleComponents);

              if (compError) throw compError;
            }

            return new Response(
              JSON.stringify({ success: true, role: newRole }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          } catch (e) {
            logError('Create Role', e);
            throw e;
          }
        }

        case 'update': {
          try {
            const validated = updateRoleSchema.parse(data);
            logInfo('Update Role', 'Validation passed', validated);

            // Check if role is deletable (can't modify owner/admin roles)
            const { data: existingRole } = await supabaseClient
              .from('roles')
              .select('is_deletable')
              .eq('id', validated.id)
              .eq('restaurant_id', profile.restaurant_id)
              .single();

            if (!existingRole || !existingRole.is_deletable) {
              return new Response(
                JSON.stringify({ error: 'Cannot modify this role' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
              );
            }

            // Update role details
            const updateData: any = {};
            if (validated.name) updateData.name = validated.name;
            if (validated.description !== undefined) updateData.description = validated.description;

            if (Object.keys(updateData).length > 0) {
              const { error: updateError } = await supabaseClient
                .from('roles')
                .update(updateData)
                .eq('id', validated.id)
                .eq('restaurant_id', profile.restaurant_id);

              if (updateError) throw updateError;
            }

            // Update component permissions
            if (validated.componentIds) {
              // Delete existing permissions
              await supabaseClient
                .from('role_components')
                .delete()
                .eq('role_id', validated.id);

              // Add new permissions
              if (validated.componentIds.length > 0) {
                const roleComponents = validated.componentIds.map(componentId => ({
                  role_id: validated.id,
                  component_id: componentId,
                }));

                const { error: compError } = await supabaseClient
                  .from('role_components')
                  .insert(roleComponents);

                if (compError) throw compError;
              }
            }

            return new Response(
              JSON.stringify({ success: true }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          } catch (e) {
            logError('Update Role', e);
            throw e;
          }
        }

        case 'delete': {
          try {
            const validated = deleteRoleSchema.parse(data);
            logInfo('Delete Role', 'Validation passed', validated);

            // Check if role is deletable
            const { data: existingRole } = await supabaseClient
              .from('roles')
              .select('is_deletable, name')
              .eq('id', validated.id)
              .eq('restaurant_id', profile.restaurant_id)
              .single();

            if (!existingRole) {
              return new Response(
                JSON.stringify({ error: 'Role not found' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
              );
            }

            if (!existingRole.is_deletable) {
              return new Response(
                JSON.stringify({ error: 'Cannot delete this role' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
              );
            }

            // Check if any users have this role
            const { data: usersWithRole, error: usersError } = await supabaseClient
              .from('profiles')
              .select('id')
              .eq('role_id', validated.id)
              .limit(1);

            if (usersError) throw usersError;

            if (usersWithRole && usersWithRole.length > 0) {
              return new Response(
                JSON.stringify({ error: 'Cannot delete role that is assigned to users' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
              );
            }

            // Delete role (cascade will delete role_components)
            const { error: deleteError } = await supabaseClient
              .from('roles')
              .delete()
              .eq('id', validated.id)
              .eq('restaurant_id', profile.restaurant_id);

            if (deleteError) throw deleteError;

            return new Response(
              JSON.stringify({ success: true }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          } catch (e) {
            logError('Delete Role', e);
            throw e;
          }
        }

        default: {
          logError('Action Validation', `Invalid action: ${action}`);
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
      }

    } catch (authError) {
      logError('Auth Flow', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Authentication error',
          message: authError.message,
          details: process.env.NODE_ENV === 'development' ? authError.stack : undefined
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

  } catch (error) {
    logError('Global', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation error', 
          details: error.errors,
          received: error.received
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        type: error.constructor.name,
        details: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          cause: error.cause
        } : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});