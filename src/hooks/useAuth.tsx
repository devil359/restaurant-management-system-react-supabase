
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Permission, UserProfile, UserRole, rolePermissions, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only synchronous state updates here
        setLoading(false);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchUserProfile(session.user.id, session.user.email);
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string, email?: string) => {
    try {
      // Fetch user profile with role information and custom role details
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          *,
          roles:role_id (
            id,
            name,
            description
          )
        `)
        .eq('id', userId)
        .single();

      if (profile) {
        // Prioritize role_name_text, then custom role from roles table, then fallback to enum
        const userRole = profile.role_name_text || 
                        (profile.roles?.name) || 
                        profile.role;

        setUser({
          id: profile.id,
          email: email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: userRole as UserRole,
          role_id: profile.role_id,
          role_name_text: profile.role_name_text,
          restaurant_id: profile.restaurant_id,
          avatar_url: profile.avatar_url,
          phone: profile.phone,
          is_active: profile.is_active ?? true,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        });
      } else {
        // Create default profile if doesn't exist
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            role: 'staff',
            is_active: true
          })
          .select()
          .single();

        if (newProfile) {
          setUser({
            id: newProfile.id,
            email: email,
            role: 'staff',
            is_active: true,
            created_at: newProfile.created_at,
            updated_at: newProfile.updated_at
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    
    // For custom roles, check if role exists in rolePermissions map
    // Custom roles use the role_name_text, system roles use the enum
    const roleKey = (user.role_name_text?.toLowerCase() || user.role?.toLowerCase()) as UserRole;
    const userPermissions = rolePermissions[roleKey] || [];
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.some(permission => hasPermission(permission));
  };

  const isRole = (role: UserRole | string): boolean => {
    // Check both role_name_text and the role enum
    const currentRole = user?.role_name_text || user?.role;
    return currentRole?.toLowerCase() === role.toLowerCase();
  };

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    hasPermission,
    hasAnyPermission,
    isRole,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
