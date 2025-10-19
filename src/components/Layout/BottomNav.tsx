import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Menu as MenuIcon,
  Settings,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/"
    },
    {
      icon: ShoppingCart,
      label: "POS",
      href: "/pos"
    },
    {
      icon: Package,
      label: "Inventory",
      href: "/inventory"
    },
    {
      icon: MenuIcon,
      label: "Menu",
      href: "/menu"
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/settings"
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="flex flex-col items-center justify-center w-full h-full"
            >
              <Icon className={cn(
                "h-5 w-5",
                isActive ? "text-sidebar-purple" : "text-gray-500"
              )} />
              <span className={cn(
                "text-xs mt-1",
                isActive ? "text-sidebar-purple" : "text-gray-500"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
