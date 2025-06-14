import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Permission, UserProfile, UserRole, rolePermissions } from "@/types/auth";
import type { Session } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  isRole: (role: UserRole) => boolean;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionState, setSessionState] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSessionState(currentSession);
        if (currentSession?.user) {
          // Fetch user profile with role information
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              email: currentSession.user.email,
              first_name: profile.first_name,
              last_name: profile.last_name,
              role: profile.role as UserRole,
              restaurant_id: profile.restaurant_id,
              avatar_url: profile.avatar_url,
              phone: profile.phone,
              is_active: profile.is_active ?? true,
              created_at: profile.created_at,
              updated_at: profile.updated_at
            });
          } else {
            // Create default profile if doesn't exist
            const { data: newProfileData, error: newProfileError } = await supabase
              .from('profiles')
              .insert({
                id: currentSession.user.id,
                email: currentSession.user.email,
                role: 'staff',
                is_active: true
              })
              .select()
              .single();

            if (newProfileError) {
              console.error("Error creating profile:", newProfileError);
              setUser(null);
            } else if (newProfileData) {
              setUser({
                id: newProfileData.id,
                email: currentSession.user.email,
                role: newProfileData.role as UserRole,
                restaurant_id: newProfileData.restaurant_id,
                first_name: newProfileData.first_name,
                last_name: newProfileData.last_name,
                avatar_url: newProfileData.avatar_url,
                phone: newProfileData.phone,
                is_active: newProfileData.is_active ?? true,
                created_at: newProfileData.created_at,
                updated_at: newProfileData.updated_at
              });
            }
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSessionState(initialSession);
      if (!initialSession) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.some(permission => hasPermission(permission));
  };

  const isRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setSessionState(null);
  };

  const value: AuthContextType = {
    user,
    session: sessionState,
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
