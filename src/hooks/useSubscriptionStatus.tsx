
import { useState, useEffect } from 'react';
import { checkSubscriptionStatus } from '@/utils/subscriptionUtils';
import { supabase } from '@/integrations/supabase/client'; // Added for onAuthStateChange

interface UseSubscriptionStatusReturn {
  hasActiveSubscription: boolean | null;
  isLoadingSubscription: boolean;
  restaurantIdFromProfile: string | null;
  setRestaurantIdFromProfile: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useSubscriptionStatus = (initialRestaurantId: string | null | undefined): UseSubscriptionStatusReturn => {
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  // This state is to ensure we use the restaurant_id from the latest profile after auth state change
  const [restaurantIdFromProfile, setRestaurantIdFromProfile] = useState<string | null>(initialRestaurantId || null);

  useEffect(() => {
    // This effect helps ensure restaurantIdFromProfile is updated if initialRestaurantId changes
    // e.g. when user from useAuth() updates.
    if (initialRestaurantId !== undefined) {
        setRestaurantIdFromProfile(initialRestaurantId);
    }
  }, [initialRestaurantId]);

  useEffect(() => {
    let mounted = true;

    const fetchSubStatus = async (id: string | null) => {
      if (!id) {
        if (mounted) {
          setHasActiveSubscription(false);
          setIsLoadingSubscription(false);
          console.log("useSubscriptionStatus: No restaurant ID, setting subscription to false.");
        }
        return;
      }

      if (mounted) setIsLoadingSubscription(true);
      try {
        console.log(`useSubscriptionStatus: Checking subscription for restaurant ID: ${id}`);
        const subscriptionActive = await checkSubscriptionStatus(id);
        if (mounted) {
          console.log("useSubscriptionStatus: Subscription status:", subscriptionActive);
          setHasActiveSubscription(subscriptionActive);
        }
      } catch (subError) {
        console.error("useSubscriptionStatus: Subscription check error:", subError);
        if (mounted) {
          setHasActiveSubscription(false);
        }
      } finally {
        if (mounted) {
          setIsLoadingSubscription(false);
        }
      }
    };

    fetchSubStatus(restaurantIdFromProfile);

    // Listen for auth changes to re-fetch profile and then subscription status
    // This is important if the user logs in/out or session changes,
    // as their restaurant_id might change or become available.
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("useSubscriptionStatus: Auth state changed:", event);
        if (mounted) {
          if (session?.user) {
            setIsLoadingSubscription(true); // Indicate loading while we fetch new profile/sub
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("restaurant_id")
              .eq("id", session.user.id)
              .maybeSingle();

            if (profileError) {
              console.error("useSubscriptionStatus (auth change): Profile error:", profileError);
              setRestaurantIdFromProfile(null);
              fetchSubStatus(null); // Re-check with null restaurantId
              return;
            }
            
            const newRestaurantId = profile?.restaurant_id || null;
            console.log("useSubscriptionStatus (auth change): New restaurant_id:", newRestaurantId);
            setRestaurantIdFromProfile(newRestaurantId);
            // fetchSubStatus will be triggered by restaurantIdFromProfile change if it's different,
            // or we can call it directly if needed, but useEffect on restaurantIdFromProfile handles it.
            // For safety, let's ensure it runs.
            if (newRestaurantId !== restaurantIdFromProfile) {
                 // The useEffect for restaurantIdFromProfile will handle this.
            } else {
                fetchSubStatus(newRestaurantId); // If restaurantId didn't change, still re-fetch.
            }

          } else {
            // No session, clear restaurant_id and set subscription to false
            console.log("useSubscriptionStatus (auth change): No session, clearing restaurant_id.");
            setRestaurantIdFromProfile(null);
            fetchSubStatus(null);
          }
        }
      }
    );
    
    return () => {
      mounted = false;
      authSubscription.unsubscribe();
    };
  }, [restaurantIdFromProfile]); // Rerun when restaurantIdFromProfile changes

  return { hasActiveSubscription, isLoadingSubscription, restaurantIdFromProfile, setRestaurantIdFromProfile };
};

