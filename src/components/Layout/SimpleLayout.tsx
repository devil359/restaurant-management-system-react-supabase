
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface SimpleLayoutProps {
  children: ReactNode;
}

export const SimpleLayout = ({ children }: SimpleLayoutProps) => {
  return (
    <div className="flex h-screen w-full">
      <SidebarProvider>
        <Sidebar />
        <main className="flex-1 overflow-auto pl-[3rem] md:pl-[18rem] transition-all duration-300">
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
};
