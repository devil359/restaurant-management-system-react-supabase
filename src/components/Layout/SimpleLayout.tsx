
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MobileNavigation } from "@/components/ui/mobile-navigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface SimpleLayoutProps {
  children: ReactNode;
}

export const SimpleLayout = ({ children }: SimpleLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {!isMobile && <Sidebar />}
        <main 
          className="flex-1 overflow-auto pb-20 lg:pb-0" 
          style={{ paddingLeft: isMobile ? '0' : '7rem' }}
        >
          <div className="p-4">
            {children}
          </div>
        </main>
        {isMobile && <MobileNavigation />}
      </div>
    </SidebarProvider>
  );
};
