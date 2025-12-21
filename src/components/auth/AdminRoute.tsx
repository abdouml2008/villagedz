import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { useUserPermissions, AdminSection } from '@/hooks/useUserPermissions';
import { ReactNode } from 'react';

interface AdminRouteProps {
  children: ReactNode;
  section?: AdminSection;
}

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
  </div>
);

const NoAccessPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-destructive mb-2">لا توجد صلاحية</h1>
      <p className="text-muted-foreground">ليس لديك صلاحية للوصول لهذا القسم</p>
    </div>
  </div>
);

export function AdminRoute({ children, section }: AdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { hasRole, isAdmin, loading: roleLoading } = useHasAnyRole();
  const { hasAccess, loading: permLoading } = useUserPermissions(section);
  
  // Show loading while checking auth state
  if (authLoading || roleLoading || (section && permLoading)) {
    return <LoadingSpinner />;
  }
  
  // Redirect to login if not authenticated or no role
  if (!user || !hasRole) {
    return <Navigate to="/admin" replace />;
  }

  // Check section permission (admins always have access)
  if (section && !isAdmin && !hasAccess) {
    return <NoAccessPage />;
  }
  
  return <>{children}</>;
}
