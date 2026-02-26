
'use server';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp, getAdminMessaging } from '@/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        const { restaurantId, branchId, order } = await request.json();

        console.log('📦 Sending notification for order:', order.id);
        console.log('🏢 Restaurant:', restaurantId);
        console.log('🏪 Branch:', branchId);

        const messaging = getAdminMessaging();
        if (!messaging) {
            throw new Error("Firebase Admin Messaging SDK not initialized.");
        }
        const adminApp = getAdminApp();
        const firestore = getFirestore(adminApp);


        // Get FCM tokens for this branch
        const tokensSnapshot = await firestore
            .collection('restaurants')
            .doc(restaurantId)
            .collection('fcmTokens')
            .where('branchId', '==', branchId)
            .get();

        if (tokensSnapshot.empty) {
            console.log('⚠️ No devices to notify for branch:', branchId);
            return NextResponse.json({
                success: false,
                message: 'No devices to notify'
            });
        }

        const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
        console.log(`📱 Sending to ${tokens.length} device(s)`);

        // Send FCM notification with high priority for heads-up display
        const message = {
            notification: {
                title: `🍽️ New Order - ${order.orderType}`,
                body: `${order.customerName} - ${order.items?.length || 0} items`,
            },
            data: {
                orderId: order.id,
                branchId: branchId,
                orderType: order.orderType || '',
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            android: {
                priority: 'high' as const,
                notification: {
                    channelId: 'kitchen_orders',
                    sound: 'default',
                    priority: 'max' as const,  // Maximum priority for heads-up notification
                    defaultSound: true,
                    defaultVibrateTimings: true,
                    visibility: 'public' as const,  // Show on lock screen
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };

        const response = await messaging.sendEachForMulticast({
            tokens: tokens,
            ...message,
        });

        console.log(`✅ Sent ${response.successCount} notification(s)`);
        console.log(`❌ Failed ${response.failureCount} notification(s)`);

        // Clean up invalid tokens
        const tokensToDelete: Promise<any>[] = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                const errorCode = (resp.error as any)?.code;
                if (errorCode === 'messaging/invalid-registration-token' ||
                    errorCode === 'messaging/registration-token-not-registered') {
                    tokensToDelete.push(tokensSnapshot.docs[idx].ref.delete());
                }
            }
        });

        if (tokensToDelete.length > 0) {
            await Promise.all(tokensToDelete);
            console.log(`🗑️ Deleted ${tokensToDelete.length} invalid token(s)`);
        }

        return NextResponse.json({
            success: true,
            sent: response.successCount,
            failed: response.failureCount
        });

    } catch (error) {
        console.error('❌ Error sending notification:', error);
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
