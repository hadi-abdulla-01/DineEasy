import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';

import { Noto_Sans, Mulish, Outfit, Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';
import { getSettings } from '@/lib/data';
import { DeferredFonts } from '@/components/deferred-fonts';
import { BootGuard } from '@/components/boot-guard';

const noto = Noto_Sans({ subsets: ['latin'], variable: '--font-sans' });
const mulish = Mulish({ subsets: ['latin'], variable: '--font-mulish', weight: ['400', '500', '700'] });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', weight: ['400', '500', '700'] });
const poppins = Poppins({ subsets: ['latin'], variable: '--font-poppins', weight: ['400', '500', '700'] });

// Boot watchdog: if the client app has not hydrated within 15s (JS failed to load/run, a stale
// chunk 404'd, a blocked network request, ...) reveal a reload prompt instead of leaving the
// user on a blank screen / endless spinner. <BootGuard /> sets the flag and hides it again.
const BOOT_WATCHDOG_SCRIPT =
  "(function(){setTimeout(function(){if(!window.__DINEEZEE_BOOTED__){document.documentElement.classList.add('boot-stalled');}},15000);})();";
const BOOT_WATCHDOG_STYLE =
  ".boot-stalled-overlay{display:none}html.boot-stalled .boot-stalled-overlay{display:flex}";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSettings();
    return {
      title: settings?.restaurantName || 'DineEZee',
      description: 'Seamless QR code ordering for modern restaurants.',
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'DineEZee',
      description: 'Seamless QR code ordering for modern restaurants.',
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: BOOT_WATCHDOG_STYLE }} />
        <script dangerouslySetInnerHTML={{ __html: BOOT_WATCHDOG_SCRIPT }} />
      </head>
      <body className={cn("font-sans antialiased", noto.variable, mulish.variable, outfit.variable, poppins.variable)}>
        {children}
        <Toaster />
        <DeferredFonts />
        <BootGuard />
        <div
          className="boot-stalled-overlay"
          role="alert"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483647,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '12px',
            padding: '24px',
            textAlign: 'center',
            background: '#f8f9fb',
            color: '#2b303b',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>This page is taking longer than expected</h1>
          <p style={{ margin: 0, fontSize: '15px', color: '#667085', maxWidth: '320px' }}>
            Please check your internet connection and try again. If you scanned a QR code, you can scan it again.
          </p>
          <a
            href=""
            style={{
              marginTop: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              background: '#f0415f',
              color: '#fff',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Reload page
          </a>
        </div>
      </body>
    </html>
  );
}
