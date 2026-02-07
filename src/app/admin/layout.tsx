
'use client';

import type { ReactNode } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { RestaurantProvider } from "@/contexts/restaurant-context";
import { AuthProvider } from "@/app/admin/auth-provider";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Routes that should not use the dashboard layout
  const simpleLayout =
    pathname.startsWith('/admin/superadmin');

  return (
    <FirebaseClientProvider>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <RestaurantProvider>
            {simpleLayout ? (
              children
            ) : (
              <DashboardLayout>{children}</DashboardLayout>
            )}
          </RestaurantProvider>
        </ThemeProvider>
      </AuthProvider>
    </FirebaseClientProvider>
  );
}
