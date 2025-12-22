import { useAuth } from '../contexts/AuthContext';
import { useProfile } from './useProfiles';

export type TenderUserRole = 'admin' | 'sale' | 'none';

export function useTenderPermissions() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);

  const getUsername = (): string | null => {
    if (!user?.email) return null;
    return user.email.split('@')[0];
  };

  const getUserRole = (): TenderUserRole => {
    if (!profile) return 'none';
    return profile.role as TenderUserRole;
  };

  const canAccessTenderAnalytics = (): boolean => {
    const role = getUserRole();
    return role === 'admin' || role === 'sale';
  };

  const canAccessAdminDashboard = (): boolean => {
    const role = getUserRole();
    return role === 'admin';
  };

  const hasSearchQuota = (): boolean => {
    const role = getUserRole();
    return role === 'sale';
  };

  return {
    username: getUsername(),
    role: getUserRole(),
    canAccessTenderAnalytics: canAccessTenderAnalytics(),
    canAccessAdminDashboard: canAccessAdminDashboard(),
    hasSearchQuota: hasSearchQuota(),
  };
}
