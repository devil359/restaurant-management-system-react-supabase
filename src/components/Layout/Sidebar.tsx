import { 
  LayoutDashboard, 
  Menu as MenuIcon, 
  ClipboardList, 
  LayoutGrid,
  Users,
  Box,
  Hotel,
  Truck,
  ChartBar,
  Settings2
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: MenuIcon, label: "Menu", path: "/menu" },
    { icon: ClipboardList, label: "Orders", path: "/orders" },
    { icon: LayoutGrid, label: "Tables", path: "/tables" },
    { icon: Users, label: "Staff", path: "/staff" },
    { icon: Box, label: "Inventory", path: "/inventory" },
    { icon: Hotel, label: "Rooms", path: "/rooms" },
    { icon: Truck, label: "Suppliers", path: "/suppliers" },
    { icon: ChartBar, label: "Analytics", path: "/analytics" },
    { icon: Settings2, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 animate-slide-in">
      <div className="mb-8">
        <h1 className="text-indigo-600 text-2xl font-bold flex items-center gap-2">
          <span className="text-indigo-600">◻</span>
          Restaurant Manager
        </h1>
      </div>
      <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-gray-600",
              location.pathname === item.path
                ? "bg-indigo-50 text-indigo-600"
                : "hover:bg-gray-50"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;