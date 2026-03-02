'use client';

import { useState, useEffect, useActionState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/logo';
import { requestOrderAccessAction } from '@/lib/actions';

type ActionState = {
    error?: string;
    redirectTo?: string;
    success?: boolean;
} | null;

export default function WelcomePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const tableId = params.tableId as string;
    const restaurantId = searchParams.get('restaurantId') || '';
    const token = searchParams.get('token') || '';

    // State for the form inputs
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const [actionState, formAction] = useActionState<ActionState, FormData>(requestOrderAccessAction, null);

    useEffect(() => {
        if (actionState?.redirectTo) {
            // For existing orders, save session info FIRST, then redirect.
            sessionStorage.setItem(`dineeasy-customer-${tableId}`, JSON.stringify({ name: customerName, phone: customerPhone }));
            router.push(actionState.redirectTo);
        } else if (actionState?.success) {
            // For new orders (non-OTP flow), save session info and redirect to order page.
            sessionStorage.setItem(`dineeasy-customer-${tableId}`, JSON.stringify({ name: customerName, phone: customerPhone }));
            router.push(`/order/${tableId}?restaurantId=${restaurantId}`);
        }
    }, [actionState, router, tableId, restaurantId, customerName, customerPhone]);
    
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-sm">
                 <CardHeader className="items-center text-center">
                    <Logo className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="font-headline text-2xl">
                        Welcome!
                    </CardTitle>
                    <CardDescription>
                        Please enter your details to start your order.
                    </CardDescription>
                </CardHeader>
                
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="tableId" value={tableId} />
                        <input type="hidden" name="restaurantId" value={restaurantId} />
                        <input type="hidden" name="token" value={token} />

                        {actionState?.error && (
                             <p className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-md">{actionState.error}</p>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="customerName"
                                placeholder="John Doe"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                name="customerPhone"
                                type="tel"
                                placeholder="e.g. 555-123-4567"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">
                            Start Order
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
