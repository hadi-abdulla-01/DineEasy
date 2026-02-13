
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/admin/auth-provider';
import { useRestaurantData } from '@/lib/client-data';
import type { RestaurantSettings, SubscriptionPlan } from '@/lib/definitions';
import { getSubscriptionPlans, createRazorpayOrderAction } from '@/lib/server-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, LoaderCircle, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Script from 'next/script';


function SubscriptionPage() {
    const { user } = useAuth();
    const { getSettings, restaurantId } = useRestaurantData();
    const { toast } = useToast();
    
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState<string | null>(null); // planId being paid for

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (user?.branchId) {
                const [fetchedSettings, fetchedPlans] = await Promise.all([
                    getSettings(user.branchId),
                    getSubscriptionPlans()
                ]);
                setSettings(fetchedSettings);
                setPlans(fetchedPlans);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load subscription data.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.branchId) {
            loadData();
        }
    }, [user]);

    const getCurrencySymbol = (currency: string | undefined) => {
        if (currency === 'USD') return '$';
        if (currency === 'INR') return '₹';
        if (currency === 'EUR') return '€';
        return currency ? `${currency} ` : '$';
    };

    const handlePayment = async (plan: SubscriptionPlan) => {
        if (!user || !user.branchId) return;
        setIsPaying(plan.id);

        try {
            const order = await createRazorpayOrderAction(plan.id, restaurantId, user.branchId);
            
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
                amount: order.amount,
                currency: order.currency,
                name: "DineEzee Subscription",
                description: `Payment for ${plan.name}`,
                order_id: order.id,
                handler: function (response: any) {
                    toast({
                        title: "Payment Successful!",
                        description: "Your subscription will be updated shortly. Payment ID: " + response.razorpay_payment_id,
                    });
                    // The actual subscription update is handled by the webhook.
                    // We can optimistically update the UI here or just let the user know.
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                },
                prefill: {
                    name: user.username,
                    email: user.email,
                },
                notes: {
                    restaurantId: restaurantId,
                    planId: plan.id,
                },
                theme: {
                    color: "#CB1E1D"
                }
            };
            
            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any){
                toast({
                    variant: 'destructive',
                    title: 'Payment Failed',
                    description: response.error.description,
                });
            });
            rzp.open();

        } catch (error) {
            if (error instanceof Error) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        } finally {
            setIsPaying(null);
        }
    };

    const currentPlan = plans.find(p => p.id === settings?.subscriptionPlanId);
    const daysRemaining = settings?.nextBillingDate ? Math.max(0, Math.ceil((new Date(settings.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null;


    if (isLoading) {
        return <div className="flex h-64 items-center justify-center"><LoaderCircle className="animate-spin" /></div>;
    }
    
    return (
        <>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <div className="space-y-8">
            <h1 className="text-3xl font-headline font-bold">Subscription & Billing</h1>

            {currentPlan && settings?.nextBillingDate && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Star className="text-primary"/> Your Current Plan: {currentPlan.name}
                        </CardTitle>
                        <CardDescription>
                            {daysRemaining !== null ? (
                                `Your plan renews in ${daysRemaining} day(s) on ${format(new Date(settings.nextBillingDate), 'PPP')}.`
                            ) : (
                                'Your plan details are below.'
                            )}
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <Card key={plan.id} className={cn("flex flex-col", plan.id === currentPlan?.id && "border-primary ring-2 ring-primary")}>
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription className="h-10">{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <p className="text-4xl font-bold">
                                {getCurrencySymbol(plan.currency)}{(plan.price / 100).toFixed(2)}
                                <span className="text-sm font-normal text-muted-foreground">/month</span>
                            </p>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Up to {plan.maxUsers} users</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Up to {plan.maxMenuItems} menu items</li>
                            </ul>
                        </CardContent>
                        <div className="p-6 pt-0">
                           <Button 
                             className="w-full"
                             onClick={() => handlePayment(plan)}
                             disabled={isPaying !== null}
                           >
                             {isPaying === plan.id ? <LoaderCircle className="animate-spin" /> : (plan.id === currentPlan?.id ? 'Renew / Extend' : 'Upgrade Plan')}
                           </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
        </>
    );
}

export default SubscriptionPage;
