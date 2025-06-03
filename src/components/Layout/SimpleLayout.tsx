
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface SimpleLayoutProps {
  children: ReactNode;
}

export const SimpleLayout = ({ children }: SimpleLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar />
        <SidebarInset className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
