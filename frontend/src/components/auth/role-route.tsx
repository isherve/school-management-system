import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { canAccessRoute, getHomePath } from '@/lib/access';

interface RoleRouteProps {
  children: React.ReactNode;
  path?: string;
}

export function RoleRoute({ children, path }: RoleRouteProps) {
  const { user } = useAuthStore();
  const checkPath = path || window.location.pathname;

  if (!canAccessRoute(user?.role, checkPath)) {
    return <Navigate to={getHomePath(user?.role)} replace />;
  }

  return <>{children}</>;
}
