
import { Route } from "react-router-dom";
import { ComponentAccessGuard, LoginRegisterAccessGuard } from "./RouteGuards";
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

/**
 * All application routes defined as an array for better organization
 */
export const AppRoutes = [
  <Route
    path="/"
    key="home"
    element={
      <ComponentAccessGuard>
        <Index />
      </ComponentAccessGuard>
    }
  />,
  <Route
    path="/auth"
    key="auth"
    element={
      <LoginRegisterAccessGuard>
        <Auth />
      </LoginRegisterAccessGuard>
    }
  />,
  <Route
    path="/orders"
    key="orders"
    element={
      <ComponentAccessGuard>
        <Orders />
      </ComponentAccessGuard>
    }
  />,
  <Route
    path="/rooms"
    key="rooms"
    element={
      <ComponentAccessGuard>
        <Rooms />
      </ComponentAccessGuard>
    }
  />,
  <Route
    path="/staff"
    key="staff"
    element={
      <ComponentAccessGuard>
        <Staff />
      </ComponentAccessGuard>
    }
  />,
  <Route
    path="/menu"
    key="menu"
    element={
      <ComponentAccessGuard>
        <Menu />
      </ComponentAccessGuard>
    }
  />,
  <Route
    path="/tables"
    key="tables"
    element={
      <ComponentAccessGuard>
        <Tables />
      </ComponentAccessGuard>
    }
  />,
  <Route
    path="/reservations"
    key="reservations"
    element={
      <ComponentAccessGuard>
        <Reservations />
      </ComponentAccessGuard>
    }
  />,
  <Route
    path="/customers"
    key="customers"
    element={
      <ComponentAccessGuard>
        <Customers />
      </ComponentAccessGuard>
    }
  />,
  <Route
    path="/crm"
    key="crm"
    element={
      <ComponentAccessGuard>
        <CRM />
      </ComponentAccessGuard>
    }
  />,
  <Route
    path="/analytics"
    key="analytics"
    element={
      <ComponentAccessGuard>
        <Analytics />
      </ComponentAccessGuard>
    }
  />,
  <Route
    path="/settings"
    key="settings"
    element={
      <ComponentAccessGuard>
        <Settings />
      </ComponentAccessGuard>
    }
  />,
  <Route
    path="/kitchen"
    key="kitchen"
    element={
      <ComponentAccessGuard>
        <KitchenDisplay />
      </ComponentAccessGuard>
    }
  />,
  <Route
    path="/ai"
    key="ai"
    element={
      <ComponentAccessGuard>
        <AI />
      </ComponentAccessGuard>
    }
  />,
  <Route
    path="/business-dashboard"
    key="business-dashboard"
    element={
      <ComponentAccessGuard>
        <BusinessDashboard />
      </ComponentAccessGuard>
    }
  />,
  <Route
    path="/inventory"
    key="inventory"
    element={
      <ComponentAccessGuard>
        <Inventory />
      </ComponentAccessGuard>
    }
  />,
  <Route
    path="/suppliers"
    key="suppliers"
    element={
      <ComponentAccessGuard>
        <Suppliers />
      </ComponentAccessGuard>
    }
  />,
];
