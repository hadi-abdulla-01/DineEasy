import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { processSubscriptionPayment } from '@/lib/server-actions';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    console.error('Razorpay webhook secret is not set.');
    return NextResponse.json({ status: 'error', message: 'Internal server configuration error.' }, { status: 500 });
  }
  
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(body);
  const digest = shasum.digest('hex');

  if (digest !== signature) {
    console.warn('Invalid Razorpay webhook signature.');
    return NextResponse.json({ status: 'error', message: 'Invalid signature.' }, { status: 400 });
  }

  // Signature is valid, process the event
  const event = JSON.parse(body);
  
  if (event.event === 'payment.captured') {
    const paymentEntity = event.payload.payment.entity;
    const orderId = paymentEntity.order_id;
    
    try {
        const order = await razorpay.orders.fetch(orderId);
        const { restaurantId, planId } = order.notes as { restaurantId: string; planId: string };
        
        if (restaurantId && planId) {
            const result = await processSubscriptionPayment(restaurantId, planId);
            if (result.success) {
                console.log(`Successfully processed subscription for restaurant: ${restaurantId}, plan: ${planId}`);
            } else {
                console.error(`Failed to process subscription update for restaurant ${restaurantId}: ${result.error}`);
            }
        } else {
            console.warn(`Webhook received for order ${orderId} but notes did not contain restaurantId or planId.`);
        }
    } catch (error) {
        console.error(`Error processing webhook for order ${orderId}:`, error);
        return NextResponse.json({ status: 'error', message: 'Failed to process order details.' }, { status: 500 });
    }
  }

  return NextResponse.json({ status: 'ok' });
}
