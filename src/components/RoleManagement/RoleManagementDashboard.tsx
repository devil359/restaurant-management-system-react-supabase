import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateRoleDialog } from './CreateRoleDialog';
import { EditRoleDialog } from './EditRoleDialog';
import { DeleteRoleDialog } from './DeleteRoleDialog';
import { useToast } from '@/hooks/use-toast';

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_deletable: boolean;
  created_at: string;
}

export const RoleManagementDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  // Fetch roles for the restaurant
  const { data: roles, isLoading, refetch } = useQuery({
    queryKey: ['roles', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];

      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('restaurant_id', user.restaurant_id)
        .order('name');

      if (error) throw error;
      return data as Role[];
    },
    enabled: !!user?.restaurant_id,
  });

  const handleRoleCreated = () => {
    refetch();
    toast({
      title: 'Role Created',
      description: 'The role has been created successfully.',
    });
  };

  const handleRoleUpdated = () => {
    refetch();
    setEditingRole(null);
    toast({
      title: 'Role Updated',
      description: 'The role has been updated successfully.',
    });
  };

  const handleRoleDeleted = () => {
    refetch();
    setDeletingRole(null);
    toast({
      title: 'Role Deleted',
      description: 'The role has been deleted successfully.',
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Role Management</h2>
          <p className="text-muted-foreground mt-2">
            Create and manage custom roles with specific component access
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles?.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {role.name}
                    {!role.is_deletable && (
                      <Badge variant="secondary" className="text-xs">
                        System
                      </Badge>
                    )}
                  </CardTitle>
                  {role.description && (
                    <CardDescription>{role.description}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRole(role)}
                  className="flex-1"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingRole(role)}
                  disabled={!role.is_deletable}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateRoleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleRoleCreated}
      />

      {editingRole && (
        <EditRoleDialog
          role={editingRole}
          open={!!editingRole}
          onOpenChange={(open) => !open && setEditingRole(null)}
          onSuccess={handleRoleUpdated}
        />
      )}

      {deletingRole && (
        <DeleteRoleDialog
          role={deletingRole}
          open={!!deletingRole}
          onOpenChange={(open) => !open && setDeletingRole(null)}
          onSuccess={handleRoleDeleted}
        />
      )}
    </div>
  );
};