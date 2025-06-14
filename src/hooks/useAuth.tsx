
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Permission, UserProfile, UserRole, rolePermissions } from "@/types/auth";
import type { Session, User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    console.log("AuthProvider: Setting up authentication");
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`AuthProvider: Auth event: ${event}`, currentSession ? 'with session' : 'no session');
        
        setSessionState(currentSession);
        
        if (currentSession?.user) {
          try {
            // Fetch user profile
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();

            if (error && error.code === 'PGRST116') {
              // Profile doesn't exist, create one
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: currentSession.user.id,
                  role: 'staff',
                  first_name: currentSession.user.email?.split('@')[0] || 'User'
                })
                .select()
                .single();

              if (createError) {
                console.error('Failed to create profile:', createError);
                setUser(null);
              } else {
                setUser({
                  id: newProfile.id,
                  email: currentSession.user.email,
                  role: newProfile.role as UserRole,
                  restaurant_id: newProfile.restaurant_id,
                  first_name: newProfile.first_name,
                  last_name: newProfile.last_name,
                  avatar_url: newProfile.avatar_url,
                  phone: newProfile.phone,
                  is_active: newProfile.is_active ?? true,
                  created_at: newProfile.created_at,
                  updated_at: newProfile.updated_at
                });
              }
            } else if (profile) {
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
              setUser(null);
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthProvider: Initial session check:', session ? 'found' : 'none');
      if (!session) {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

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
    console.log("AuthProvider: Signing out");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        });
      } else {
        setUser(null);
        setSessionState(null);
        toast({
          title: "Signed out",
          description: "You have been successfully signed out.",
        });
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      toast({
        title: "Error", 
        description: "An unexpected error occurred during sign out.",
        variant: "destructive",
      });
    }
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
