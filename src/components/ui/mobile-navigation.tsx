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
  Calendar,
  BarChart3,
  BookOpen,
  LogOut,
  Bed,
  Sparkles,
  MapPin,
  Target,
  UserPlus,
  Shield,
  DollarSign,
  FileText,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurantId } from "@/hooks/useRestaurantId";
import { Permission } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MobileNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermissions?: Permission[];
}

// All navigation items - matching desktop sidebar
const mobileNavItems: MobileNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: Home, requiredPermissions: ['dashboard.view'] },
  { id: 'pos', label: 'POS', path: '/pos', icon: CreditCard, requiredPermissions: ['orders.view'] },
  { id: 'orders', label: 'Orders', path: '/orders', icon: ShoppingCart, requiredPermissions: ['orders.view'] },
  { id: 'kitchen', label: 'Kitchen', path: '/kitchen', icon: ChefHat, requiredPermissions: ['kitchen.view'] },
  { id: 'menu', label: 'Menu', path: '/menu', icon: UtensilsCrossed, requiredPermissions: ['menu.view'] },
  { id: 'recipes', label: 'Recipes', path: '/recipes', icon: BookOpen, requiredPermissions: ['menu.view'] },
  { id: 'tables', label: 'Tables', path: '/tables', icon: MapPin, requiredPermissions: ['tables.view'] },
  { id: 'inventory', label: 'Inventory', path: '/inventory', icon: Package, requiredPermissions: ['inventory.view'] },
  { id: 'rooms', label: 'Rooms', path: '/rooms', icon: Bed, requiredPermissions: ['rooms.view'] },
  { id: 'reservations', label: 'Reservations', path: '/reservations', icon: Calendar, requiredPermissions: ['reservations.view'] },
  { id: 'housekeeping', label: 'Housekeeping', path: '/housekeeping', icon: Sparkles, requiredPermissions: ['housekeeping.view'] },
  { id: 'customers', label: 'Customers', path: '/customers', icon: Users, requiredPermissions: ['customers.view'] },
  { id: 'marketing', label: 'Marketing', path: '/marketing', icon: Target, requiredPermissions: ['customers.view'] },
  { id: 'staff', label: 'Staff', path: '/staff', icon: Users, requiredPermissions: ['staff.view'] },
  { id: 'analytics', label: 'Analytics', path: '/analytics', icon: BarChart3, requiredPermissions: ['analytics.view'] },
  { id: 'financial', label: 'Financial', path: '/financial', icon: DollarSign, requiredPermissions: ['financial.view'] },
  { id: 'reports', label: 'Reports', path: '/reports', icon: FileText, requiredPermissions: ['analytics.view'] },
  { id: 'user-management', label: 'Users', path: '/user-management', icon: UserPlus, requiredPermissions: ['users.manage'] },
  { id: 'role-management', label: 'Roles', path: '/role-management', icon: Shield, requiredPermissions: ['users.manage'] },
  { id: 'ai', label: 'AI Assistant', path: '/ai', icon: MessageSquare, requiredPermissions: ['dashboard.view'] },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings, requiredPermissions: ['settings.view'] },
];

// Priority items for bottom bar (first 4 that user has access to)
const priorityItemIds = ['dashboard', 'pos', 'orders', 'kitchen', 'menu', 'tables'];

interface MobileNavigationProps {
  className?: string;
}

/**
 * Mobile-optimized navigation for restaurant staff on tablets/phones
 * Includes permission-based filtering, user info, and restaurant branding
 */
export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasAnyPermission } = useAuth();
  const { restaurantName } = useRestaurantId();
  const { toast } = useToast();

  // Filter items based on user permissions
  const hasPermissionForItem = (item: MobileNavItem): boolean => {
    if (!user) return false;
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) return true;
    return hasAnyPermission(item.requiredPermissions);
  };

  const accessibleItems = mobileNavItems.filter(hasPermissionForItem);

  // Get bottom bar items (first 4 accessible items from priority list)
  const bottomBarItems = priorityItemIds
    .map(id => accessibleItems.find(item => item.id === id))
    .filter(Boolean)
    .slice(0, 4) as MobileNavItem[];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
      setIsOpen(false);
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Dynamic branding
  const brandName = restaurantName || "Swadeshi Solutions RMS";

  // User display info
  const displayName = user?.first_name 
    ? `${user.first_name} ${user.last_name || ""}`.trim() 
    : user?.email?.split("@")[0] || "User";
  const userRole = user?.role_name_text || (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Staff");

  return (
    <>
      {/* Mobile Bottom Navigation Bar - with safe area padding */}
      <div className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 z-50 shadow-lg",
        "pb-[env(safe-area-inset-bottom,8px)] pt-2",
        className
      )}>
        <div className="flex items-center justify-around max-w-screen-xl mx-auto">
          {bottomBarItems.map((item) => {
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
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-50 animate-in fade-in" 
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom pb-[env(safe-area-inset-bottom,0px)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Restaurant Name */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleNavigate("/")}
                >
                  <h3 className="text-lg font-bold text-white truncate">{brandName}</h3>
                  <p className="text-white/70 text-xs">Tap to go home</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-180px)] p-4">
              {/* Navigation Grid */}
              <div className="grid grid-cols-4 gap-2">
                {accessibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.path)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                        isActive(item.path)
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium text-[10px] text-center leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {accessibleItems.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No modules available</p>
                  <p className="text-sm text-muted-foreground/70">Contact admin for access</p>
                </div>
              )}
            </div>
            
            {/* User Info Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                  {user?.first_name ? user.first_name.charAt(0) : user?.email?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userRole}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
