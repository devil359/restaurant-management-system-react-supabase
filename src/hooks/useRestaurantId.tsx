
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * A custom hook that fetches the restaurant ID and name for the current user
 * This centralizes the restaurant information fetching logic that was previously duplicated across components
 */
export const useRestaurantId = () => {
  const { data, isLoading, error } = useQuery({
      queryKey: ["restaurant-info"],
      queryFn: async () => {
        // 1) Get current user
        const { data: authRes } = await supabase.auth.getUser();
        const user = authRes?.user;
        if (!user) throw new Error("No user found");

        // 2) Primary source: profiles.restaurant_id
        const { data: userProfile, error: profileErr } = await supabase
          .from("profiles")
          .select("restaurant_id")
          .eq("id", user.id)
          .single();

        if (profileErr && profileErr.code !== 'PGRST116') throw profileErr; // ignore not found

        if (userProfile?.restaurant_id) {
          const { data: restaurant, error: restError } = await supabase
            .from("restaurants")
            .select("id, name")
            .eq("id", userProfile.restaurant_id)
            .single();
          if (restError) throw restError;
          return { restaurantId: restaurant.id, restaurantName: restaurant.name };
        }

        // 3) Fallback A: match by owner_email = auth user's email
        if (user.email) {
          const { data: ownedRestaurant, error: ownedErr } = await supabase
            .from("restaurants")
            .select("id, name")
            .eq("owner_email", user.email)
            .maybeSingle();
          if (ownedErr && ownedErr.code !== 'PGRST116') throw ownedErr;
          if (ownedRestaurant) {
            return { restaurantId: ownedRestaurant.id, restaurantName: ownedRestaurant.name };
          }
        }

        // 4) Fallback B: pick first available restaurant (single-tenant safety net)
        const { data: anyRestaurant } = await supabase
          .from("restaurants")
          .select("id, name")
          .limit(1)
          .maybeSingle();
        if (anyRestaurant) {
          return { restaurantId: anyRestaurant.id, restaurantName: anyRestaurant.name };
        }

        return { restaurantId: null, restaurantName: null };
      },
      staleTime: 1000 * 60 * 30, // 30 minutes
    });

  return { 
    restaurantId: data?.restaurantId || null, 
    restaurantName: data?.restaurantName || null,
    isLoading, 
    error 
  };
};
