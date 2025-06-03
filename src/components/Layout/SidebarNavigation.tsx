
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Menu, 
  BarChart3, 
  Package, 
  Truck, 
  Building2, 
  Users,
  Calendar,
  UserCheck,
  Star,
  CreditCard,
  Sparkles,
  Settings,
  Home,
  MessageCircle,
  TrendingUp,
  Award
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    component: "dashboard"
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    component: "orders"
  },
  {
    title: "Menu",
    href: "/menu",
    icon: Menu,
    component: "menu"
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    component: "analytics"
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
    component: "inventory"
  },
  {
    title: "Suppliers",
    href: "/suppliers",
    icon: Truck,
    component: "suppliers"
  },
  {
    title: "Rooms",
    href: "/rooms",
    icon: Building2,
    component: "rooms"
  },
  {
    title: "Tables",
    href: "/tables",
    icon: Home,
    component: "tables"
  },
  {
    title: "Reservations",
    href: "/reservations",
    icon: Calendar,
    component: "reservations"
  },
  {
    title: "Staff",
    href: "/staff",
    icon: Users,
    component: "staff"
  },
  {
    title: "CRM",
    href: "/crm",
    icon: UserCheck,
    component: "crm"
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Star,
    component: "customers"
  },
  {
    title: "Expenses",
    href: "/expenses",
    icon: CreditCard,
    component: "expenses"
  },
  {
    title: "Housekeeping",
    href: "/housekeeping",
    icon: Sparkles,
    component: "housekeeping"
  },
  {
    title: "Marketing",
    href: "/marketing",
    icon: Award,
    component: "marketing"
  },
  {
    title: "Reports",
    href: "/reports",
    icon: TrendingUp,
    component: "reports"
  },
  {
    title: "AI Assistant",
    href: "/ai",
    icon: MessageCircle,
    component: "ai"
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    component: "settings"
  },
];

interface SidebarNavigationProps {
  allowedComponents: string[];
}

const SidebarNavigation = ({ allowedComponents }: SidebarNavigationProps) => {
  const location = useLocation();

  // Filter navigation items based on allowed components
  const filteredItems = navigationItems.filter(item => 
    allowedComponents.length === 0 || allowedComponents.includes(item.component)
  );

  return (
    <nav className="space-y-1">
      {filteredItems.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Icon className="mr-3 h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
};

export default SidebarNavigation;
