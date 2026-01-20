
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { KitchenUser } from '@/lib/definitions';
import { LoaderCircle } from 'lucide-react';
import { isSuperAdmin } from '@/lib/auth-utils';
import { getKitchenUserById } from '@/lib/data'; // Assuming this function can be used client-side

type AuthContextType = {
  isAuthenticated: boolean;
  user: KitchenUser | null;
  login: (user: KitchenUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isProtectedRoute = (pathname: string) => {
  return pathname.startsWith('/admin') || pathname.startsWith('/kitchen');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<KitchenUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let currentUser: KitchenUser | null = null;
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
    // Check if user is on any login page
    const isOnLoginPage = pathname.startsWith('/login') ||
      pathname.startsWith('/admin/login') ||
      pathname.startsWith('/kitchen/login');

    if (isProtected) {
      if (!currentUser) {
        // Only redirect if not on a login-related page to avoid redirect loops
        if (!isOnLoginPage) {
          router.push('/login?role=admin');
        }
      } else {
        // Handle role-based redirects for authenticated users on protected routes
        if (currentUser.role === 'Kitchen' && pathname.startsWith('/admin') && !isOnLoginPage) {
          router.replace('/kitchen');
        } else if (currentUser.role !== 'Kitchen' && pathname.startsWith('/kitchen') && !isOnLoginPage) {
          router.replace('/admin');
        }
      }
    }

    setIsLoading(false);

  }, [pathname, router]);

  const login = useCallback((loggedInUser: KitchenUser) => {
    sessionStorage.setItem('dineEasyUser', JSON.stringify(loggedInUser));
    setUser(loggedInUser);

    // Check if super admin
    if (loggedInUser.email && isSuperAdmin(loggedInUser.email)) {
      router.replace('/admin/superadmin');
    } else if (loggedInUser.role === 'Kitchen') {
      router.replace('/kitchen');
    } else {
      router.replace('/admin');
    }
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('dineEasyUser');
    router.push('/login?role=admin');
  }, [router]);

  const refreshUser = useCallback(async () => {
    const storedUser = sessionStorage.getItem('dineEasyUser');
    if (storedUser) {
      const currentUser: KitchenUser = JSON.parse(storedUser);
      if (currentUser?.id && currentUser.restaurantId) {
        const refreshedUser = await getKitchenUserById(currentUser.id, currentUser.restaurantId);
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


  // Show a loading screen only when trying to access a protected route without being authenticated yet.
  if (isLoading && isProtectedRoute(pathname)) {
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
      {children}
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
