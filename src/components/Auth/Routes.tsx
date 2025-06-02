
import { Routes as Switch, Route, Navigate } from "react-router-dom";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { SimpleLayout } from "@/components/Layout/SimpleLayout";
import AuthLoader from "./AuthLoader";
import Auth from "@/pages/Auth";
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

const Routes = () => {
  const { user, loading } = useSimpleAuth();

  console.log("Routes: Loading:", loading, "User:", user ? "authenticated" : "not authenticated");

  // Show loading spinner while checking auth
  if (loading) {
    return <AuthLoader />;
  }

  // If no user, show auth page
  if (!user) {
    return (
      <Switch>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Switch>
    );
  }

  // User is authenticated, show app routes with simple layout
  return (
    <Switch>
      <Route path="/auth" element={<Navigate to="/" replace />} />
      
      <Route path="/" element={
        <SimpleLayout>
          <Index />
        </SimpleLayout>
      } />
      
      <Route path="/orders" element={
        <SimpleLayout>
          <Orders />
        </SimpleLayout>
      } />
      
      <Route path="/rooms" element={
        <SimpleLayout>
          <Rooms />
        </SimpleLayout>
      } />
      
      <Route path="/staff" element={
        <SimpleLayout>
          <Staff />
        </SimpleLayout>
      } />
      
      <Route path="/menu" element={
        <SimpleLayout>
          <Menu />
        </SimpleLayout>
      } />
      
      <Route path="/tables" element={
        <SimpleLayout>
          <Tables />
        </SimpleLayout>
      } />
      
      <Route path="/reservations" element={
        <SimpleLayout>
          <Reservations />
        </SimpleLayout>
      } />
      
      <Route path="/customers" element={
        <SimpleLayout>
          <Customers />
        </SimpleLayout>
      } />
      
      <Route path="/crm" element={
        <SimpleLayout>
          <CRM />
        </SimpleLayout>
      } />
      
      <Route path="/analytics" element={
        <SimpleLayout>
          <Analytics />
        </SimpleLayout>
      } />
      
      <Route path="/settings" element={
        <SimpleLayout>
          <Settings />
        </SimpleLayout>
      } />
      
      <Route path="/kitchen" element={
        <SimpleLayout>
          <KitchenDisplay />
        </SimpleLayout>
      } />
      
      <Route path="/ai" element={
        <SimpleLayout>
          <AI />
        </SimpleLayout>
      } />
      
      <Route path="/business-dashboard" element={
        <SimpleLayout>
          <BusinessDashboard />
        </SimpleLayout>
      } />
      
      <Route path="/inventory" element={
        <SimpleLayout>
          <Inventory />
        </SimpleLayout>
      } />
      
      <Route path="/suppliers" element={
        <SimpleLayout>
          <Suppliers />
        </SimpleLayout>
      } />
      
      <Route path="/expenses" element={
        <SimpleLayout>
          <Expenses />
        </SimpleLayout>
      } />
      
      <Route path="/housekeeping" element={
        <SimpleLayout>
          <Housekeeping />
        </SimpleLayout>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Switch>
  );
};

export default Routes;
