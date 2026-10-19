
'use client';
    
import { useAuth } from '@/app/admin/auth-provider';
import { Button } from '@/components/ui/button';
import { Utensils, QrCode, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Logo from './logo';
import { useState } from 'react';
import { ConfirmLogoutDialog } from './confirm-logout-dialog';
import { extractRestaurantId } from '@/lib/auth-utils';

export default function KioskHeader() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

    if (user?.role !== 'Table') return null;

    const handleLogout = () => {
        setIsLogoutConfirmOpen(true);
    };

    const isOrderMode = pathname.startsWith('/admin/place-order');
    const isDisplayMode = pathname.startsWith('/display');
    const displayHref = user.assignedTableId && user.restaurantId ? `/display?tableId=${user.assignedTableId}&restaurantId=${user.restaurantId}` : '#';

    return (
        <>
            <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 p-2 print:hidden">
                <div className="flex items-center justify-between">
                    <Logo className="h-8 w-auto text-primary" />

                    <div className="flex items-center gap-2">
                        <Button asChild variant={isOrderMode ? 'default' : 'outline'} className="gap-2">
                             <Link href="/admin/place-order">
                                <Utensils className="h-5 w-5" />
                                <span className="hidden sm:inline">Order Mode</span>
                             </Link>
                        </Button>
                        <Button asChild variant={isDisplayMode ? 'default' : 'outline'} className="gap-2">
                            <Link href={displayHref}>
                                <QrCode className="h-5 w-5" />
                                <span className="hidden sm:inline">QR Display</span>
                            </Link>
                        </Button>
                    </div>

                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>
            <ConfirmLogoutDialog 
                isOpen={isLogoutConfirmOpen}
                onOpenChange={setIsLogoutConfirmOpen}
            />
        </>
    );
}
