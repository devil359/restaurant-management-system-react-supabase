
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleAuth } from '@/hooks/useSimpleAuth'; // Ensure this hook provides profile and restaurant_id

interface RestaurantSetupGuardProps {
  children: ReactNode;
}

const RestaurantSetupGuard = ({ children }: RestaurantSetupGuardProps) => {
  const { profile, isLoading: isLoadingProfile } = useSimpleAuth();
  const location = useLocation();
  const restaurantId = profile?.restaurant_id;

  const { data: restaurantSetupStatus, isLoading: isLoadingSetupStatus } = useQuery({
    queryKey: ['restaurantSetupStatus', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return { isSetupComplete: false, error: 'No restaurant ID' }; // Or handle as needed
      const { data, error } = await supabase
        .from('restaurants')
        .select('name, address, currency') // Check for essential fields
        .eq('id', restaurantId)
        .single();

      if (error) {
        console.error('Error fetching restaurant details for setup guard:', error);
        // Potentially treat error as setup incomplete or navigate to an error page
        return { isSetupComplete: false, error: error.message }; 
      }
      // Define "setup complete" as having a name. More fields can be added.
      const isSetupComplete = !!data?.name && !!data?.address && !!data?.currency;
      return { isSetupComplete, error: null };
    },
    enabled: !!restaurantId && !isLoadingProfile, // Only run if restaurantId is available
  });

  if (isLoadingProfile || (restaurantId && isLoadingSetupStatus)) {
    return <div className="flex justify-center items-center h-screen">Checking setup status...</div>; // Or a more sophisticated loader
  }
  
  if (!restaurantId && !isLoadingProfile) {
    // This case might mean the user profile isn't fully loaded or there's an issue.
    // Depending on app flow, could redirect to login or show an error.
    // For now, let's assume ProtectedRoute handles authentication, so if we are here, user is authenticated.
    // This could imply a problem with profile creation or association.
    console.warn("RestaurantSetupGuard: No restaurant ID found on profile.");
    // Potentially navigate to an error page or a page to create/associate a restaurant
    // For simplicity, if no restaurant_id, maybe they shouldn't be past login.
    // This guard assumes a restaurant_id SHOULD exist for an authenticated user needing setup.
  }

  if (restaurantId && restaurantSetupStatus && !restaurantSetupStatus.isSetupComplete && restaurantSetupStatus.error === null) {
    // If setup is not complete and no error fetching status, redirect to setup
    return <Navigate to="/setup/restaurant-details" state={{ from: location }} replace />;
  }
  
  if (restaurantId && restaurantSetupStatus && restaurantSetupStatus.error) {
    // Handle case where fetching setup status failed
    return <div className="flex justify-center items-center h-screen text-red-500">Error checking setup: {restaurantSetupStatus.error}. Please try again.</div>;
  }

  return <>{children}</>;
};

export default RestaurantSetupGuard;
