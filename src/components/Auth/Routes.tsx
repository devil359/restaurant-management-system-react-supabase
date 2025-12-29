import React from "react";
import { Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppRoutes } from "./AppRoutes";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import LandingWebsite from "@/pages/LandingWebsite";

const Routes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    // Non-authenticated users: Landing page at root, Auth at /auth or /login
    return (
      <RouterRoutes>
        <Route path="/" element={<LandingWebsite />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/website" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </RouterRoutes>
    );
  }

  // Authenticated users: Dashboard at root, landing page still accessible
  return (
    <RouterRoutes>
      <Route path="/website" element={<LandingWebsite />} />
      <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/*" element={<AppRoutes />} />
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};

export default Routes;
