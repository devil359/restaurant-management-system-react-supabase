
import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  console.log("ProtectedRoute: Simplified version - rendering children directly");
  
  // Temporarily bypass all authentication and subscription checks
  return <>{children}</>;
};

export default ProtectedRoute;
