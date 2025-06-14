
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import "./App.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { AuthProvider } from "@/hooks/useAuth";
import { ModernLayout } from "./components/Layout/ModernLayout";
import { AppRoutes } from "./components/Auth/AppRoutes";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  console.log("App: Rendering modern application");
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <ErrorBoundary>
          <AuthProvider>
            <Router>
              <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/30">
                <ModernLayout>
                  <AppRoutes />
                </ModernLayout>
                <Toaster />
              </div>
            </Router>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
