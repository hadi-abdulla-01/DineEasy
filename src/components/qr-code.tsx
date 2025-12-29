
'use client';
import React, { useEffect, useState } from 'react';
import ReactQRCode from 'qrcode.react';
import type { RestaurantSettings } from '@/lib/definitions';

export function QRCode({ tableId, settings }: { tableId: string, settings: RestaurantSettings | null }) {
  const [baseUrl, setBaseUrl] = useState('');
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  if (!baseUrl || !settings) {
    return <div className="h-[150px] w-[150px] bg-muted animate-pulse rounded-md" />;
  }

  const orderUrl = `${baseUrl}/order/${tableId}`;

  return (
    <ReactQRCode
      value={orderUrl}
      size={150}
      level="H"
      bgColor={settings.qrCodeBackgroundColor || "transparent"}
      fgColor={settings.qrCodeColor || "#000000"}
      imageSettings={
        settings.qrCodeLogo ? {
          src: settings.qrCodeLogo,
          height: 30,
          width: 30,
          excavate: true,
        } : undefined
      }
      renderAs="canvas"
      className="max-w-full h-auto"
    />
  );
}
