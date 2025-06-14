
import { Route, Routes } from "react-router-dom";
import Index from "@/pages/Index";
import Orders from "@/pages/Orders";
import Rooms from "@/pages/Rooms";
import Staff from "@/pages/Staff";
import Menu from "@/pages/Menu";
import Tables from "@/pages/Tables";
import Reservations from "@/pages/Reservations";
import Customers from "@/pages/Customers";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import KitchenDisplay from "../Kitchen/KitchenDisplay";
import AI from "@/pages/AI";
import BusinessDashboard from "@/components/Analytics/BusinessDashboard";
import Inventory from "@/pages/Inventory";
import Suppliers from "@/pages/Suppliers";
import CRM from "@/pages/CRM";
import Expenses from "@/pages/Expenses";
import Housekeeping from "@/pages/Housekeeping";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import RestaurantDetailsPage from "@/pages/Setup/RestaurantDetailsPage";
import ProtectedRoute from "./ProtectedRoute"; // Still needed for the setup route
import GuardedRouteElement from "./GuardedRouteElement"; // New import

/**
 * App routes with authentication and setup guard
 */
export const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route 
      path="/setup/restaurant-details" 
      element={
        <ProtectedRoute> {/* Setup page itself only needs ProtectedRoute, not RestaurantSetupGuard */}
          <RestaurantDetailsPage />
        </ProtectedRoute>
      } 
    />

    {/* Protected routes that require setup to be complete, now using GuardedRouteElement */}
    <Route path="/" element={<GuardedRouteElement component={<Index />} />} />
    <Route path="/orders" element={<GuardedRouteElement component={<Orders />} />} />
    <Route path="/rooms" element={<GuardedRouteElement component={<Rooms />} />} />
    <Route path="/staff" element={<GuardedRouteElement component={<Staff />} />} />
    <Route path="/menu" element={<GuardedRouteElement component={<Menu />} />} />
    <Route path="/tables" element={<GuardedRouteElement component={<Tables />} />} />
    <Route path="/reservations" element={<GuardedRouteElement component={<Reservations />} />} />
    <Route path="/customers" element={<GuardedRouteElement component={<Customers />} />} />
    <Route path="/crm" element={<GuardedRouteElement component={<CRM />} />} />
    <Route path="/analytics" element={<GuardedRouteElement component={<Analytics />} />} />
    <Route path="/settings" element={<GuardedRouteElement component={<Settings />} />} />
    <Route path="/kitchen" element={<GuardedRouteElement component={<KitchenDisplay />} />} />
    <Route path="/ai" element={<GuardedRouteElement component={<AI />} />} />
    <Route path="/business-dashboard" element={<GuardedRouteElement component={<BusinessDashboard />} />} />
    <Route path="/inventory" element={<GuardedRouteElement component={<Inventory />} />} />
    <Route path="/suppliers" element={<GuardedRouteElement component={<Suppliers />} />} />
    <Route path="/expenses" element={<GuardedRouteElement component={<Expenses />} />} />
    <Route path="/housekeeping" element={<GuardedRouteElement component={<Housekeeping />} />} />
    {/* Add other main routes here, wrapped similarly */}

    <Route path="*" element={<NotFound />} />
  </Routes>
);
