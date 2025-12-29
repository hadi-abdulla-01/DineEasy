
'use client';

import { useAuth } from "@/app/admin/auth-provider";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin-header";
import AdminSidebar from "@/components/admin-sidebar";
import { ThemeProvider } from "@/components/theme-provider";

function KitchenDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#f1f1f1] dark:bg-gray-900 flex flex-col font-sans transition-colors">
      <AdminHeader isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}

function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith('/kitchen/login')) {
    return <>{children}</>;
  }

  return (
    <KitchenDashboardLayout>{children}</KitchenDashboardLayout>
  );
}

export default function KitchenLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LayoutWrapper>{children}</LayoutWrapper>
    </ThemeProvider>
  );
}
