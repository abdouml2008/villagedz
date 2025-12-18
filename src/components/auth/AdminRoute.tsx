import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { ReactNode } from 'react';

interface AdminRouteProps {
  children: ReactNode;
}

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
  </div>
);

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { hasRole, loading: roleLoading } = useHasAnyRole();
  
  // Show loading while checking auth state
  if (authLoading || roleLoading) {
    return <LoadingSpinner />;
  }
  
  // Redirect to login if not authenticated or no role
  if (!user || !hasRole) {
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
}
