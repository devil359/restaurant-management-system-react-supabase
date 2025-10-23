import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@/types/auth";

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

export const CreateUserDialog = ({ open, onOpenChange, onUserCreated }: CreateUserDialogProps) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    roleId: "staff",
    roleName: "staff",
  });
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [systemRoles] = useState<UserRole[]>(['staff', 'waiter', 'chef', 'manager', 'admin', 'owner']);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchRoles = async () => {
      if (!currentUser?.restaurant_id) return;
      
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('*')
          .eq('restaurant_id', currentUser.restaurant_id)
          .order('name');
        
        if (error) throw error;
        setRoles(data || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };

    fetchRoles();
  }, [currentUser?.restaurant_id, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.restaurant_id) {
      toast.error("No restaurant associated with your account");
      return;
    }

    setLoading(true);
    try {
      // Determine if it's a system role or custom role
      const isSystemRole = systemRoles.includes(formData.roleId as UserRole);
      const customRole = roles.find(r => r.id === formData.roleId);

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: isSystemRole ? formData.roleId : 'staff',
          role_id: isSystemRole ? null : formData.roleId,
          role_name_text: isSystemRole ? null : (customRole?.name || formData.roleName),
          restaurant_id: currentUser.restaurant_id,
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: isSystemRole ? (formData.roleId as UserRole) : 'staff',
            role_id: isSystemRole ? null : formData.roleId,
            role_name_text: isSystemRole ? null : (customRole?.name || formData.roleName),
            restaurant_id: currentUser.restaurant_id,
            is_active: true,
          });

        if (profileError) throw profileError;
      }

      toast.success("User created successfully");
      onUserCreated();
      onOpenChange(false);
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        roleId: "staff",
        roleName: "staff",
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to your organization with specific role and permissions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="col-span-3"
                required
                minLength={6}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                First Name
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => {
                  const customRole = roles.find(r => r.id === value);
                  setFormData({ 
                    ...formData, 
                    roleId: value,
                    roleName: customRole?.name || value
                  });
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="chef">Chef</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  {(currentUser?.role === 'owner' || currentUser?.role === 'admin' || 
                    currentUser?.role_name_text?.toLowerCase() === 'admin' ||
                    currentUser?.role_name_text?.toLowerCase() === 'owner') && (
                    <SelectItem value="admin">Admin</SelectItem>
                  )}
                  {(currentUser?.role === 'owner' || currentUser?.role_name_text?.toLowerCase() === 'owner') && (
                    <SelectItem value="owner">Owner</SelectItem>
                  )}
                  {roles.length > 0 && roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};