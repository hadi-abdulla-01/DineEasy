
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/admin/auth-provider';
import SuperAdminPanel from '@/components/SuperAdminPanel';
import { isSuperAdmin } from '@/lib/auth-utils';

export default function SuperAdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!user) {
            router.push('/admin');
            return;
        }

        if (isSuperAdmin(user.email || '')) {
            setIsAuthorized(true);
        } else {
            router.push('/admin');
        }

        setIsChecking(false);
    }, [user, router]);

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return <SuperAdminPanel />;
}
