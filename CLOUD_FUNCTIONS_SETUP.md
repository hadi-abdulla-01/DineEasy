# Firebase Cloud Functions Setup - Push Notifications

## 🎯 Purpose

Enable push notifications even when the Flutter app is **completely closed** by sending FCM messages from the server when new orders are created.

## 📦 What's Included

- `functions/index.js` - Cloud Function that sends FCM notifications
- `functions/package.json` - Dependencies

## 🚀 Deployment Steps

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Initialize Firebase (if not already done)

```bash
cd "c:\Users\ACER\Downloads\DineEasy latest\DineEasy-main"
firebase init functions
```

**Select:**
- Use an existing project → Select your Firebase project
- Language → JavaScript
- ESLint → No (or Yes, your choice)
- Install dependencies → Yes

### Step 4: Install Dependencies

```bash
cd functions
npm install
```

### Step 5: Deploy Functions

```bash
firebase deploy --only functions
```

This will deploy:
- `sendOrderNotification` - Triggers when a new order is created
- `sendRemoteOrderNotification` - Triggers when a new remote order is created

## ✅ Verification

After deployment, you should see:

```
✔ functions[sendOrderNotification(us-central1)] Successful create operation.
✔ functions[sendRemoteOrderNotification(us-central1)] Successful create operation.

✔ Deploy complete!
```

## 🧪 Testing

### Test 1: App Completely Closed

1. **Close the Flutter app** (swipe from recent apps)
2. **Create a new order** from the web app
3. **Wait 2-3 seconds**
4. **You should receive a push notification!** 📱🔔

### Test 2: Check Function Logs

```bash
firebase functions:log
```

You should see:
```
📦 New order created: order_xxx
🏢 Restaurant: your_restaurant_id
🏪 Branch: branch_id
📱 Found 1 device(s) to notify
✅ Successfully sent 1 notification(s)
```

## 🔍 Troubleshooting

### Issue: "No FCM tokens found"

**Problem:** No devices registered for notifications

**Solution:**
1. Open the Flutter app
2. Login as kitchen user
3. Navigate to Kitchen Dashboard
4. Check Firestore: `restaurants/{id}/fcmTokens` should have documents

### Issue: "Permission denied"

**Problem:** Cloud Functions doesn't have permission to send FCM

**Solution:**
Firebase Functions automatically have FCM permissions. If you see this error, check your Firebase project settings.

### Issue: Notifications not received

**Check:**
1. **Function deployed?** Run `firebase functions:list`
2. **Function triggered?** Check logs: `firebase functions:log`
3. **FCM token valid?** Check Firestore `fcmTokens` collection
4. **Device has internet?** FCM requires internet connection

## 📊 How It Works

```
New Order Created in Firestore
    ↓
Cloud Function Triggered (onCreate)
    ↓
Function fetches FCM tokens for that branch
    ↓
Function sends FCM push notification
    ↓
FCM delivers to device (even if app closed)
    ↓
User receives notification
    ↓
User taps notification
    ↓
App opens to Kitchen Dashboard
```

## 💰 Cost

Firebase Cloud Functions pricing:
- **Free tier**: 2 million invocations/month
- **After free tier**: $0.40 per million invocations

For a typical restaurant:
- ~100 orders/day = 3,000 orders/month
- Well within free tier! ✅

## 🔐 Security

The Cloud Function:
- ✅ Runs server-side (secure)
- ✅ Uses Firebase Admin SDK (full permissions)
- ✅ Validates order status before sending
- ✅ Only sends to devices in the same branch
- ✅ Automatically cleans up invalid tokens

## 🎛️ Customization

### Change Notification Title/Body

Edit `functions/index.js`:

```javascript
const message = {
  notification: {
    title: `🍽️ New Order - ${order.orderType}`,  // ← Change this
    body: `${order.customerName} - ${order.items?.length || 0} items`,  // ← Change this
  },
  // ...
};
```

### Add Sound/Vibration

Already configured! The notification uses:
- Default sound
- Default vibration
- High priority

### Send to Multiple Branches

The function already filters by `branchId`. To send to all branches, remove the `.where()` clause:

```javascript
// Send to all devices in restaurant (all branches)
const tokensSnapshot = await admin.firestore()
  .collection('restaurants')
  .doc(restaurantId)
  .collection('fcmTokens')
  // .where('branchId', '==', order.branchId)  // ← Remove this line
  .get();
```

## 📝 Maintenance

### View Function Logs

```bash
firebase functions:log --only sendOrderNotification
```

### Update Function

1. Edit `functions/index.js`
2. Run `firebase deploy --only functions`

### Delete Function

```bash
firebase functions:delete sendOrderNotification
firebase functions:delete sendRemoteOrderNotification
```

## 🎉 Success Criteria

After deployment, you should be able to:

✅ Receive notifications when app is open
✅ Receive notifications when app is minimized
✅ **Receive notifications when app is completely closed** ← NEW!
✅ Tap notification to open app
✅ See notification in device notification tray

---

## 🚀 Quick Deploy

```bash
cd "c:\Users\ACER\Downloads\DineEasy latest\DineEasy-main\functions"
npm install
cd ..
firebase deploy --only functions
```

**That's it!** Your push notifications will now work even when the app is completely closed! 🎉📱🔔
