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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader =
      req.headers.get('Authorization') ||
      req.headers.get('authorization') ||
      req.headers.get('X-Authorization') ||
      req.headers.get('x-authorization');

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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

    // Verify user is authenticated and has admin/owner role
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('restaurant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.restaurant_id) {
      return new Response(
        JSON.stringify({ error: 'No restaurant associated with user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Check if user has admin/owner role
    const { data: hasRole } = await supabaseClient.rpc('has_any_role', {
      _user_id: user.id,
      _roles: ['admin', 'owner'],
    });

    if (!hasRole) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { action, ...data } = await req.json();

    switch (action) {
      case 'create': {
        const validated = createRoleSchema.parse(data);

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
      }

      case 'update': {
        const validated = updateRoleSchema.parse(data);

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
      }

      case 'delete': {
        const validated = deleteRoleSchema.parse(data);

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
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Role management error:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: error.errors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});