
import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Orders from "@/pages/Orders";
import Menu from "@/pages/Menu";
import Analytics from "@/pages/Analytics";
import Inventory from "@/pages/Inventory";
import Suppliers from "@/pages/Suppliers";
import Rooms from "@/pages/Rooms";
import Tables from "@/pages/Tables";
import Staff from "@/pages/Staff";
import CRM from "@/pages/CRM";
import Customers from "@/pages/Customers";
import Expenses from "@/pages/Expenses";
import Settings from "@/pages/Settings";
import AI from "@/pages/AI";
import Housekeeping from "@/pages/Housekeeping";
import Reservations from "@/pages/Reservations";
import Marketing from "@/pages/Marketing";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<Index />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/suppliers" element={<Suppliers />} />
      <Route path="/rooms" element={<Rooms />} />
      <Route path="/tables" element={<Tables />} />
      <Route path="/reservations" element={<Reservations />} />
      <Route path="/staff" element={<Staff />} />
      <Route path="/crm" element={<CRM />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/housekeeping" element={<Housekeeping />} />
      <Route path="/marketing" element={<Marketing />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/ai" element={<AI />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
