

'use client';

import { Suspense, useActionState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/logo';
import { verifyOtpAction } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, LoaderCircle } from 'lucide-react';


type ActionState = {
  error?: string;
  success?: boolean;
  message?: string;
} | null;

function VerifyOTPForm() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [actionState, formAction, isPending] = useActionState<ActionState, FormData>(verifyOtpAction, null);

    const tableId = params.tableId as string;
    const reqId = searchParams.get('reqId');
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    const restaurantId = searchParams.get('restaurantId');
    
    useEffect(() => {
      if (actionState?.success) {
        setTimeout(() => {
            if (name && phone) {
                sessionStorage.setItem(`dineeasy-customer-${tableId}`, JSON.stringify({ name, phone }));
                router.push(`/order/${tableId}?restaurantId=${restaurantId}`);
            } else {
                // This case should not happen if the flow is correct
                console.error("Missing name or phone for session storage after OTP verification.");
                router.push(`/order/${tableId}/welcome?restaurantId=${restaurantId}`);
            }
        }, 1500); // 1.5 seconds to show the success message before redirecting
      }
    }, [actionState, router, tableId, restaurantId, name, phone]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="items-center text-center">
                    <Logo className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="font-headline text-2xl">
                        Enter OTP
                    </CardTitle>
                    <CardDescription>
                        Please ask a staff member for the 4-digit code sent to their device.
                    </CardDescription>
                </CardHeader>
                
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="reqId" value={reqId || ''} />
                        <input type="hidden" name="tableId" value={tableId} />
                        <input type="hidden" name="customerName" value={name || ''} />
                        <input type="hidden" name="customerPhone" value={phone || ''} />
                        <input type="hidden" name="restaurantId" value={restaurantId || ''} />
                        
                        {actionState?.error && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{actionState.error}</AlertDescription>
                            </Alert>
                        )}
                        {actionState?.success && (
                            <Alert className="border-green-500/50 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                <CheckCircle className="h-4 w-4 !text-green-600" />
                                <AlertTitle>Success!</AlertTitle>
                                <AlertDescription>{actionState.message || 'OTP Verified Successfully!'}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="otp">4-Digit Code</Label>
                            <Input
                                id="otp"
                                name="otp"
                                type="text"
                                maxLength={4}
                                placeholder="_ _ _ _"
                                className="text-center text-2xl tracking-[1.5rem] font-mono"
                                required
                                disabled={isPending || actionState?.success}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isPending || actionState?.success}>
                            {isPending ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> Verifying...</> : (actionState?.success ? 'Redirecting...' : 'Verify & Continue')}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyOTPForm />
        </Suspense>
    )
}
