import {
  BrowserRouter as Router,
  Routes as Switch,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { useEffect, useState } from "react";
import AI from "@/pages/AI";
import BusinessDashboard from "@/components/Analytics/BusinessDashboard";
import Inventory from "@/pages/Inventory";
import Suppliers from "@/pages/Suppliers";
import CRM from "@/pages/CRM";

const Routes = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  if (loading) {
    return <div>Loading...</div>;
  }

  const ComponentAccessGuard = ({ children }: { children: JSX.Element }) => {
    if (!user) {
      return <Navigate to="/auth" />;
    }
    return children;
  };

  const LoginRegisterAccessGuard = ({ children }: { children: JSX.Element }) => {
    if (user) {
      return <Navigate to="/" />;
    }
    return children;
  };

  return (
    <Switch>
      <Route
        path="/"
        element={
          <ComponentAccessGuard>
            <Index />
          </ComponentAccessGuard>
        }
      />
      <Route
        path="/auth"
        element={
          <LoginRegisterAccessGuard>
            <Auth />
          </LoginRegisterAccessGuard>
        }
      />
      <Route
        path="/orders"
        element={
          <ComponentAccessGuard>
            <Orders />
          </ComponentAccessGuard>
        }
      />
      <Route
        path="/rooms"
        element={
          <ComponentAccessGuard>
            <Rooms />
          </ComponentAccessGuard>
        }
      />
      <Route
        path="/staff"
        element={
          <ComponentAccessGuard>
            <Staff />
          </ComponentAccessGuard>
        }
      />
      <Route
        path="/menu"
        element={
          <ComponentAccessGuard>
            <Menu />
          </ComponentAccessGuard>
        }
      />
      <Route
        path="/tables"
        element={
          <ComponentAccessGuard>
            <Tables />
          </ComponentAccessGuard>
        }
      />
      <Route
        path="/reservations"
        element={
          <ComponentAccessGuard>
            <Reservations />
          </ComponentAccessGuard>
        }
      />
      <Route
        path="/customers"
        element={
          <ComponentAccessGuard>
            <Customers />
          </ComponentAccessGuard>
        }
      />
      <Route
        path="/crm"
        element={
          <ComponentAccessGuard>
            <CRM />
          </ComponentAccessGuard>
        }
      />
      <Route
        path="/analytics"
        element={
          <ComponentAccessGuard>
            <Analytics />
          </ComponentAccessGuard>
        }
      />
      <Route
        path="/settings"
        element={
          <ComponentAccessGuard>
            <Settings />
          </ComponentAccessGuard>
        }
      />
      <Route 
        path="/kitchen" 
        element={
          <ComponentAccessGuard>
            <KitchenDisplay />
          </ComponentAccessGuard>
        }
      />
      <Route
        path="/ai"
        element={
          <ComponentAccessGuard>
            <AI />
          </ComponentAccessGuard>
        }
      />
      <Route
        path="/business-dashboard"
        element={
          <ComponentAccessGuard>
            <BusinessDashboard />
          </ComponentAccessGuard>
        }
      />
      <Route
        path="/inventory"
        element={
          <ComponentAccessGuard>
            <Inventory />
          </ComponentAccessGuard>
        }
      />
      <Route
        path="/suppliers"
        element={
          <ComponentAccessGuard>
            <Suppliers />
          </ComponentAccessGuard>
        }
      />
    </Switch>
  );
};

export default Routes;
