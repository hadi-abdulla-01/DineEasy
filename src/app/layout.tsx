
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';

import { Noto_Sans, Mulish, Outfit, Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from './admin/auth-provider';

const noto = Noto_Sans({ subsets: ['latin'], variable: '--font-sans' });
const mulish = Mulish({ subsets: ['latin'], variable: '--font-mulish', weight: ['400', '500', '700'] });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', weight: ['400', '500', '700'] });
const poppins = Poppins({ subsets: ['latin'], variable: '--font-poppins', weight: ['400', '500', '700'] });

export const metadata: Metadata = {
  title: 'DineEasy',
  description: 'Seamless QR code ordering for modern restaurants.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-sans antialiased", noto.variable, mulish.variable, outfit.variable, poppins.variable)}>
        <FirebaseClientProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
