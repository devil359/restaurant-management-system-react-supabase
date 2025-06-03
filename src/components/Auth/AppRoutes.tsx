
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

/**
 * App routes with authentication page
 */
export const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/" element={<Index />} />
    <Route path="/orders" element={<Orders />} />
    <Route path="/rooms" element={<Rooms />} />
    <Route path="/staff" element={<Staff />} />
    <Route path="/menu" element={<Menu />} />
    <Route path="/tables" element={<Tables />} />
    <Route path="/reservations" element={<Reservations />} />
    <Route path="/customers" element={<Customers />} />
    <Route path="/crm" element={<CRM />} />
    <Route path="/analytics" element={<Analytics />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="/kitchen" element={<KitchenDisplay />} />
    <Route path="/ai" element={<AI />} />
    <Route path="/business-dashboard" element={<BusinessDashboard />} />
    <Route path="/inventory" element={<Inventory />} />
    <Route path="/suppliers" element={<Suppliers />} />
    <Route path="/expenses" element={<Expenses />} />
    <Route path="/housekeeping" element={<Housekeeping />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);
