
'use client';

import type { ReactNode } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { RestaurantProvider } from "@/contexts/restaurant-context";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Routes that should not use the dashboard layout
  if (pathname.startsWith('/admin/login') || pathname.startsWith('/admin/superadmin')) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {children}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <RestaurantProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </RestaurantProvider>
    </ThemeProvider>
  );
}
