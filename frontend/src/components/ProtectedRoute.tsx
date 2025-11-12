// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

type ProtectedRouteProps = {
  /** If false, only MEMBERs can pass. Default: true (GUEST or MEMBER) */
  allowGuest?: boolean;
  children?: React.ReactNode;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowGuest = true, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p>Loading…</p>;

  // Not logged in at all → go to login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Logged in but route is members-only
  if (!allowGuest && user.role !== "MEMBER") {
    // You can redirect to a friendly page instead of login
    return <Navigate to="/rooms" replace />;
  }

  // Render nested routes or children
  return children ? <>{children}</> : <Outlet />;
};
