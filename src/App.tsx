
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes as ReactRoutes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import AppRoutes from "./components/Auth/Routes";
import { Toaster } from "./components/ui/toaster";
import "./App.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Sidebar from "./components/Layout/Sidebar";
import { useIsMobile } from "./hooks/use-mobile";
import { SidebarProvider } from "./components/ui/sidebar";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(isMobile);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
            <ReactRoutes>
              <Route path="/auth" element={<Auth />} />
              {/* You can add other Routes here if needed */}
              <Route path="*" element={
                <div className="flex h-screen w-full">
                  <SidebarProvider>
                    <Sidebar />
                    <main
                      className={`flex-1 overflow-auto transition-all duration-300 ${
                        isCollapsed ? "ml-16" : "ml-64"
                      }`}
                    >
                      <AppRoutes />
                    </main>
                  </SidebarProvider>
                </div>
              } />
            </ReactRoutes>
            <Toaster />
          </div>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
