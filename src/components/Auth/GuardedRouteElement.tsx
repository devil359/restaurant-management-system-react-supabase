
import React from 'react';
import ProtectedRoute from './ProtectedRoute';
import RestaurantSetupGuard from './RestaurantSetupGuard';

interface GuardedRouteElementProps {
  component: React.ReactElement; // The page component to render
}

const GuardedRouteElement: React.FC<GuardedRouteElementProps> = ({ component }) => {
  return (
    <ProtectedRoute>
      <RestaurantSetupGuard>
        {component}
      </RestaurantSetupGuard>
    </ProtectedRoute>
  );
};

export default GuardedRouteElement;
