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
  const [loading, setLoading] = useState(true); // Start with loading true

  useEffect(() => {
    // Explicitly set loading to true when the effect runs or re-runs.
    // This handles cases where AuthProvider might re-mount.
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
              setUser(null);
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
              console.log(`AuthProvider: Profile not found for user ${userId}. Creating new profile.`);
              const { data: newProfileData, error: newProfileError } = await supabase
                .from('profiles')
                .insert({
                  id: userId,
                  email: userEmail,
                  role: 'staff', 
                  is_active: true
                })
                .select()
                .single();

              if (newProfileError) {
                console.error(`AuthProvider: Error creating profile for user ${userId}:`, newProfileError.message);
                setUser(null);
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
              } else {
                console.warn(`AuthProvider: Profile insert for ${userId} returned no data.`);
                setUser(null);
              }
            }
          } else {
            console.log("AuthProvider: No active session or user ID. Setting user to null.");
            setUser(null);
          }
        } catch (error: any) {
          console.error("AuthProvider: Unexpected error during auth state change processing:", error.message);
          setUser(null);
        } finally {
          console.log("AuthProvider: Auth processing finished (onAuthStateChange). Setting loading to false.");
          setLoading(false); // This is now the SOLE authority for setting loading to false.
        }
      }
    );

    // Check for existing session. This helps populate sessionState early if onAuthStateChange is delayed,
    // but it should NOT control the main 'loading' state.
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log(`AuthProvider: getSession() resolved. Initial session present: ${!!initialSession}`);
      if (initialSession && !sessionState) { // Only set if onAuthStateChange hasn't already set it.
            setSessionState(initialSession);
      }
      // DO NOT set loading to false here. onAuthStateChange's finally block handles this.
    }).catch(error => {
        console.error("AuthProvider: Error in getSession() during initial check:", error.message);
        // setUser(null); // onAuthStateChange will handle this.
        // setSessionState(null); // onAuthStateChange will handle this.
        // DO NOT set loading to false here. onAuthStateChange's finally block handles this.
    });

    return () => {
      console.log("AuthProvider: Unsubscribing from auth state changes.");
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount and cleans up on unmount

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
    // setUser(null); // Handled by onAuthStateChange
    // setSessionState(null); // Handled by onAuthStateChange
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
