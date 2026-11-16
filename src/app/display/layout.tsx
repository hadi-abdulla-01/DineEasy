
'use client';

import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AuthProvider } from "@/app/admin/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import type { ReactNode } from "react";
import { RestaurantProvider } from "@/contexts/restaurant-context";
import { DisplayQrSkeleton } from "@/components/skeletons";

// This layout ensures that the display page has access to Firebase services and is protected by authentication.
export default function DisplayLayout({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider fallback={<div className="min-h-screen bg-muted flex flex-col"><DisplayQrSkeleton /></div>}>
      <AuthProvider>
        <RestaurantProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
                {children}
            </ThemeProvider>
        </RestaurantProvider>
      </AuthProvider>
    </FirebaseClientProvider>
  );
}
