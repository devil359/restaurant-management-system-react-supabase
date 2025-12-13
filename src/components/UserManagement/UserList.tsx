import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Shield, Lock } from "lucide-react";
import { EditUserDialog } from "./EditUserDialog";
import { PermissionManager } from "./PermissionManager";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  role: string;
  role_id?: string;
  role_name_text?: string;
  restaurant_id?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  email?: string;
  restaurants?: {
    name: string;
  };
}

interface UserListProps {
  onUserUpdated: () => void;
  restaurantFilter?: string;
}

export const UserList = ({ onUserUpdated, restaurantFilter }: UserListProps) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [permissionUser, setPermissionUser] = useState<User | null>(null);
  const { user: currentUser } = useAuth();

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["users", restaurantFilter, currentUser?.restaurant_id],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(`
          *,
          restaurants (
            name
          )
        `)
        .order("created_at", { ascending: false });

      // If restaurantFilter is provided (from admin), filter by that restaurant
      // Otherwise, filter by current user's restaurant (regular user management)
      if (restaurantFilter && restaurantFilter !== "all") {
        query = query.eq("restaurant_id", restaurantFilter);
      } else if (!restaurantFilter && currentUser?.restaurant_id) {
        query = query.eq("restaurant_id", currentUser.restaurant_id);
      }
      // If restaurantFilter is "all", don't add any filter (show all users)

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      // We cannot fetch emails client-side as it requires admin permissions provided only to service_role.
      // The profiles table should ideally have an email column synced via triggers if needed.
      // For now, we returns profiles without email or with a placeholder.
      return (profilesData || []).map(profile => ({
        ...profile,
        email: 'Email hidden (Admin only)'
      })) as User[];
    },
    enabled: !!(restaurantFilter || currentUser?.restaurant_id),
  });

  useEffect(() => {
    refetch();
  }, [restaurantFilter, refetch]);

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) throw authError;
      
      toast.success('User deleted successfully');
      refetch();
      onUserUpdated();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'manager':
        return 'outline';
      case 'chef':
        return 'destructive';
      case 'waiter':
        return 'secondary';
      case 'staff':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              {restaurantFilter === "all" && <TableHead>Restaurant</TableHead>}
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.first_name || user.last_name 
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : 'No name'}
                </TableCell>
                <TableCell>{user.email || 'No email'}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role_name_text || (user.role.charAt(0).toUpperCase() + user.role.slice(1))}
                  </Badge>
                </TableCell>
                {restaurantFilter === "all" && (
                  <TableCell>{user.restaurants?.name || 'No restaurant'}</TableCell>
                )}
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingUser(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPermissionUser(user)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Permissions
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the user account.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onUserUpdated={() => {
            refetch();
            onUserUpdated();
            setEditingUser(null);
          }}
        />
      )}

      {permissionUser && (
        <PermissionManager
          userId={permissionUser.id}
          userName={`${permissionUser.first_name || ''} ${permissionUser.last_name || ''}`.trim() || permissionUser.email || 'User'}
          open={!!permissionUser}
          onOpenChange={(open) => !open && setPermissionUser(null)}
          onSuccess={() => {
            refetch();
            onUserUpdated();
          }}
        />
      )}
    </div>
  );
};
