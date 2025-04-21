
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpenCheck,
  ShoppingCart,
  Settings,
  PanelLeft,
  BarChart3,
  Users,
  Store,
  Kitchen,
  LogOut,
  Utensils,
  Menu,
  Bell,
  Bot,
  Luggage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 h-screen flex flex-col border-r transition-all duration-300 overflow-y-auto",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="py-4 px-3 flex justify-between items-center">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            <span className="font-bold text-xl">RestaurantOS</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1">
        <NavItem
          to="/"
          icon={<LayoutDashboard />}
          text="Dashboard"
          active={isActive("/")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/reservations"
          icon={<CalendarCheck />}
          text="Reservations"
          active={isActive("/reservations")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/orders"
          icon={<ShoppingCart />}
          text="Orders"
          active={isActive("/orders")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/menu"
          icon={<BookOpenCheck />}
          text="Menu"
          active={isActive("/menu")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/customers"
          icon={<Users />}
          text="Customers"
          active={isActive("/customers")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/kitchen"
          icon={<Kitchen />}
          text="Kitchen"
          active={isActive("/kitchen")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/rooms"
          icon={<Luggage />}
          text="Rooms"
          active={isActive("/rooms")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/tables"
          icon={<Utensils />}
          text="Tables"
          active={isActive("/tables")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/inventory"
          icon={<Menu />}
          text="Inventory"
          active={isActive("/inventory")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/staff"
          icon={<Users />}
          text="Staff"
          active={isActive("/staff")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/suppliers"
          icon={<Store />}
          text="Suppliers"
          active={isActive("/suppliers")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/analytics"
          icon={<BarChart3 />}
          text="Analytics"
          active={isActive("/analytics")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/ai"
          icon={<Bot />}
          text="AI Assistant"
          active={isActive("/ai")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/notifications"
          icon={<Bell />}
          text="Notifications"
          active={isActive("/notifications")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/settings"
          icon={<Settings />}
          text="Settings"
          active={isActive("/settings")}
          isCollapsed={isCollapsed}
        />
      </div>

      <div className="py-4 px-3">
        <NavItem
          to="/logout"
          icon={<LogOut />}
          text="Logout"
          active={false}
          isCollapsed={isCollapsed}
        />
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  active: boolean;
  isCollapsed: boolean;
}

const NavItem = ({ to, icon, text, active, isCollapsed }: NavItemProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
        active
          ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
          : "hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!isCollapsed && <span>{text}</span>}
    </Link>
  );
};

export default Sidebar;
