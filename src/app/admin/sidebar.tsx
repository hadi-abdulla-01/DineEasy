
'use client';

import {
    LayoutDashboard,
    Grid2x2,
    Utensils,
    ChefHat,
    ShoppingBag,
    Package,
    BarChart3,
    History,
    Users,
    Settings,
    Monitor,
    TrendingUp,
    Star,
    Clock,
    QrCode,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/app/admin/auth-provider';
import type { NavMenuKey } from '@/lib/definitions';
import Logo from '@/components/logo';

interface AdminSidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const settingsKeys: NavMenuKey[] = [
    'settingsRestaurant', 'settingsBranches', 'settingsGeneral', 'settingsFloors',
    'settingsCategories', 'settingsSessions', 'settingsPos', 'settingsOnline',
    'settingsInvoicing', 'settingsPrinting', 'settingsQr', 'settingsPlatforms',
    'settingsDiscounts', 'settingsSubscription'
];

export default function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
    const pathname = usePathname();
    const { user } = useAuth();

    if (!user) return null;

    const navGroups = [
        {
            label: 'Main',
            items: [
                { key: 'dashboard' as NavMenuKey, icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
                { key: 'pos' as NavMenuKey, icon: Monitor, label: 'POS Screen', href: '/admin/pos' },
                { key: 'tableOrder' as NavMenuKey, icon: Grid2x2, label: 'Table Order', href: '/admin/table-order' },
                { key: 'menu' as NavMenuKey, icon: Utensils, label: 'Menu Management', href: '/admin/menu' },
                { key: 'kitchen' as NavMenuKey, icon: ChefHat, label: 'Kitchen View', href: '/admin/kitchen' },
                { key: 'onlineOrders' as NavMenuKey, icon: ShoppingBag, label: 'Online Orders', href: '/admin/online-orders' },
                { key: 'takeAway' as NavMenuKey, icon: Package, label: 'Take Away', href: '/admin/take-away' },
            ]
        },
        {
            label: 'Analytics',
            items: [
                { key: 'sales' as NavMenuKey, icon: BarChart3, label: 'Sales Report', href: '/admin/sales' },
                { key: 'salesHistory' as NavMenuKey, icon: History, label: 'Sales History', href: '/admin/sales-history' },
                { key: 'menuPerformance' as NavMenuKey, icon: TrendingUp, label: 'Menu Performance', href: '/admin/reports/menu-performance' },
                { key: 'employeePerformance' as NavMenuKey, icon: Star, label: 'Employee Performance', href: '/admin/reports/employee-performance' },
                { key: 'peakHours' as NavMenuKey, icon: Clock, label: 'Peak Hours', href: '/admin/reports/peak-hours' },
            ]
        },
        {
            label: 'Configuration',
            items: [
                { key: 'userManagement' as NavMenuKey, icon: Users, label: 'User Management', href: '/admin/user-management' },
                { key: 'tables' as NavMenuKey, icon: Grid2x2, label: 'Table Management', href: '/admin/tables' },
                { key: 'settings' as NavMenuKey, icon: Settings, label: 'Settings', href: '/admin/settings' },
            ]
        }
    ];

    const hasPermission = (key: NavMenuKey) => {
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


    return (
        <>
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden print:hidden"
                />
            )}
            <aside
                className={cn(
                    `fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800
                    transform transition-transform duration-300 ease-in-out
                    shadow-lg lg:shadow-none border-r border-gray-100 dark:border-gray-700`,
                    "print:hidden",
                    isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                    'mt-16 lg:mt-0'
                )}
            >
                <nav className="h-full overflow-y-auto p-4 flex flex-col">
                    <div className="flex-1 space-y-6">
                        {navGroups.map((group, groupIndex) => {
                            const visibleGroupItems = group.items.filter(item => hasPermission(item.key));
                            if (visibleGroupItems.length === 0) return null;

                            return (
                                <div key={group.label}>
                                    {groupIndex > 0 && <div className="border-t border-gray-200 dark:border-gray-700 my-4" />}
                                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3">
                                        {group.label}
                                    </p>
                                    <div className="space-y-1">
                                        {visibleGroupItems.map((item) => {
                                            const isActive = (() => {
                                                if (item.href === '/admin/settings') {
                                                    return pathname.startsWith('/admin/settings');
                                                }
                                                if (item.href === '/display') {
                                                    return pathname === '/display';
                                                }
                                                if (pathname === item.href) {
                                                    return true;
                                                }
                                                if (item.href === '/admin') {
                                                    return false;
                                                }
                                                return pathname.startsWith(`${item.href}/`);
                                            })();
                                            return (
                                                <Link
                                                    key={item.label}
                                                    href={item.href}
                                                    onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                                                        "hover:bg-gray-100 dark:hover:bg-gray-700",
                                                        "text-gray-700 dark:text-gray-300",
                                                        isActive
                                                            ? "bg-[#CB1E1D] text-white hover:bg-[#CB1E1D] dark:bg-[#CB1E1D] dark:hover:bg-[#CB1E1D]"
                                                            : ""
                                                    )}
                                                >
                                                    <item.icon size={20} className={isActive ? "text-white" : "text-gray-600 dark:text-gray-400"} />
                                                    <span className="font-medium text-sm">{item.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer Logo */}
                    <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-center p-3 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                            <Logo className="h-6 w-auto text-[#CB1E1D] dark:text-white" />
                        </div>
                    </div>
                </nav>
            </aside>
        </>
    );
}
