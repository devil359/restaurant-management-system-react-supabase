
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Menu, 
  X, 
  Home, 
  ShoppingCart, 
  Users, 
  Settings,
  MoreHorizontal,
  ChefHat,
  Package,
  UtensilsCrossed,
  CreditCard,
  Zap,
  Calendar,
  BarChart3,
  BookOpen
} from "lucide-react";
import { StandardizedButton } from "@/components/ui/standardized-button";
import { cn } from "@/lib/utils";

interface MobileNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mobileNavItems: MobileNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: Home },
  { id: 'pos', label: 'POS', path: '/pos', icon: CreditCard },
  { id: 'orders', label: 'Orders', path: '/orders', icon: ShoppingCart },
  { id: 'menu', label: 'Menu', path: '/menu', icon: UtensilsCrossed },
  { id: 'kitchen', label: 'Kitchen', path: '/kitchen', icon: ChefHat },
  { id: 'qsr-pos', label: 'QSR POS', path: '/qsr-pos', icon: Zap },
  { id: 'tables', label: 'Tables', path: '/tables', icon: Menu },
  { id: 'reservations', label: 'Reservations', path: '/reservations', icon: Calendar },
  { id: 'inventory', label: 'Inventory', path: '/inventory', icon: Package },
  { id: 'customers', label: 'Customers', path: '/customers', icon: Users },
  { id: 'analytics', label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { id: 'recipes', label: 'Recipes', path: '/recipes', icon: BookOpen },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
];

interface MobileNavigationProps {
  className?: string;
}

/**
 * Mobile-optimized navigation for restaurant staff on tablets/phones
 */
export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <div className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-2 z-50 shadow-lg",
        className
      )}>
        <div className="flex items-center justify-around max-w-screen-xl mx-auto">
          {mobileNavItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-all min-w-[60px]",
                  isActive(item.path)
                    ? "text-primary bg-primary/10 scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium truncate w-full text-center">{item.label}</span>
              </button>
            );
          })}
          
          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-all min-w-[60px]",
              "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50 animate-in fade-in" onClick={() => setIsOpen(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-gray-800 pb-4">
              <h3 className="text-lg font-semibold text-foreground">All Pages</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.path)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                      isActive(item.path)
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="font-medium text-xs text-center leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
