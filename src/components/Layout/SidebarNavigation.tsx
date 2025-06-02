
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
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Menu",
    href: "/menu",
    icon: Menu,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
  },
  {
    title: "Suppliers",
    href: "/suppliers",
    icon: Truck,
  },
  {
    title: "Rooms",
    href: "/rooms",
    icon: Building2,
  },
  {
    title: "Tables",
    href: "/tables",
    icon: Home,
  },
  {
    title: "Reservations",
    href: "/reservations",
    icon: Calendar,
  },
  {
    title: "Staff",
    href: "/staff",
    icon: Users,
  },
  {
    title: "CRM",
    href: "/crm",
    icon: UserCheck,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Star,
  },
  {
    title: "Expenses",
    href: "/expenses",
    icon: CreditCard,
  },
  {
    title: "Housekeeping",
    href: "/housekeeping",
    icon: Sparkles,
  },
  {
    title: "Marketing",
    href: "/marketing",
    icon: Award,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: TrendingUp,
  },
  {
    title: "AI Assistant",
    href: "/ai",
    icon: MessageCircle,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

const SidebarNavigation = () => {
  const location = useLocation();

  return (
    <nav className="space-y-1">
      {navigationItems.map((item) => {
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
