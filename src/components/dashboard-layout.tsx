'use client';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/admin/auth-provider';
import { useEffect, useState } from 'react';
import AdminHeader from './admin-header';
import AdminSidebar from './admin-sidebar';
import KioskHeader from './kiosk-header';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    const AuthDependentLayout = () => {
        const { user } = useAuth();
        const [isSidebarOpen, setIsSidebarOpen] = useState(false);
        const isPosPage = pathname === '/admin/pos';

        // Close sidebar on route change
        useEffect(() => {
            setIsSidebarOpen(false);
        }, [pathname]);

        if (!user) {
            return null;
        }

        // Kiosk mode for Table users
        if (user.role === 'Table') {
            return (
                <div className="min-h-screen bg-muted dark:bg-gray-800 flex flex-col font-sans">
                    <KioskHeader />
                    <main className="flex-1 overflow-y-auto">
                       {children}
                    </main>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-[#f1f1f1] dark:bg-gray-900 flex flex-col font-sans transition-colors">
                <AdminHeader isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <div className="flex flex-1 overflow-hidden">
                    {!isPosPage && <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}
                    <main className={cn(
                        "flex-1 overflow-y-auto",
                        !isPosPage && "p-4 lg:p-8",
                        "print:p-0 print:m-0"
                    )}>
                        <div className={cn(
                            !isPosPage && "max-w-7xl mx-auto",
                            "print:max-w-none"
                        )}>
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    if (pathname.startsWith('/admin') || pathname.startsWith('/display')) {
         return <AuthDependentLayout />;
    }

    return <>{children}</>;
}
