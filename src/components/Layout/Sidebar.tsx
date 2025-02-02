import { Home, Menu, ClipboardList, LayoutGrid } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Menu, label: "Menu", path: "/menu" },
    { icon: ClipboardList, label: "Orders", path: "/orders" },
    { icon: LayoutGrid, label: "Tables", path: "/tables" },
  ];

  return (
    <div className="w-64 bg-primary text-primary-foreground min-h-screen p-4 animate-slide-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Restaurant Manager</h1>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
              location.pathname === item.path
                ? "bg-accent text-accent-foreground"
                : "hover:bg-primary-foreground/10"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;