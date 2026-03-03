
'use client';

import { useEffect, useRef } from 'react';

// A silent placeholder data URI for when no sound is selected or available.
const SILENT_SOUND = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABgAAABkYXRhAAAAAA==';

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
            // Use the provided sound URL, or the silent sound if the URL is empty/undefined.
            const url = soundUrl || SILENT_SOUND;
            
            // Only create a new Audio object if the URL has changed or it doesn't exist
            if (!audioRef.current || audioRef.current.src !== url) {
                audioRef.current = new Audio(url);
                audioRef.current.preload = 'auto';
            }
        }
    }, [soundUrl]);

    // Effect to play the sound when orderCount increases.
    useEffect(() => {
        if (isEnabled && orderCount > prevOrderCountRef.current && audioRef.current && audioRef.current.src !== SILENT_SOUND) {
            audioRef.current.play().catch(error => {
                // Autoplay can be blocked by browsers. Log the error for debugging.
                console.error("Audio playback error:", error);
            });
        }
        // Update the previous order count for the next comparison.
        prevOrderCountRef.current = orderCount;
    }, [orderCount, isEnabled]);
};
