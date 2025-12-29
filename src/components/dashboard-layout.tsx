'use client';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/admin/auth-provider';
import { useEffect, useState } from 'react';
import AdminHeader from './admin-header';
import AdminSidebar from './admin-sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    const AuthDependentLayout = () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { logout, user } = useAuth();
        const [isSidebarOpen, setIsSidebarOpen] = useState(false);

        // Close sidebar on route change
        useEffect(() => {
            setIsSidebarOpen(false);
        }, [pathname]);

        if (!user) {
            return null;
        }

        return (
            <div className="min-h-screen bg-[#f1f1f1] dark:bg-gray-900 flex flex-col font-sans transition-colors">
                <AdminHeader isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <div className="flex flex-1 overflow-hidden">
                    <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                    <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#f1f1f1] dark:bg-gray-900">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    if (pathname.startsWith('/admin')) {
        return <AuthDependentLayout />;
    }

    return <>{children}</>;
}
