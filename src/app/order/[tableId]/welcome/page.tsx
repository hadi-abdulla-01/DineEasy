'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/logo';
import { requestOrderAccessAction } from '@/lib/actions';
import { LoaderCircle } from 'lucide-react';

export default function WelcomePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const tableId = params.tableId as string;
    const restaurantId = searchParams.get('restaurantId') || '';
    const token = searchParams.get('token'); // null when absent

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Guard against double-submit
    const isSubmitting = useRef(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isSubmitting.current) return;
        if (!customerName.trim() || !customerPhone.trim()) {
            setError('Name and phone number are required.');
            return;
        }

        isSubmitting.current = true;
        setIsPending(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.set('tableId', tableId);
            formData.set('restaurantId', restaurantId);
            formData.set('customerName', customerName.trim());
            formData.set('customerPhone', customerPhone.trim());
            if (token) formData.set('token', token);

            const result = await requestOrderAccessAction(null, formData);

            if (result?.error) {
                setError(result.error);
                isSubmitting.current = false;
                setIsPending(false);
                return;
            }

            // Save customer info to session storage
            sessionStorage.setItem(
                `dineeasy-customer-${tableId}`,
                JSON.stringify({ name: customerName.trim(), phone: customerPhone.trim() })
            );

            if (result?.redirectTo) {
                router.push(result.redirectTo);
            } else if (result?.success) {
                router.push(`/order/${tableId}?restaurantId=${restaurantId}${token ? `&token=${token}` : ''}`);
            }
        } catch (err: any) {
            setError(err?.message || 'An unexpected error occurred.');
            isSubmitting.current = false;
            setIsPending(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="items-center text-center">
                    <Logo className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="font-headline text-2xl">Welcome!</CardTitle>
                    <CardDescription>Please enter your details to start your order.</CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className={`text-sm text-center p-3 rounded-md ${
                                error.toLowerCase().includes('expired')
                                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                    : 'text-destructive bg-destructive/10'
                            }`}>
                                {error.toLowerCase().includes('expired') && (
                                    <div className="font-semibold mb-1">⏱ QR Code Expired</div>
                                )}
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="e.g. 9876543210"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                required
                                disabled={isPending}
                            />
                        </div>
                    </CardContent>

                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending
                                ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Please wait...</>
                                : 'Start Order'
                            }
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
