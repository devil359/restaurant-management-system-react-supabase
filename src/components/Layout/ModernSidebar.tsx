
import React, { useState, useEffect } from "react";
import { Menu as MenuIcon, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchAllowedComponents } from "@/utils/subscriptionUtils";
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarHeader } from "./SidebarHeader";
import SidebarNavigation from "./SidebarNavigation";
import { SidebarFooter } from "./SidebarFooter";
import { cn } from "@/lib/utils";

const ModernSidebar = () => {
  const { openMobile, setOpenMobile, state } = useSidebar();
  const [staffName, setStaffName] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: allowedComponents = [] } = useQuery({
    queryKey: ["allowedComponents", restaurantId],
    queryFn: () =>
      restaurantId ? fetchAllowedComponents(restaurantId) : Promise.resolve([]),
    enabled: !!restaurantId,
  });

  const getProfileData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          toast({
            title: "Error",
            description: "Failed to load profile data.",
            variant: "destructive",
          });
          return;
        }

        const displayName = profile?.first_name
          ? `${profile.first_name} ${profile.last_name || ""}`
          : user.email?.split("@")[0] || "User";

        setStaffName(displayName.trim());
        setRestaurantId(profile?.restaurant_id || null);
        
        if (profile?.restaurant_id) {
          fetchRestaurantName(profile.restaurant_id);
        }
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
  };
  
  const fetchRestaurantName = async (restId: string) => {
    try {
      const { data: restaurant, error } = await supabase
        .from("restaurants")
        .select("name")
        .eq("id", restId)
        .single();
        
      if (error) {
        console.error("Error fetching restaurant:", error);
        return;
      }
      
      setRestaurantName(restaurant?.name || "Restaurant");
    } catch (error) {
      console.error("Restaurant fetch error:", error);
    }
  };

  useEffect(() => {
    getProfileData();
  }, []);

  const mobileToggle = (
    <div className="fixed top-6 left-6 z-50 lg:hidden">
      <Button
        onClick={() => setOpenMobile(true)}
        variant="outline"
        size="icon"
        className={cn(
          "bg-white/90 backdrop-blur-sm border border-gray-200/50",
          "shadow-lg hover:shadow-xl rounded-xl",
          "transform hover:scale-105 transition-all duration-200"
        )}
      >
        <MenuIcon className="h-5 w-5" />
      </Button>
    </div>
  );

  return (
    <>
      {mobileToggle}
      <SidebarComponent 
        className={cn(
          "bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900",
          "border-r border-purple-700/30 shadow-2xl",
          "backdrop-blur-sm"
        )}
      >
        <SidebarContent className="bg-transparent">
          <div className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 backdrop-blur-sm border-b border-purple-600/30">
            <SidebarHeader restaurantName={restaurantName} />
          </div>
          
          <div className="flex-1 px-3 py-6 space-y-2">
            <SidebarNavigation allowedComponents={allowedComponents} />
          </div>
          
          <div className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 backdrop-blur-sm border-t border-purple-600/30">
            <SidebarFooter staffName={staffName} />
          </div>
        </SidebarContent>
      </SidebarComponent>
    </>
  );
};

export default ModernSidebar;
