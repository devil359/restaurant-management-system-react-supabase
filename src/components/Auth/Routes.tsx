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
import CustomerManagement from "@/pages/CustomerManagement";
import { useEffect, useState } from "react";

const routes = [
  {
    path: "/",
    component: Index,
  },
  {
    path: "/orders",
    component: Orders,
  },
  {
    path: "/rooms",
    component: Rooms,
  },
  {
    path: "/staff",
    component: Staff,
  },
  {
    path: "/menu",
    component: Menu,
  },
  {
    path: "/tables",
    component: Tables,
  },
  {
    path: "/reservations",
    component: Reservations,
  },
  {
    path: "/customers",
    component: CustomerManagement,
  },
  {
    path: "/analytics",
    component: Analytics,
  },
  {
    path: "/settings",
    component: Settings,
  },
  {
    path: "/kitchen",
    component: KitchenDisplay,
  },
];

const Routes = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current auth state
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
    
    // Listen for auth changes
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
      {routes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <ComponentAccessGuard>
              <route.component />
            </ComponentAccessGuard>
          }
        />
      ))}
    </Switch>
  );
};

export default Routes;
