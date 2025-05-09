
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";
import Stats from "@/components/Dashboard/Stats";
import OrderList from "@/components/Orders/OrderList";
import WeeklySalesChart from "@/components/Dashboard/WeeklySalesChart";
import QuickStats from "@/components/Dashboard/QuickStats";
import Chatbot from "@/components/Chatbot/Chatbot";
import PredictiveAnalytics from "@/components/Dashboard/PredictiveAnalytics";
import type { Order } from "@/types/orders";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();
  
  const { data: orders = [], refetch } = useQuery({
    queryKey: ["orders"],
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

      const today = new Date();
      
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", userProfile.restaurant_id)
        .gte('created_at', startOfDay(today).toISOString())
        .lte('created_at', endOfDay(today).toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });

  return (
    <div className="space-y-6 animate-fade-in px-4 md:px-6 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
          <span className="text-sm text-muted-foreground">Live Updates</span>
        </div>
      </div>
      
      <div className="rounded-xl bg-gradient-to-br from-card/50 to-background/50 backdrop-blur-xl border border-primary/10 p-4 md:p-6">
        <QuickStats />
      </div>
      
      {/* AI-Powered Predictive Analytics */}
      <PredictiveAnalytics />
      
      <div className="rounded-xl bg-gradient-to-br from-card/50 to-background/50 backdrop-blur-xl border border-primary/10 p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4">Weekly Sales Overview</h2>
        <WeeklySalesChart />
      </div>
      
      <div className="rounded-xl bg-gradient-to-br from-card/50 to-background/50 backdrop-blur-xl border border-primary/10 p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Stats Overview
        </h2>
        <Stats />
      </div>
      
      <div className="rounded-xl bg-gradient-to-br from-card/50 to-background/50 backdrop-blur-xl border border-primary/10 p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Recent Orders
        </h2>
        <div className="overflow-x-auto">
          <OrderList orders={orders} onOrdersChange={refetch} />
        </div>
      </div>

      <Chatbot />
    </div>
  );
};

export default Index;
