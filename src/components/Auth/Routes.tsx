
import { Routes as Switch } from "react-router-dom";
import { useAuthState } from "@/hooks/useAuthState";
import { AppRoutes } from "./AppRoutes";

/**
 * Main Routes component that renders all application routes
 * Refactored to improve maintainability and readability
 */
const Routes = () => {
  const { loading } = useAuthState();
  
  if (loading) {
    return <div>Loading...</div>;
  }

  return <Switch>{AppRoutes}</Switch>;
};

export default Routes;
