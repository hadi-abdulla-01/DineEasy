'use client';

import { useEffect, useRef } from 'react';
import { autoRotateQRTokenAction } from '@/lib/actions';

interface QRCountdownBarProps {
    /** Unix ms timestamp when the current token expires */
    expiresAt: number;
    tableId: string;
    restaurantId: string;
    /** Called when the countdown reaches zero (display page uses this to trigger rotate) */
    onExpire?: () => void;
}

/**
 * Instagram / WhatsApp stories-style countdown bar.
 * Drives the bar width directly via DOM ref — no React state updates per frame,
 * so the animation is always smooth with no batching jitter.
 */
export function QRCountdownBar({ expiresAt, tableId, restaurantId, onExpire }: QRCountdownBarProps) {
    const barRef = useRef<HTMLDivElement>(null);
    const labelRef = useRef<HTMLSpanElement>(null);
    const colorRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);
    const isRotatingRef = useRef(false);

    useEffect(() => {
        isRotatingRef.current = false;

        const rotate = async () => {
            if (isRotatingRef.current) return;
            isRotatingRef.current = true;
            if (onExpire) {
                onExpire();
            } else {
                await autoRotateQRTokenAction(tableId, restaurantId);
            }
        };

        const animate = () => {
            const now = Date.now();
            const total = expiresAt - (expiresAt - (expiresAt - now)); // = expiresAt - now conceptually
            // Calculate from a fixed start: full duration was whatever it was
            // We derive total from expiresAt relative to when we started
            const remaining = expiresAt - now;

            // We need total duration — store it once on mount
            return remaining;
        };

        // Capture total duration at mount time
        const mountRemaining = expiresAt - Date.now();
        const totalDuration = mountRemaining > 0 ? mountRemaining : 1;

        const tick = () => {
            const now = Date.now();
            const remaining = expiresAt - now;

            if (remaining <= 0) {
                // Snap to zero
                if (barRef.current) barRef.current.style.width = '0%';
                if (labelRef.current) labelRef.current.textContent = '0s';
                applyColor(0);
                rotate();
                return;
            }

            const pct = (remaining / totalDuration) * 100;
            const secs = Math.ceil(remaining / 1000);

            if (barRef.current) barRef.current.style.width = `${pct}%`;
            if (labelRef.current) labelRef.current.textContent = `${secs}s`;
            applyColor(pct);

            rafRef.current = requestAnimationFrame(tick);
        };

        const applyColor = (pct: number) => {
            const color = pct > 50 ? '#22c55e' : pct > 20 ? '#eab308' : '#ef4444';
            if (barRef.current) barRef.current.style.backgroundColor = color;
            if (colorRef.current) colorRef.current.style.color = color;
        };

        // Initialise immediately then start loop
        const initPct = Math.max(0, Math.min(100, (mountRemaining / totalDuration) * 100));
        if (barRef.current) {
            barRef.current.style.width = `${initPct}%`;
            barRef.current.style.transition = 'none';
        }
        applyColor(initPct);

        rafRef.current = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expiresAt, tableId, restaurantId]);

    return (
        <div className="w-full space-y-1">
            {/* Label row — colour driven by ref */}
            <div ref={colorRef} className="flex justify-between items-center text-xs font-semibold" style={{ color: '#22c55e' }}>
                <span>QR expires in</span>
                <span ref={labelRef}>...</span>
            </div>
            {/* Track */}
            <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                    ref={barRef}
                    className="h-full rounded-full"
                    style={{ width: '100%', backgroundColor: '#22c55e', transition: 'none' }}
                />
            </div>
        </div>
    );
}
