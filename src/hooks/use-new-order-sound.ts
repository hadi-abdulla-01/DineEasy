
'use client';

import { useEffect, useRef } from 'react';

const DEFAULT_SOUND_URL = 'https://archive.org/download/sound-effects-for-commercial-productions/DINNER%20BELL.mp3';

/**
 * A hook to play a sound when the number of orders increases.
 * @param orderCount The current number of orders.
 * @param isEnabled A boolean to enable or disable the sound.
 * @param soundUrl Optional URL for the sound to be played.
 */
export const useNewOrderSound = (orderCount: number, isEnabled: boolean, soundUrl?: string) => {
    const prevOrderCountRef = useRef(orderCount);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Effect to initialize or update the Audio object whenever the soundUrl changes.
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const url = soundUrl || DEFAULT_SOUND_URL;
            // Only create a new Audio object if the URL has changed or it doesn't exist
            if (!audioRef.current || audioRef.current.src !== url) {
                audioRef.current = new Audio(url);
                audioRef.current.preload = 'auto';
            }
        }
    }, [soundUrl]);

    // Effect to play the sound when orderCount increases.
    useEffect(() => {
        if (isEnabled && orderCount > prevOrderCountRef.current) {
            audioRef.current?.play().catch(error => {
                // Autoplay can be blocked by browsers. Log the error for debugging.
                console.error("Audio playback error:", error);
            });
        }
        // Update the previous order count for the next comparison.
        prevOrderCountRef.current = orderCount;
    }, [orderCount, isEnabled]);
};
