
import { Route, Routes, Navigate } from "react-router-dom";
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
import RestaurantDetailsPage from "@/pages/Setup/RestaurantDetailsPage"; // New import
import { ProtectedRoute } from "./RouteGuards"; // Assuming ProtectedRoute handles general auth
import RestaurantSetupGuard from "./RestaurantSetupGuard"; // New import

/**
 * App routes with authentication and setup guard
 */
export const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/setup/restaurant-details" element={<ProtectedRoute><RestaurantDetailsPage /></ProtectedRoute>} />

    {/* Protected routes that require setup to be complete */}
    <Route 
      path="/" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <Index />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/orders" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <Orders />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/rooms" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <Rooms />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/staff" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <Staff />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/menu" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <Menu />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/tables" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <Tables />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/reservations" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <Reservations />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/customers" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <Customers />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/crm" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <CRM />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/analytics" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <Analytics />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/settings" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <Settings />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/kitchen" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <KitchenDisplay />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/ai" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <AI />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/business-dashboard" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <BusinessDashboard />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/inventory" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <Inventory />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/suppliers" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <Suppliers />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/expenses" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <Expenses />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/housekeeping" 
      element={
        <ProtectedRoute>
          <RestaurantSetupGuard>
            <Housekeeping />
          </RestaurantSetupGuard>
        </ProtectedRoute>
      } 
    />
    {/* Add other main routes here, wrapped similarly */}

    <Route path="*" element={<NotFound />} />
  </Routes>
);
