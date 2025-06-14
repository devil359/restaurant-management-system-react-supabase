
import { useState, useEffect } from 'react';
import { checkSubscriptionStatus } from '@/utils/subscriptionUtils';
import { supabase } from '@/integrations/supabase/client';

interface UseSubscriptionStatusReturn {
  hasActiveSubscription: boolean | null;
  isLoadingSubscription: boolean;
  restaurantIdFromProfile: string | null;
  setRestaurantIdFromProfile: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useSubscriptionStatus = (initialRestaurantId: string | null | undefined): UseSubscriptionStatusReturn => {
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [restaurantIdFromProfile, setRestaurantIdFromProfile] = useState<string | null>(initialRestaurantId === undefined ? null : initialRestaurantId);

  useEffect(() => {
    if (initialRestaurantId !== undefined) {
        setRestaurantIdFromProfile(initialRestaurantId);
    } else {
        // If initialRestaurantId becomes undefined (e.g. user logs out from useAuth), set to null
        setRestaurantIdFromProfile(null);
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

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("useSubscriptionStatus: Auth state changed:", event);
        if (mounted) {
          if (session?.user && session.user.id) { // Ensure user and user.id exist
            setIsLoadingSubscription(true);
            const userId = session.user.id; // Use a variable

            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("restaurant_id")
              .eq("id", userId) // Use guarded userId
              .maybeSingle();

            if (profileError) {
              console.error("useSubscriptionStatus (auth change): Profile error:", profileError);
              setRestaurantIdFromProfile(null);
              // fetchSubStatus(null); // This will be triggered by restaurantIdFromProfile change
              setIsLoadingSubscription(false); // Ensure loading state is updated
              return;
            }
            
            const newRestaurantId = profile?.restaurant_id || null;
            console.log("useSubscriptionStatus (auth change): New restaurant_id:", newRestaurantId);
            
            // setRestaurantIdFromProfile will trigger the other useEffect to call fetchSubStatus
            if (newRestaurantId !== restaurantIdFromProfile) {
                 setRestaurantIdFromProfile(newRestaurantId);
            } else {
                // If restaurantId didn't change, but auth event happened, might still need to re-fetch.
                // Or, if profile fetch was successful but didn't change the ID,
                // and we were previously in a loading state from this auth change.
                fetchSubStatus(newRestaurantId); 
            }
            // setIsLoadingSubscription(false) will be handled by fetchSubStatus
          } else {
            console.log("useSubscriptionStatus (auth change): No session or no user.id, clearing restaurant_id.");
            setRestaurantIdFromProfile(null);
            // fetchSubStatus(null); // This will be triggered by restaurantIdFromProfile change
            // Ensure loading is false if we are clearing due to no session.
            if (isLoadingSubscription) setIsLoadingSubscription(false); 
            if (hasActiveSubscription !== false) setHasActiveSubscription(false);
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
