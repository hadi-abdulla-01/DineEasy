
'use client';

import { Suspense } from 'react';
import { AuthProvider } from '@/app/admin/auth-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import type { ReactNode } from 'react';

function OrderLayoutContent({ children }: { children: ReactNode }) {
    return (
        <FirebaseClientProvider>
          <AuthProvider>{children}</AuthProvider>
        </FirebaseClientProvider>
    )
}


export default function OrderLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
        <OrderLayoutContent>{children}</OrderLayoutContent>
    </Suspense>
  );
}
