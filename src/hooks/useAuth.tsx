
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
    setLoading(true);
    console.log("AuthProvider: Effect triggered. Initial loading state forced to true.");

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`AuthProvider: onAuthStateChange event: ${event}, session present: ${!!currentSession}`);
        setSessionState(currentSession);
        
        try {
          if (currentSession?.user && currentSession.user.id) {
            const userId = currentSession.user.id;
            const userEmail = currentSession.user.email;

            console.log(`AuthProvider: User session active. User ID: ${userId}`);

            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();

            if (profileError) {
              console.error(`AuthProvider: Error fetching profile for user ${userId}:`, profileError.message);
              
              // If profile doesn't exist (not found error), create one
              if (profileError.code === 'PGRST116') {
                console.log(`AuthProvider: Profile not found for user ${userId}. Creating new profile.`);
                const { data: newProfileData, error: newProfileError } = await supabase
                  .from('profiles')
                  .insert({
                    id: userId,
                    role: 'staff',
                    first_name: userEmail?.split('@')[0] || 'User'
                  })
                  .select()
                  .single();

                if (newProfileError) {
                  console.error(`AuthProvider: Error creating profile for user ${userId}:`, newProfileError.message);
                  // Sign out user if profile creation fails
                  await supabase.auth.signOut();
                  setUser(null);
                  return;
                } else if (newProfileData) {
                  console.log(`AuthProvider: New profile created for user ${userId}.`);
                  setUser({
                    id: newProfileData.id,
                    email: userEmail,
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
              } else {
                // For other errors, sign out the user
                console.error(`AuthProvider: Critical profile error for user ${userId}, signing out.`);
                await supabase.auth.signOut();
                setUser(null);
              }
            } else if (profile) {
              console.log(`AuthProvider: Profile found for user ${userId}.`);
              setUser({
                id: profile.id,
                email: userEmail,
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
              console.warn(`AuthProvider: Profile query returned no data for user ${userId}.`);
              // Sign out if profile exists but returned no data
              await supabase.auth.signOut();
              setUser(null);
            }
          } else {
            console.log("AuthProvider: No active session or user ID. Setting user to null.");
            setUser(null);
          }
        } catch (error: any) {
          console.error("AuthProvider: Unexpected error during auth state change processing:", error.message);
          // Sign out on unexpected errors
          await supabase.auth.signOut();
          setUser(null);
        } finally {
          console.log("AuthProvider: Auth processing finished (onAuthStateChange). Setting loading to false.");
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log(`AuthProvider: getSession() resolved. Initial session present: ${!!initialSession}`);
      if (initialSession && !sessionState) {
        setSessionState(initialSession);
      }
    }).catch(error => {
      console.error("AuthProvider: Error in getSession() during initial check:", error.message);
      setLoading(false);
    });

    return () => {
      console.log("AuthProvider: Unsubscribing from auth state changes.");
      subscription.unsubscribe();
    };
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
    console.log("AuthProvider: Signing out.");
    setLoading(true); 
    await supabase.auth.signOut();
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
