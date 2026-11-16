'use client';
import React, { useEffect, useState } from 'react';
import ReactQRCode from 'qrcode.react';
import type { RestaurantSettings, Table } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';

export function QRCode({ table, settings }: { table: Table, settings: RestaurantSettings | null }) {
  const [baseUrl, setBaseUrl] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.origin : ''
  );

  useEffect(() => {
    if (!baseUrl && typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, [baseUrl]);

  if (!baseUrl || !settings) {
    return <Skeleton className="h-[150px] w-[150px] rounded-md" />;
  }

  const encodedTableId = encodeURIComponent(table.id);
  const encodedRestaurantId = encodeURIComponent(table.restaurantId || '');
  let orderUrl = `${baseUrl}/order/${encodedTableId}?restaurantId=${encodedRestaurantId}`;
  if (table.isDynamicQR && table.qrToken) {
    orderUrl += `&token=${encodeURIComponent(table.qrToken)}`;
  }

  return (
    <ReactQRCode
      value={orderUrl}
      size={150}
      level="H"
      bgColor={settings.qrCodeBackgroundColor || "#FFFFFF"}
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
