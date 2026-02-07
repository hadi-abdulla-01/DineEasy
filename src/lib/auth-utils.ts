/**
 * Authentication utility functions
 * These are client-safe helper functions
 */

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'your-email@gmail.com';

/**
 * Generate email format for users
 * Admin: admin@restaurantname.dineezee
 * Kitchen: username@restaurantname.dineezee
 */
export function generateUserEmail(username: string, restaurantId: string, isAdmin: boolean = false): string {
    const prefix = isAdmin ? 'admin' : username.toLowerCase().replace(/\s+/g, '_');
    return `${prefix}@${restaurantId}.dineezee`;
}

/**
 * Extract restaurant ID from email
 */
export function extractRestaurantId(email: string): string | null {
    const match = email.match(/@(.+)\.dineezee$/);
    return match ? match[1] : null;
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(email: string): boolean {
    return email === SUPER_ADMIN_EMAIL;
}
