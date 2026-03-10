
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/admin/auth-provider';
import { useRestaurantData } from '@/lib/client-data';
import type { RestaurantSettings, SubscriptionPlan } from '@/lib/definitions';
import { getSubscriptionPlans } from '@/lib/server-actions';
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

    const currentPlan = plans.find(p => p.id === settings?.subscriptionPlanId);
    const daysRemaining = settings?.nextBillingDate ? Math.max(0, Math.ceil((new Date(settings.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null;


    if (isLoading) {
        return <div className="flex h-64 items-center justify-center"><LoaderCircle className="animate-spin" /></div>;
    }
    
    return (
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
                             disabled
                           >
                            Contact Admin to Upgrade
                           </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default SubscriptionPage;
