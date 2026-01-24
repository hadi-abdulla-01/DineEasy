'use client';

import { AuthProvider } from '@/app/admin/auth-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import type { ReactNode } from 'react';

export default function OrderLayout({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AuthProvider>{children}</AuthProvider>
    </FirebaseClientProvider>
  );
}
