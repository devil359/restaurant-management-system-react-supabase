
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * A custom hook that fetches the restaurant ID for the current user
 * This centralizes the restaurant ID fetching logic that was previously duplicated across components
 */
export const useRestaurantId = () => {
  const { data: restaurantId, isLoading, error } = useQuery({
    queryKey: ["restaurant-id"],
    queryFn: async () => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No user found");

      const { data: userProfile, error } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", profile.user.id)
        .single();

      if (error) throw error;
      return userProfile?.restaurant_id;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  return { restaurantId, isLoading, error };
};
