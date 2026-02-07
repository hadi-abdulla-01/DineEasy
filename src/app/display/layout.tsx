
'use client';

import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AuthProvider } from "@/app/admin/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import type { ReactNode } from "react";
import { RestaurantProvider } from "@/contexts/restaurant-context";

// This layout ensures that the display page has access to Firebase services and is protected by authentication.
export default function DisplayLayout({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
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
