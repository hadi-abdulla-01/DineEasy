import type { MealSession } from '../definitions';

/**
 * Check if current time falls within a session's time range
 * Handles sessions that cross midnight (e.g., 22:00 - 02:00)
 */
export function isTimeInSession(session: MealSession, currentTime?: Date): boolean {
    if (!session.isActive) return false;

    const now = currentTime || new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = session.startTime.split(':').map(Number);
    const [endHour, endMin] = session.endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Handle sessions that cross midnight
    if (endMinutes < startMinutes) {
        // Session crosses midnight (e.g., 22:00 - 02:00)
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
        // Normal session within same day
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
}

/**
 * Get current active session from a list of sessions
 * Returns the first matching session if multiple overlap
 */
export function getCurrentActiveSession(sessions: MealSession[], currentTime?: Date): MealSession | null {
    if (!sessions || sessions.length === 0) return null;

    const activeSession = sessions.find(session => isTimeInSession(session, currentTime));
    return activeSession || null;
}

/**
 * Format time for display (HH:MM 24-hour to 12-hour format)
 */
export function formatSessionTime(time: string): string {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

/**
 * Validate session time range
 * Returns true if the time format is valid (HH:MM)
 */
export function validateSessionTimeRange(startTime: string, endTime: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return false;
    }

    return true;
}

/**
 * Get greeting based on current session or time
 */
export function getGreetingForSession(session: MealSession | null): string {
    if (session?.greeting) {
        return session.greeting;
    }

    // Fallback to time-based greeting if no session
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}

/**
 * Get display message for current session
 */
export function getDisplayMessageForSession(session: MealSession | null): string {
    if (session?.displayMessage) {
        return session.displayMessage;
    }

    // Fallback messages
    const hour = new Date().getHours();
    if (hour < 12) return "Rise and shine! It's breakfast time";
    if (hour < 17) return "Enjoy your lunch!";
    return "Dinner is served!";
}

/**
 * Check if a menu item is available in the current session
 * Items with no assigned sessions are available at all times
 */
export function isMenuItemAvailableInSession(
    itemSessions: string[] | undefined,
    currentSessionId: string | null
): boolean {
    // If item has no sessions assigned, it's available at all times
    if (!itemSessions || itemSessions.length === 0) {
        return true;
    }

    // If no current session, item is not available
    if (!currentSessionId) {
        return false;
    }

    // Check if current session is in the item's available sessions
    return itemSessions.includes(currentSessionId);
}
