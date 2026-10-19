
'use client';
import React from 'react';
import ReactQRCode from 'qrcode.react';
import type { RestaurantSettings, Table } from '@/lib/definitions';

// Resolve base URL once synchronously — avoids skeleton flash on every mount
const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

export function QRCode({ table, settings }: { table: Table, settings: RestaurantSettings | null }) {
  if (!baseUrl || !settings) {
    return <div className="h-[150px] w-[150px] bg-muted animate-pulse rounded-md" />;
  }

  let orderUrl = `${baseUrl}/order/${table.id}?restaurantId=${table.restaurantId}`;
  if (table.isDynamicQR && table.qrToken) {
    orderUrl += `&token=${table.qrToken}`;
  }

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
