'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/logo';
import { requestPhoneVerificationAction } from '@/lib/actions';
import { sendPhoneOTP, clearVerificationState } from '@/firebase/phone-auth';
import { LoaderCircle, ChevronDown } from 'lucide-react';

export default function WelcomePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const tableId = params.tableId as string;
    const restaurantId = searchParams.get('restaurantId') || '';
    const token = searchParams.get('token'); // null when absent

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCountrySelector, setShowCountrySelector] = useState(false);
    // Guard against double-submit
    const isSubmitting = useRef(false);

    // Common country codes
    const countryCodes = [
        { code: '+91', name: 'India', flag: '🇮🇳' },
        { code: '+1', name: 'USA', flag: '🇺🇸' },
        { code: '+44', name: 'UK', flag: '🇬🇧' },
        { code: '+61', name: 'Australia', flag: '🇦🇺' },
        { code: '+81', name: 'Japan', flag: '🇯🇵' },
        { code: '+86', name: 'China', flag: '🇨🇳' },
        { code: '+971', name: 'UAE', flag: '🇦🇪' },
        { code: '+65', name: 'Singapore', flag: '🇸🇬' },
    ];

    // Clear verification state on mount
    useEffect(() => {
        clearVerificationState();
    }, []);

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
            // Format phone number with country code
            let phoneNumber = customerPhone.trim();
            
            // Remove any leading zeros or spaces
            phoneNumber = phoneNumber.replace(/^0+/, '').replace(/\s+/g, '');
            
            // Combine with country code
            const fullPhoneNumber = countryCode + phoneNumber;

            // First, create the verification request on the server
            const formData = new FormData();
            formData.set('tableId', tableId);
            formData.set('restaurantId', restaurantId);
            formData.set('customerName', customerName.trim());
            formData.set('customerPhone', fullPhoneNumber);
            if (token) formData.set('token', token);

            const result = await requestPhoneVerificationAction(null, formData);

            if (result?.error) {
                setError(result.error);
                isSubmitting.current = false;
                setIsPending(false);
                return;
            }

            // Now send OTP via Firebase Phone Auth client SDK
            // This will actually send the SMS
            const confirmationResult = await sendPhoneOTP(fullPhoneNumber);

            // Save customer info and verification state to session storage
            sessionStorage.setItem(
                `dineeasy-customer-${tableId}`,
                JSON.stringify({ 
                    name: customerName.trim(), 
                    phone: fullPhoneNumber,
                    verificationId: confirmationResult.verificationId,
                    serverVerificationId: result.verificationId // Server-side tracking
                })
            );

            // Redirect to phone verification page
            const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
            router.push(`/order/${tableId}/verify-phone?restaurantId=${restaurantId}&name=${encodeURIComponent(customerName.trim())}&phone=${encodeURIComponent(fullPhoneNumber)}&countryCode=${encodeURIComponent(countryCode)}&verificationId=${encodeURIComponent(confirmationResult.verificationId)}${tokenParam}`);

        } catch (err: any) {
            setError(err?.message || 'An unexpected error occurred.');
            isSubmitting.current = false;
            setIsPending(false);
        }
    };

    const selectedCountry = countryCodes.find(c => c.code === countryCode);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="items-center text-center">
                    <Logo className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="font-headline text-2xl">Welcome!</CardTitle>
                    <CardDescription>Enter your details to receive an OTP via SMS</CardDescription>
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
                                    <div className="font-semibold mb-1">QR Code Expired</div>
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
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-24 justify-between"
                                    onClick={() => setShowCountrySelector(!showCountrySelector)}
                                    disabled={isPending}
                                >
                                    <span>{selectedCountry?.flag} {selectedCountry?.code}</span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="9876543210"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    required
                                    disabled={isPending}
                                    className="flex-1"
                                />
                            </div>
                            {showCountrySelector && (
                                <div className="border rounded-md mt-1 p-1 bg-background">
                                    {countryCodes.map((country) => (
                                        <button
                                            key={country.code}
                                            type="button"
                                            onClick={() => {
                                                setCountryCode(country.code);
                                                setShowCountrySelector(false);
                                            }}
                                            className="w-full text-left p-2 hover:bg-muted rounded text-sm flex items-center gap-2"
                                        >
                                            <span>{country.flag}</span>
                                            <span>{country.name}</span>
                                            <span className="text-muted-foreground">{country.code}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                We will send an OTP to this number via SMS
                            </p>
                        </div>
                    </CardContent>

                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending
                                ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...</>
                                : 'Send OTP via SMS'
                            }
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Invisible reCAPTCHA container */}
            <div id="recaptcha-container"></div>
        </div>
    );
}
