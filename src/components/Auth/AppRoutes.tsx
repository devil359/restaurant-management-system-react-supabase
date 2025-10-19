import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ImprovedSidebarNavigation } from "@/components/Layout/ImprovedSidebarNavigation";
import SimpleSidebar from "../Layout/SimpleSidebar";
import Index from "@/pages/Index";
import Orders from "@/pages/Orders";
import POS from "@/pages/POS";
import QSRPos from "@/pages/QSRPos";
import Menu from "@/pages/Menu";
import Staff from "@/pages/Staff";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import Inventory from "@/pages/Inventory";
import Tables from "@/pages/Tables";
import Rooms from "@/pages/Rooms";
import Housekeeping from "@/pages/Housekeeping";
import Reservations from "@/pages/Reservations";
import Customers from "@/pages/Customers";
import CRM from "@/pages/CRM";
import Suppliers from "@/pages/Suppliers";
import Expenses from "@/pages/Expenses";
import AI from "@/pages/AI";
import ChannelManagement from "@/pages/ChannelManagement";
import Kitchen from "@/pages/Kitchen";
import Financial from "@/pages/Financial";
import Security from "@/pages/Security";
import UserManagement from "@/pages/UserManagement";
import RecipeManagement from "@/pages/RecipeManagement";
import { PermissionGuard } from "./PermissionGuard";
import { SidebarHeader } from "../Layout/SidebarHeader";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu as MenuIcon } from "lucide-react";

/**
 * Main application routes for authenticated users
 */
export const AppRoutes = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      <div className={cn(
        "bg-sidebar-purple transition-all duration-300 ease-in-out relative",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}>
        {isSidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(false)}
            className="absolute top-4 left-4 text-white hover:bg-white/10 w-8 h-8"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
        )}
        <ImprovedSidebarNavigation 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={
            <PermissionGuard permission="dashboard.view">
              <Index />
            </PermissionGuard>
          } />
          <Route path="/orders" element={
            <PermissionGuard permission="orders.view">
              <Orders />
            </PermissionGuard>
          } />
          <Route path="/pos" element={
            <PermissionGuard permission="orders.view">
              <POS />
            </PermissionGuard>
          } />
          <Route path="/qsr-pos" element={
            <PermissionGuard permission="orders.view">
              <QSRPos />
            </PermissionGuard>
          } />
          <Route path="/menu" element={
            <PermissionGuard permission="menu.view">
              <Menu />
            </PermissionGuard>
          } />
          <Route path="/recipes" element={
            <PermissionGuard permission="menu.view">
              <RecipeManagement />
            </PermissionGuard>
          } />
          <Route path="/staff" element={
            <PermissionGuard permission="staff.view">
              <Staff />
            </PermissionGuard>
          } />
          <Route path="/analytics" element={
            <PermissionGuard permission="analytics.view">
              <Analytics />
            </PermissionGuard>
          } />
          <Route path="/financial" element={
            <PermissionGuard permission="financial.view">
              <Financial />
            </PermissionGuard>
          } />
          <Route path="/settings" element={
            <PermissionGuard permission="settings.view">
              <Settings />
            </PermissionGuard>
          } />
          <Route path="/inventory" element={
            <PermissionGuard permission="inventory.view">
              <Inventory />
            </PermissionGuard>
          } />
          <Route path="/tables" element={
            <PermissionGuard permission="tables.view">
              <Tables />
            </PermissionGuard>
          } />
          <Route path="/rooms" element={
            <PermissionGuard permission="rooms.view">
              <Rooms />
            </PermissionGuard>
          } />
          <Route path="/housekeeping" element={
            <PermissionGuard permission="housekeeping.view">
              <Housekeeping />
            </PermissionGuard>
          } />
          <Route path="/reservations" element={
            <PermissionGuard permission="reservations.view">
              <Reservations />
            </PermissionGuard>
          } />
          <Route path="/customers" element={
            <PermissionGuard permission="customers.view">
              <Customers />
            </PermissionGuard>
          } />
          <Route path="/crm" element={
            <PermissionGuard permission="customers.view">
              <CRM />
            </PermissionGuard>
          } />
          <Route path="/suppliers" element={
            <PermissionGuard permission="inventory.view">
              <Suppliers />
            </PermissionGuard>
          } />
          <Route path="/expenses" element={
            <PermissionGuard permission="financial.view">
              <Expenses />
            </PermissionGuard>
          } />
          <Route path="/ai" element={
            <PermissionGuard permission="dashboard.view">
              <AI />
            </PermissionGuard>
          } />
          <Route path="/channel-management" element={
            <PermissionGuard permission="analytics.view">
              <ChannelManagement />
            </PermissionGuard>
          } />
          <Route path="/kitchen" element={
            <PermissionGuard permission="kitchen.view">
              <Kitchen />
            </PermissionGuard>
          } />
          <Route path="/security" element={
            <PermissionGuard permission="audit.view">
              <Security />
            </PermissionGuard>
          } />
          <Route path="/user-management" element={
            <PermissionGuard permission="users.manage">
              <UserManagement />
            </PermissionGuard>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};
