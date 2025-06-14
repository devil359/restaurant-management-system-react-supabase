
import React, { useEffect } from 'react';
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import LoadingIndicator from '@/components/ui/LoadingIndicator';

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

  // Show loading while authentication is being processed
  if (authLoading) {
    console.log("ProtectedRoute: Auth loading...");
    return <LoadingIndicator message="Loading application..." />;
  }

  // If we have a session but no user, there was likely an error with profile loading
  // Redirect to auth page to re-authenticate
  if (session && !user) {
    console.log("ProtectedRoute: Session exists but no user profile, redirecting to auth for re-authentication");
    return <Navigate to="/auth" replace />;
  }

  // If no session and no user, redirect to auth
  if (!session && !user) {
    console.log("ProtectedRoute: No session and no user, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }

  // At this point we should have a user, but double-check
  if (!user) {
    console.log("ProtectedRoute: No user despite checks, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }

  // Show loading while subscription is being checked
  if (isLoadingSubscription) {
    console.log("ProtectedRoute: User loaded, subscription loading...");
    return <LoadingIndicator message="Checking subscription..." />;
  }

  // If no active subscription, show subscription plans
  if (hasActiveSubscription === false) {
    console.log("ProtectedRoute: No active subscription, showing subscription plans for restaurantId:", restaurantIdFromProfile);
    return <SubscriptionPlans restaurantId={restaurantIdFromProfile} />;
  }

  console.log("ProtectedRoute: Authenticated and subscription active. Rendering children.");
  return <>{children}</>;
};

export default ProtectedRoute;
