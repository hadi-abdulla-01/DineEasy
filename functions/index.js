// Firebase Cloud Function to send push notifications when new orders are created
// Deploy this to Firebase Functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendOrderNotification = functions.firestore
    .document('restaurants/{restaurantId}/orders/{orderId}')
    .onCreate(async (snap, context) => {
        const order = snap.data();
        const restaurantId = context.params.restaurantId;
        const orderId = context.params.orderId;

        console.log('📦 New order created:', orderId);
        console.log('🏢 Restaurant:', restaurantId);
        console.log('🏪 Branch:', order.branchId);

        // Only send notification for new orders (status: received)
        if (order.status !== 'received') {
            console.log('⏭️ Skipping notification - order status is not "received"');
            return null;
        }

        try {
            // Get all FCM tokens for this branch
            const tokensSnapshot = await admin.firestore()
                .collection('restaurants')
                .doc(restaurantId)
                .collection('fcmTokens')
                .where('branchId', '==', order.branchId)
                .get();

            if (tokensSnapshot.empty) {
                console.log('⚠️ No FCM tokens found for branch:', order.branchId);
                return null;
            }

            const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
            console.log(`📱 Found ${tokens.length} device(s) to notify`);

            // Prepare notification message
            const message = {
                notification: {
                    title: `🍽️ New Order - ${order.orderType}`,
                    body: `${order.customerName} - ${order.items?.length || 0} items`,
                },
                data: {
                    orderId: orderId,
                    branchId: order.branchId || '',
                    orderType: order.orderType || '',
                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                },
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'kitchen_orders',
                        sound: 'default',
                        priority: 'high',
                        defaultSound: true,
                        defaultVibrateTimings: true,
                    },
                },
            };

            // Send to all tokens
            const response = await admin.messaging().sendEachForMulticast({
                tokens: tokens,
                ...message,
            });

            console.log(`✅ Successfully sent ${response.successCount} notification(s)`);
            console.log(`❌ Failed to send ${response.failureCount} notification(s)`);

            // Clean up invalid tokens
            const tokensToDelete = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.log('❌ Failed to send to token:', tokens[idx].substring(0, 20) + '...');
                    console.log('Error:', resp.error);

                    // Remove invalid tokens
                    if (resp.error?.code === 'messaging/invalid-registration-token' ||
                        resp.error?.code === 'messaging/registration-token-not-registered') {
                        tokensToDelete.push(tokensSnapshot.docs[idx].ref.delete());
                    }
                }
            });

            if (tokensToDelete.length > 0) {
                await Promise.all(tokensToDelete);
                console.log(`🗑️ Deleted ${tokensToDelete.length} invalid token(s)`);
            }

            return response;
        } catch (error) {
            console.error('❌ Error sending notification:', error);
            return null;
        }
    });

// Also handle remote orders
exports.sendRemoteOrderNotification = functions.firestore
    .document('restaurants/{restaurantId}/remoteOrders/{orderId}')
    .onCreate(async (snap, context) => {
        const order = snap.data();
        const restaurantId = context.params.restaurantId;
        const orderId = context.params.orderId;

        console.log('📦 New remote order created:', orderId);

        if (order.status !== 'received') {
            return null;
        }

        try {
            const tokensSnapshot = await admin.firestore()
                .collection('restaurants')
                .doc(restaurantId)
                .collection('fcmTokens')
                .where('branchId', '==', order.branchId)
                .get();

            if (tokensSnapshot.empty) {
                console.log('⚠️ No FCM tokens found');
                return null;
            }

            const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

            const message = {
                notification: {
                    title: `🍽️ New ${order.orderType} Order`,
                    body: `${order.customerName} - ${order.items?.length || 0} items`,
                },
                data: {
                    orderId: orderId,
                    branchId: order.branchId || '',
                    orderType: order.orderType || '',
                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                },
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'kitchen_orders',
                        sound: 'default',
                    },
                },
            };

            const response = await admin.messaging().sendEachForMulticast({
                tokens: tokens,
                ...message,
            });

            console.log(`✅ Sent ${response.successCount} notification(s)`);
            return response;
        } catch (error) {
            console.error('❌ Error:', error);
            return null;
        }
    });
