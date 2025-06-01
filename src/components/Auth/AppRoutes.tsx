
import { Route, Routes, Navigate } from "react-router-dom";
import { ComponentAccessGuard, PermissionRouteGuard } from "./RouteGuards";
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
import Sidebar from "../Layout/Sidebar";
import NotFound from "@/pages/NotFound";
import { SidebarProvider } from "@/components/ui/sidebar";

// Layout wrapper for authenticated pages
const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen w-full">
    <SidebarProvider>
      <Sidebar />
      <main className="flex-1 overflow-auto pl-[3rem] md:pl-[18rem] transition-all duration-300">
        {children}
      </main>
    </SidebarProvider>
  </div>
);

/**
 * All application routes defined with proper permission guards
 */
export const AppRoutes = () => (
  <Routes>
    {/* If authenticated user visits /auth, redirect to dashboard */}
    <Route path="/auth" element={<Navigate to="/" replace />} />
    
    {/* Dashboard */}
    <Route path="/" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="dashboard.view">
          <AppLayout>
            <Index />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* Orders */}
    <Route path="/orders" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="orders.view">
          <AppLayout>
            <Orders />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* Rooms */}
    <Route path="/rooms" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="rooms.view">
          <AppLayout>
            <Rooms />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* Staff */}
    <Route path="/staff" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="staff.view">
          <AppLayout>
            <Staff />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* Menu */}
    <Route path="/menu" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="menu.view">
          <AppLayout>
            <Menu />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* Tables */}
    <Route path="/tables" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="orders.view">
          <AppLayout>
            <Tables />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* Reservations */}
    <Route path="/reservations" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="reservations.view">
          <AppLayout>
            <Reservations />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* Customers */}
    <Route path="/customers" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="customers.view">
          <AppLayout>
            <Customers />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* CRM */}
    <Route path="/crm" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="customers.view">
          <AppLayout>
            <CRM />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* Analytics */}
    <Route path="/analytics" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="analytics.view">
          <AppLayout>
            <Analytics />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* Settings */}
    <Route path="/settings" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="settings.view">
          <AppLayout>
            <Settings />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* Kitchen */}
    <Route path="/kitchen" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="orders.view">
          <AppLayout>
            <KitchenDisplay />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* AI */}
    <Route path="/ai" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="ai.access">
          <AppLayout>
            <AI />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* Business Dashboard */}
    <Route path="/business-dashboard" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="dashboard.analytics">
          <AppLayout>
            <BusinessDashboard />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* Inventory */}
    <Route path="/inventory" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="inventory.view">
          <AppLayout>
            <Inventory />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* Suppliers */}
    <Route path="/suppliers" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="inventory.view">
          <AppLayout>
            <Suppliers />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* Expenses */}
    <Route path="/expenses" element={
      <ComponentAccessGuard>
        <PermissionRouteGuard permission="analytics.view">
          <AppLayout>
            <Expenses />
          </AppLayout>
        </PermissionRouteGuard>
      </ComponentAccessGuard>
    } />
    
    {/* 404 Not Found route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);
