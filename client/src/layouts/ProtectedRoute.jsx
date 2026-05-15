import { Navigate, Outlet } from "react-router-dom";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="mx-auto mt-20 max-w-xl"><Skeleton className="h-40" /></div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
