import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/**
 * Format a date string in a specific timezone
 * @param dateString - ISO date string or Date object
 * @param formatStr - date-fns format string (e.g., 'PPpp', 'yyyy-MM-dd HH:mm:ss')
 * @param timezone - IANA timezone identifier (e.g., 'Asia/Kolkata', 'UTC')
 * @returns Formatted date string in the specified timezone
 */
export function formatInTimezone(
    dateString: string | Date,
    formatStr: string,
    timezone?: string
): string {
    if (!timezone) {
        timezone = 'UTC'; // Default to UTC if no timezone specified
    }

    try {
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        return formatInTimeZone(date, timezone, formatStr);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
}

/**
 * Format a date as relative time (e.g., "2 hours ago") in a specific timezone
 * @param dateString - ISO date string or Date object
 * @param timezone - IANA timezone identifier
 * @returns Formatted relative time string
 */
export function formatDistanceInTimezone(
    dateString: string | Date,
    timezone?: string
): string {
    try {
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;

        // Convert to the target timezone for accurate relative time
        const zonedDate = timezone ? toZonedTime(date, timezone) : date;

        return formatDistanceToNow(zonedDate, { addSuffix: true });
    } catch (error) {
        console.error('Error formatting distance:', error);
        return 'Invalid Date';
    }
}

/**
 * Convert a date to a specific timezone
 * @param dateString - ISO date string or Date object
 * @param timezone - IANA timezone identifier
 * @returns Date object in the specified timezone
 */
export function toTimezone(
    dateString: string | Date,
    timezone?: string
): Date {
    if (!timezone) {
        timezone = 'UTC';
    }

    try {
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        return toZonedTime(date, timezone);
    } catch (error) {
        console.error('Error converting to timezone:', error);
        return new Date();
    }
}

/**
 * Get current time in a specific timezone
 * @param timezone - IANA timezone identifier
 * @returns Current date/time in the specified timezone
 */
export function getCurrentTimeInTimezone(timezone?: string): Date {
    return toTimezone(new Date(), timezone);
}

/**
 * Common timezone options for the settings dropdown
 */
export const COMMON_TIMEZONES = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - Indian Standard Time)' },
    { value: 'America/New_York', label: 'America/New_York (EST/EDT - Eastern Time)' },
    { value: 'America/Chicago', label: 'America/Chicago (CST/CDT - Central Time)' },
    { value: 'America/Denver', label: 'America/Denver (MST/MDT - Mountain Time)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT - Pacific Time)' },
    { value: 'Europe/London', label: 'Europe/London (GMT/BST - British Time)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST - Central European Time)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GST - Gulf Standard Time)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST - Japan Standard Time)' },
    { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST - China Standard Time)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT - Singapore Time)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT/AEST - Australian Eastern Time)' },
    { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZDT/NZST - New Zealand Time)' },
] as const;
