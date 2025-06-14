
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth'; // Changed from useSimpleAuth

interface RestaurantSetupGuardProps {
  children: ReactNode;
}

const RestaurantSetupGuard = ({ children }: RestaurantSetupGuardProps) => {
  const { user: profile, loading: isLoadingProfile } = useAuth(); // Use user as profile, and loading as isLoadingProfile
  const location = useLocation();
  const restaurantId = profile?.restaurant_id;

  const { data: restaurantSetupStatus, isLoading: isLoadingSetupStatus } = useQuery({
    queryKey: ['restaurantSetupStatus', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return { isSetupComplete: false, error: 'No restaurant ID' };
      const { data, error } = await supabase
        .from('restaurants')
        .select('name, address, currency')
        .eq('id', restaurantId)
        .single();

      if (error) {
        console.error('Error fetching restaurant details for setup guard:', error);
        return { isSetupComplete: false, error: error.message }; 
      }
      const isSetupComplete = !!data?.name && !!data?.address && !!data?.currency;
      return { isSetupComplete, error: null };
    },
    enabled: !!restaurantId && !isLoadingProfile,
  });

  if (isLoadingProfile || (restaurantId && isLoadingSetupStatus)) {
    return <div className="flex justify-center items-center h-screen">Checking setup status...</div>;
  }
  
  // If profile is loaded but there's no restaurantId, it means the user.restaurant_id is null.
  // This could happen if the profile creation didn't assign one, or if it's a new user type
  // that doesn't inherently have a restaurant.
  // For the setup flow, if they are authenticated but don't have a restaurant_id,
  // this implies an issue with their account setup that needs to be handled,
  // potentially redirecting to an error page or a specific step to create/link a restaurant.
  // The current logic in AppRoutes.tsx creates a restaurant_id upon profile creation,
  // so this guard is primarily for checking if essential details (name, address, currency) are filled.
  if (!restaurantId && !isLoadingProfile && profile) { 
    // This scenario implies user is loaded, authenticated, but no restaurant_id.
    // This might indicate an issue with the profile creation or association.
    // For now, the setup page itself handles this by showing an error.
    // The guard's primary role is to redirect to setup if restaurant_id exists but setup is incomplete.
    // If no restaurant_id, it's a different kind of problem than "setup incomplete".
    // Allowing children to render might lead them to a page that breaks without restaurantId.
    // However, the RestaurantDetailsPage itself shows an error if no restaurantId.
    // Let's rely on the setup page's own error handling for no restaurantId.
    // The guard will effectively do nothing if no restaurantId.
    console.warn("RestaurantSetupGuard: No restaurant ID found on profile. The page being guarded should handle this.");
  }


  if (restaurantId && restaurantSetupStatus && !restaurantSetupStatus.isSetupComplete && restaurantSetupStatus.error === null) {
    return <Navigate to="/setup/restaurant-details" state={{ from: location }} replace />;
  }
  
  if (restaurantId && restaurantSetupStatus && restaurantSetupStatus.error) {
    return <div className="flex justify-center items-center h-screen text-red-500">Error checking setup: {restaurantSetupStatus.error}. Please try again.</div>;
  }

  return <>{children}</>;
};

export default RestaurantSetupGuard;

