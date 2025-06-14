
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import SubscriptionGuard from "./SubscriptionGuard";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading, session } = useAuth(); // Assuming useAuth exposes session
  
  // restaurantIdFromProfile will be initially from user?.restaurant_id,
  // and then updated by onAuthStateChange within useSubscriptionStatus
  const { 
    hasActiveSubscription, 
    isLoadingSubscription, 
    restaurantIdFromProfile, 
    setRestaurantIdFromProfile 
  } = useSubscriptionStatus(user?.restaurant_id);

  // Effect to update restaurantId in useSubscriptionStatus when `user` from `useAuth` changes
  useEffect(() => {
    if (user?.restaurant_id !== undefined && user.restaurant_id !== restaurantIdFromProfile) {
        console.log("ProtectedRoute: user.restaurant_id changed, updating useSubscriptionStatus. Current:", restaurantIdFromProfile, "New:", user.restaurant_id);
        setRestaurantIdFromProfile(user.restaurant_id);
    } else if (user === null && restaurantIdFromProfile !== null) {
        // User logged out or became null
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

  // Show loading indicator if either auth or subscription check is in progress
  if (authLoading) {
    console.log("ProtectedRoute: Auth loading...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="mt-4 text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }
  
  // If auth is done, but we don't have a user (e.g. not logged in)
  // This also covers the case where there's no session from useAuth.
  if (!user) { // Check user instead of session, as useAuth manages user state
    console.log("ProtectedRoute: No user (from useAuth), redirecting to auth");
    return <Navigate to="/auth" replace />;
  }

  // If user exists, but subscription is still loading
  if (isLoadingSubscription) {
    console.log("ProtectedRoute: User loaded, subscription loading...");
     return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="mt-4 text-muted-foreground">Checking subscription...</p>
        </div>
      </div>
    );
  }

  // If user exists and subscription check is done
  if (hasActiveSubscription === false) {
    console.log("ProtectedRoute: No active subscription, showing subscription plans for restaurantId:", restaurantIdFromProfile);
    return <SubscriptionPlans restaurantId={restaurantIdFromProfile} />;
  }
  
  // If user exists, subscription is active (or null, meaning check passed somehow or not applicable)
  console.log("ProtectedRoute: Authenticated and subscription active (or not required/checked). Rendering children with SubscriptionGuard.");
  return (
    <SubscriptionGuard>
      {children}
    </SubscriptionGuard>
  );
};

export default ProtectedRoute;
