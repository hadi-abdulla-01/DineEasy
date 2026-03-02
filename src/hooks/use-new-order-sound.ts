
'use client';

import { useEffect, useRef } from 'react';

// A simple, publicly available notification sound
const NOTIFICATION_SOUND_URL = 'https://cdn.freesound.org/previews/573/573381_7021649-lq.mp3';

/**
 * A hook to play a sound when the number of orders increases.
 * @param orderCount The current number of orders.
 * @param isEnabled A boolean to enable or disable the sound.
 */
export const useNewOrderSound = (orderCount: number, isEnabled: boolean) => {
    const prevOrderCountRef = useRef(orderCount);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Effect to initialize the Audio object.
    // This runs only once when the component mounts.
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
            audioRef.current.preload = 'auto'; // Preload the audio file for faster playback
        }
    }, []);

    // Effect to play the sound when orderCount increases.
    // This runs whenever orderCount or isEnabled changes.
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
