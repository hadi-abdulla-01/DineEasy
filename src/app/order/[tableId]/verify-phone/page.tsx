'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/logo';
import { verifyPhoneOTP, sendPhoneOTP, signOutPhoneAuth, clearVerificationState, setConfirmationResult } from '@/firebase/phone-auth';
import { verifyPhoneVerificationAction, requestPhoneVerificationAction, recordPhoneVerificationFailureAction } from '@/lib/actions';
import { getCustomerSessionStorage, setCustomerSessionStorage, clearCustomerSessionStorage } from '@/lib/customer-session-storage';
import { CustomerFormCardSkeleton } from '@/components/skeletons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, LoaderCircle, Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import { getAuth, ConfirmationResult, PhoneAuthProvider } from 'firebase/auth';
import { getClientFirebase } from '@/firebase/client';

type ActionState = {
    error?: string;
    success?: boolean;
    message?: string;
} | null;

// OTP input component for 6-digit code
function OTPInput({ 
    otp, 
    setOtp, 
    disabled 
}: { 
    otp: string; 
    setOtp: (value: string) => void; 
    disabled: boolean 
}) {
    const inputs = Array(6).fill(0);

    const handleChange = (index: number, value: string) => {
        if (disabled) return;
        
        // Only allow numeric input
        const numericValue = value.replace(/\D/g, '');
        
        if (numericValue.length === 0) {
            // Backspace - move to previous input
            const newOtp = otp.split('');
            newOtp[index] = '';
            setOtp(newOtp.join(''));
            
            if (index > 0) {
                const prevInput = document.getElementById(`otp-input-${index - 1}`);
                prevInput?.focus();
            }
        } else if (numericValue.length === 1) {
            // Single digit entered
            const newOtp = otp.split('');
            newOtp[index] = numericValue;
            setOtp(newOtp.join(''));
            
            // Move to next input
            if (index < 5) {
                const nextInput = document.getElementById(`otp-input-${index + 1}`);
                nextInput?.focus();
            }
        }
        // Ignore multiple characters
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            // Move to previous input on backspace when current is empty
            const prevInput = document.getElementById(`otp-input-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (disabled) return;
        
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        const numericData = pastedData.replace(/\D/g, '');
        
        if (numericData.length === 6) {
            setOtp(numericData);
        }
    };

    return (
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {inputs.map((_, index) => (
                <Input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={otp[index] || ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={disabled}
                    className="w-10 h-12 text-center text-xl font-mono tracking-wider"
                    autoComplete="one-time-code"
                />
            ))}
        </div>
    );
}

function VerifyPhoneForm() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const tableId = params.tableId as string;
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    const restaurantId = searchParams.get('restaurantId');
    const token = searchParams.get('token');
    const countryCode = searchParams.get('countryCode') || '+91';

    const [otp, setOtp] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [actionState, setActionState] = useState<ActionState>(null);
    const [resendCooldown, setResendCooldown] = useState(60);
    const [verificationId, setVerificationId] = useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    
    // Get stored verification ID from customer session storage
    useEffect(() => {
        const data = getCustomerSessionStorage(tableId);
        if (data) {
            if (data.verificationId) {
                setVerificationId(data.verificationId);
            }
            if (data.phone) {
                setPhoneNumber(data.phone);
            }
        }
        
        // Start resend cooldown timer
        const timer = setInterval(() => {
            setResendCooldown(prev => Math.max(0, prev - 1));
        }, 1000);
        
        return () => clearInterval(timer);
    }, [tableId]);

    // Auto-submit when 6 digits are entered
    useEffect(() => {
        if (otp.length === 6 && !isPending && !actionState) {
            handleVerify();
        }
    }, [otp, isPending, actionState]);

    // Format phone number for display
    const displayPhone = phone || phoneNumber;
    const formattedPhone = displayPhone ? `${countryCode} ${displayPhone.replace(countryCode, '')}` : '';

    // Restore confirmation result if we have a verification ID
    useEffect(() => {
        if (verificationId) {
            // We need to restore the confirmation result
            // This is tricky because Firebase doesn't provide a way to restore it
            // For now, we'll just store it in memory
            const { auth } = getClientFirebase();
            // The confirmation result is stored in the phone-auth module
            // We can try to restore it from sessionStorage
        }
    }, [verificationId]);

    const handleVerify = async () => {
        if (isPending) return;
        
        if (otp.length !== 6) {
            setActionState({ error: 'Please enter all 6 digits of the OTP.' });
            return;
        }

        setIsPending(true);
        setActionState(null);

        try {
            const data = getCustomerSessionStorage(tableId);
            let clientVerificationId: string | null = verificationId;
            let serverVerificationId: string | null = searchParams.get('verificationId');
            let phoneNumber: string = displayPhone || '';
            
            if (data) {
                clientVerificationId = data.verificationId || clientVerificationId;
                serverVerificationId = data.serverVerificationId || serverVerificationId;
                phoneNumber = data.phone || phoneNumber;
            }

            if (!serverVerificationId || !restaurantId) {
                setActionState({ error: 'Verification session not found. Please start over.' });
                setIsPending(false);
                return;
            }

            // 1. Verify OTP via Firebase Client SDK to obtain cryptographic ID token
            let authResult: { idToken: string; uid: string };
            try {
                authResult = await verifyPhoneOTP(phoneNumber, otp);
            } catch (otpErr: any) {
                // Record failed attempt on the server to prevent brute-force / abuse
                const failureState = await recordPhoneVerificationFailureAction(serverVerificationId, restaurantId);
                setActionState({
                    error: failureState.locked
                        ? (failureState.error || 'Too many incorrect OTP attempts. Please request a new OTP.')
                        : (otpErr?.message || 'Invalid or expired OTP. Please try again.')
                });
                setIsPending(false);
                return;
            }

            // 2. Authoritative backend verification of Firebase ID token + GuestSession activation
            const formData = new FormData();
            formData.set('verificationId', serverVerificationId);
            formData.set('idToken', authResult.idToken);
            formData.set('restaurantId', restaurantId);
            formData.set('tableId', tableId);

            const result = await verifyPhoneVerificationAction(null, formData);

            if (result?.error || !result?.success || !result?.guestSessionId) {
                setActionState({ error: result?.error || 'Verification failed. Please try again.' });
                setIsPending(false);
                return;
            }

            setCustomerSessionStorage(tableId, { 
                name: name || '', 
                phone: phoneNumber,
                verificationId: clientVerificationId,
                serverVerificationId,
                isVerified: true,
                verifiedAt: Date.now(),
                tempUserUid: result.tempUserUid || authResult.uid,
                guestSessionId: result.guestSessionId,
            });

            setActionState({ 
                success: true, 
                message: result.message || 'Phone verified successfully!' 
            });

            setTimeout(() => {
                const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
                router.push(`/order/${tableId}?restaurantId=${restaurantId}${tokenParam}`);
            }, 1200);
        } catch (err: any) {
            setActionState({ error: err?.message || 'An unexpected error occurred during verification.' });
        } finally {
            setIsPending(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || isPending) return;
        
        setIsPending(true);
        setActionState(null);
        
        try {
            const fullPhoneNumber = displayPhone || phoneNumber;
            if (!fullPhoneNumber || !restaurantId) {
                throw new Error('Phone number not found. Please start over.');
            }

            // Enforce server-side rate limits and create a new verification request
            const reqFormData = new FormData();
            reqFormData.set('tableId', tableId);
            reqFormData.set('restaurantId', restaurantId);
            reqFormData.set('customerName', name || 'Guest');
            reqFormData.set('customerPhone', fullPhoneNumber);
            if (token) reqFormData.set('token', token);

            const reqResult = await requestPhoneVerificationAction(null, reqFormData);
            if (reqResult?.error || !reqResult?.verificationId) {
                throw new Error(reqResult?.error || 'Failed to request a new OTP.');
            }
            
            // Resend using Firebase client SDK
            const confirmationResult = await sendPhoneOTP(fullPhoneNumber);
            
            const existingData = getCustomerSessionStorage(tableId) || {};
            
            setCustomerSessionStorage(tableId, { 
                ...existingData,
                phone: fullPhoneNumber,
                verificationId: confirmationResult.verificationId,
                serverVerificationId: reqResult.verificationId,
            });
            
            setVerificationId(confirmationResult.verificationId);
            setOtp('');
            setActionState({ message: 'New OTP sent successfully!' });
            setResendCooldown(60); // 60 second cooldown
            setConfirmationResult(confirmationResult);
            
        } catch (err: any) {
            setActionState({ error: err?.message || 'Failed to resend OTP.' });
        } finally {
            setIsPending(false);
        }
    };

    const handleChangePhone = () => {
        // Clear state and go back to welcome page
        clearVerificationState();
        clearCustomerSessionStorage(tableId);
        const tokenParam = token ? `&token=${token}` : '';
        router.push(`/order/${tableId}/welcome?restaurantId=${restaurantId}${tokenParam}`);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="items-center text-center">
                    <Logo className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="font-headline text-2xl">Verify Phone</CardTitle>
                    <CardDescription>
                        Enter the 6-digit OTP sent to {formattedPhone}
                    </CardDescription>
                </CardHeader>

                <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="tableId" value={tableId} />
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
                                <AlertDescription>{actionState.message || 'Phone verified!'}</AlertDescription>
                            </Alert>
                        )}
                        {actionState?.message && !actionState.error && !actionState.success && (
                            <Alert className="border-blue-500/50 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                <AlertDescription>{actionState.message}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="otp">6-Digit OTP</Label>
                            <OTPInput 
                                otp={otp} 
                                setOtp={setOtp} 
                                disabled={isPending || !!actionState?.success}
                            />
                        </div>

                        {resendCooldown > 0 && (
                            <p className="text-sm text-center text-muted-foreground">
                                Resend OTP in: {formatTime(resendCooldown)}
                            </p>
                        )}
                    </CardContent>

                    <CardFooter className="flex flex-col gap-2">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isPending || !!actionState?.success || otp.length < 6}
                        >
                            {isPending
                                ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                                : actionState?.success
                                    ? 'Redirecting...'
                                    : 'Verify & Continue'
                            }
                        </Button>

                        <div className="flex gap-2 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={handleResend}
                                disabled={resendCooldown > 0 || isPending}
                            >
                                {isPending ? (
                                    <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                                ) : (
                                    <><RefreshCw className="mr-2 h-4 w-4" /> Resend OTP</>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1"
                                onClick={handleChangePhone}
                                disabled={isPending}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" /> Change Phone
                            </Button>
                        </div>
                    </CardFooter>
                </form>
            </Card>

            {/* Invisible reCAPTCHA container */}
            <div id="recaptcha-container"></div>
        </div>
    );
}

export default function VerifyPhonePage() {
    return (
        <Suspense fallback={<CustomerFormCardSkeleton />}>
            <VerifyPhoneForm />
        </Suspense>
    );
}
