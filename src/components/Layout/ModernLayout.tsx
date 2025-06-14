
import { ReactNode } from "react";
import ModernSidebar from "./ModernSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface ModernLayoutProps {
  children: ReactNode;
}

export const ModernLayout = ({ children }: ModernLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <ModernSidebar />
        <main 
          className={cn(
            "flex-1 overflow-auto",
            "bg-gradient-to-br from-gray-50 via-white to-purple-50/20",
            "dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20"
          )}
          style={{ paddingLeft: '7rem' }}
        >
          <div className="min-h-full">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23000000\" fill-opacity=\"0.03\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
            <div className="relative z-10 p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
