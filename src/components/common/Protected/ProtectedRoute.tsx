import { useAuthStore } from '@/store';
import type { PermissionSection } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  section: PermissionSection;
  action: 'view' | 'create' | 'edit' | 'delete';
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  section,
  action,
  fallback = null,
}) => {
  const { canView, canCreate, canEdit, canDelete } = useAuthStore();
  
  let hasAccess = false;
  switch (action) {
    case 'view':
      hasAccess = canView(section);
      break;
    case 'create':
      hasAccess = canCreate(section);
      break;
    case 'edit':
      hasAccess = canEdit(section);
      break;
    case 'delete':
      hasAccess = canDelete(section);
      break;
  }
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};