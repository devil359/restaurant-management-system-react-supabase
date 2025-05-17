
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Custom hook to manage authentication state
 */
export const useAuthState = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
};
