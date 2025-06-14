
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const SidebarFooter = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const displayName = user?.first_name || user?.email?.split('@')[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="border-t border-sidebar-border p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sidebar-purple font-medium">
          {user?.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-white">
            {displayName}
          </p>
          <p className="text-xs text-white/70 truncate">
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Staff Member"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          title="Sign Out"
          className="text-white hover:bg-sidebar-purple-dark"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
