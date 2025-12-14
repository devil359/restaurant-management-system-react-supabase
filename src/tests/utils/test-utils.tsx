import React, { ReactNode, createContext } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';

// Create a custom render function that wraps components with necessary providers
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Turn off retries for testing
    },
  },
});

// Mock Auth Context for testing
const MockAuthContext = createContext<any>({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'owner',
    restaurant_id: 'test-restaurant-id',
    is_active: true,
  },
  loading: false,
  hasPermission: () => true,
  hasAnyPermission: () => true,
  isRole: () => true,
  signOut: async () => {},
});

// Re-export the mock context for use in tests
export const useAuth = () => {
  const context = React.useContext(MockAuthContext);
  return context;
};

// Mock AuthProvider wrapper
const MockAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const mockAuthValue = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'owner',
      restaurant_id: 'test-restaurant-id',
      is_active: true,
    },
    loading: false,
    hasPermission: () => true,
    hasAnyPermission: () => true,
    isRole: () => true,
    signOut: async () => {},
  };

  return (
    <MockAuthContext.Provider value={mockAuthValue}>
      {children}
    </MockAuthContext.Provider>
  );
};

export function renderWithProviders(ui: ReactNode) {
  const queryClient = createTestQueryClient();
  
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MockAuthProvider>
          <TooltipProvider>
            <BrowserRouter>
              {ui}
            </BrowserRouter>
          </TooltipProvider>
        </MockAuthProvider>
      </QueryClientProvider>
    ),
    queryClient,
  };
}
