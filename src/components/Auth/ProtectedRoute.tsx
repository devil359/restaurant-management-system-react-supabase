
import React, { useEffect } from 'react';
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import LoadingIndicator from '@/components/ui/LoadingIndicator'; // New import

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading, session } = useAuth();
  const {
    hasActiveSubscription,
    isLoadingSubscription,
    restaurantIdFromProfile,
    setRestaurantIdFromProfile
  } = useSubscriptionStatus(user?.restaurant_id);

  useEffect(() => {
    if (user?.restaurant_id !== undefined && user.restaurant_id !== restaurantIdFromProfile) {
        console.log("ProtectedRoute: user.restaurant_id changed, updating useSubscriptionStatus. Current:", restaurantIdFromProfile, "New:", user.restaurant_id);
        setRestaurantIdFromProfile(user.restaurant_id);
    } else if (user === null && restaurantIdFromProfile !== null) {
        console.log("ProtectedRoute: user became null, clearing restaurantId in useSubscriptionStatus.");
        setRestaurantIdFromProfile(null);
    }
  }, [user, restaurantIdFromProfile, setRestaurantIdFromProfile]);

  console.log(
    "ProtectedRoute render - AuthLoading:", authLoading,
    "User:", !!user,
    "Session from useAuth:", !!session,
    "IsLoadingSubscription:", isLoadingSubscription,
    "Subscription:", hasActiveSubscription,
    "RestaurantId (from useAuth):", user?.restaurant_id,
    "RestaurantId (from useSubscriptionStatus):", restaurantIdFromProfile,
  );

  if (authLoading) {
    console.log("ProtectedRoute: Auth loading...");
    return <LoadingIndicator message="Loading application..." />;
  }

  if (!user) {
    console.log("ProtectedRoute: No user (from useAuth), redirecting to auth");
    return <Navigate to="/auth" replace />;
  }

  if (isLoadingSubscription) {
    console.log("ProtectedRoute: User loaded, subscription loading...");
    return <LoadingIndicator message="Checking subscription..." />;
  }

  if (hasActiveSubscription === false) {
    console.log("ProtectedRoute: No active subscription, showing subscription plans for restaurantId:", restaurantIdFromProfile);
    // Ensure restaurantIdFromProfile is not undefined if it's null, pass null.
    return <SubscriptionPlans restaurantId={restaurantIdFromProfile} />;
  }

  console.log("ProtectedRoute: Authenticated and subscription active. Rendering children.");
  // If all checks pass, render children directly
  return <>{children}</>;
};

export default ProtectedRoute;
