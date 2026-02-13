
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { AppUser, NavMenuKey, RestaurantSettings } from '@/lib/definitions';
import { LoaderCircle, AlertTriangle } from 'lucide-react';
import { getUserById, getSettings } from '@/lib/data';
import { useUser } from '@/firebase/provider';
import { extractRestaurantId } from '@/lib/auth-utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AuthContextType = {
  isAuthenticated: boolean;
  user: AppUser | null;
  login: (user: AppUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type InactiveReason = 'suspended' | 'expired' | null;

const isProtectedRoute = (pathname: string) => {
  return pathname.startsWith('/admin') || pathname.startsWith('/kitchen') || pathname.startsWith('/display');
}

// --- START PERMISSION HELPERS ---

const settingsKeys: NavMenuKey[] = [
    'settingsRestaurant', 'settingsBranches', 'settingsGeneral', 'settingsFloors',
    'settingsCategories', 'settingsSessions', 'settingsPos', 'settingsOnline',
    'settingsInvoicing', 'settingsPrinting', 'settingsQr', 'settingsPlatforms',
    'settingsDiscounts', 'settingsSubscription'
];

function hasPermission(user: AppUser, key: NavMenuKey): boolean {
    if (!user) return false;
    if (user.isSuperAdmin || user.role === 'Admin') {
        return true;
    }
    if (key === 'settings') {
        if (user.permissions?.settings?.view) {
            return true;
        }
        return settingsKeys.some(settingKey => !!user.permissions?.[settingKey]?.view);
    }
    return !!user.permissions?.[key]?.view;
};

const ROUTE_PERMISSION_MAP: { path: string; permission: NavMenuKey }[] = [
  { path: '/admin/pos', permission: 'pos' },
  { path: '/admin/table-order', permission: 'tableOrder' },
  { path: '/admin/tables', permission: 'tables' },
  { path: '/admin/menu', permission: 'menu' },
  { path: '/admin/kitchen', permission: 'kitchen' },
  { path: '/admin/sales-history', permission: 'salesHistory' },
  { path: '/admin/sales', permission: 'sales' },
  { path: '/admin/reports/menu-performance', permission: 'menuPerformance'},
  { path: '/admin/reports/employee-performance', permission: 'employeePerformance'},
  { path: '/admin/reports/peak-hours', permission: 'peakHours'},
  { path: '/admin/online-orders', permission: 'onlineOrders' },
  { path: '/admin/take-away', permission: 'takeAway' },
  { path: '/admin/user-management', permission: 'userManagement' },
  { path: '/admin/settings', permission: 'settings' },
  { path: '/display', permission: 'display' },
];

function getPermissionForPath(pathname: string): NavMenuKey | null {
    const sortedMap = ROUTE_PERMISSION_MAP.sort((a, b) => b.path.length - a.path.length);
    const match = sortedMap.find(mapping => pathname.startsWith(mapping.path));
    return match ? match.permission : null;
}

// --- END PERMISSION HELPERS ---


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inactiveReason, setInactiveReason] = useState<InactiveReason>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { isUserLoading: isFirebaseUserLoading } = useUser();

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('dineEasyUser');
    router.replace('/login?role=admin');
  }, [router]);

  useEffect(() => {
    let currentUser: AppUser | null = null;
    try {
      const storedUser = sessionStorage.getItem('dineEasyUser');
      if (storedUser) {
        currentUser = JSON.parse(storedUser);
        setUser(currentUser);
      }
    } catch (error) {
      console.error("Could not access session storage:", error);
    }

    const isProtected = isProtectedRoute(pathname);
    const isOnLoginPage = pathname.startsWith('/login');

    if (!isFirebaseUserLoading) {
        if (isProtected && !isOnLoginPage) {
            if (!currentUser) {
                router.replace('/login?role=admin');
                return;
            }
            
            if (currentUser.role === 'Table') {
                if (!pathname.startsWith('/admin/place-order') && !pathname.startsWith('/display')) {
                    router.replace('/admin/place-order');
                    return;
                }
            } else if (currentUser.role === 'Kitchen' && !pathname.startsWith('/kitchen')) {
                router.replace('/kitchen');
                return;
            } 
            else if (currentUser.role !== 'Kitchen' && pathname.startsWith('/kitchen')) {
                router.replace('/admin');
                return;
            }
            else if (currentUser.role !== 'Admin' && !currentUser.isSuperAdmin) {
                const requiredPermission = getPermissionForPath(pathname);
                
                if (requiredPermission && !hasPermission(currentUser, requiredPermission)) {
                    if(pathname !== '/admin') {
                      router.replace('/admin');
                      return;
                    }
                }
            }
        }
        setIsLoading(false);
    }

  }, [pathname, router, logout, isFirebaseUserLoading]);
  
  useEffect(() => {
    if (!user || user.isSuperAdmin) {
      setInactiveReason(null);
      return;
    }

    const checkStatus = async () => {
      const restaurantId = extractRestaurantId(user.email || '');
      if (restaurantId) {
        try {
          const restaurantData = await getSettings(undefined, restaurantId);
          
          const isActive = (restaurantData as any).isActive ?? true;
           if (!isActive) {
            setInactiveReason('suspended');
            return;
          }
          
          const nextBillingDateString = (restaurantData as any).nextBillingDate;
          let isExpired = false;
          if (nextBillingDateString) {
            const nextBillingDate = new Date(nextBillingDateString);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Compare against the start of today
            
            if (nextBillingDate < today) {
                isExpired = true;
            }
          }

          if (isExpired) {
            setInactiveReason('expired');
          } else {
            setInactiveReason(null);
          }

        } catch (error) {
          console.error("Failed to check restaurant status:", error);
        }
      }
    };

    checkStatus();
    const intervalId = setInterval(checkStatus, 30000);

    return () => clearInterval(intervalId);
  }, [user]);

  const login = useCallback((loggedInUser: AppUser) => {
    sessionStorage.setItem('dineEasyUser', JSON.stringify(loggedInUser));
    setUser(loggedInUser);

    // Check if super admin
    if (loggedInUser.isSuperAdmin) {
      router.replace('/admin/superadmin');
    } else if (loggedInUser.role === 'Table') {
        if (loggedInUser.assignedTableId && loggedInUser.restaurantId) {
            router.replace(`/display?tableId=${loggedInUser.assignedTableId}&restaurantId=${loggedInUser.restaurantId}`);
        } else {
            // Handle case where a table user is not assigned to a table
            // For now, redirect to a safe place.
            router.replace('/admin');
        }
    } else if (loggedInUser.role === 'Kitchen') {
      router.replace('/kitchen');
    } else {
      router.replace('/admin');
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    const storedUser = sessionStorage.getItem('dineEasyUser');
    if (storedUser) {
      const currentUser: AppUser = JSON.parse(storedUser);
      if (currentUser?.id && currentUser.restaurantId) {
        const refreshedUser = await getUserById(currentUser.id, currentUser.restaurantId);
        if (refreshedUser) {
          login(refreshedUser);
        }
      }
    }
  }, [login]);

  const isAuthenticated = !!user;

  const authContextValue = useMemo(() => ({
    isAuthenticated,
    user,
    login,
    logout,
    refreshUser
  }), [isAuthenticated, user, login, logout, refreshUser]);


  const combinedIsLoading = isLoading || isFirebaseUserLoading;

  if (combinedIsLoading && isProtectedRoute(pathname)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {inactiveReason ? (
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                {inactiveReason === 'expired' ? 'Subscription Expired' : 'Account Suspended'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {inactiveReason === 'expired'
                  ? "Your subscription has ended. To continue using our services, please renew your plan by contacting your software administrator for billing details."
                  : "This restaurant account is currently suspended. Please contact your software administrator for assistance."
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
