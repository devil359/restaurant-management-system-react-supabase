import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "./useRealtimeSubscription";

export const useStatsData = () => {
  // Setup real-time subscription for orders table
  useRealtimeSubscription({
    table: 'orders',
    queryKey: 'dashboard-orders',
    schema: 'public',
  });

  return useQuery({
    queryKey: ["dashboard-orders"],
    queryFn: async () => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No user found");

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", profile.user.id)
        .single();

      if (!userProfile?.restaurant_id) {
        throw new Error("No restaurant found for user");
      }

      // Fetch all orders from all sources (POS, table, manual, room service, QSR, etc.)
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", userProfile.restaurant_id);

      if (error) throw error;
      return data;
    },
  });
};
