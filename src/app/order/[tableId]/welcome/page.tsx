
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getTableById } from '@/lib/data';
import { LoaderCircle } from 'lucide-react';
import Logo from '@/components/logo';

export default function WelcomePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const tableId = params.tableId as string;
    
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [tableNumber, setTableNumber] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (tableId) {
            getTableById(tableId).then(table => {
                if (table) {
                    setTableNumber(table.number);
                }
                setIsLoading(false);
            });
        }
    }, [tableId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone) {
            setError('Please enter both your name and phone number.');
            return;
        }

        // Store customer info in session storage
        const customerInfo = { name, phone };
        sessionStorage.setItem(`dineeasy-customer-${tableId}`, JSON.stringify(customerInfo));

        // Redirect to the main order page for that table
        const nextUrl = searchParams.get('next');
        if (nextUrl) {
             router.push(nextUrl);
        } else {
            router.push(`/order/${tableId}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                 <div className="flex flex-col items-center gap-2">
                    <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading table information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-sm">
                 <CardHeader className="items-center text-center">
                    <Logo className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="font-headline text-2xl">Welcome to Table {tableNumber}</CardTitle>
                    <CardDescription>Please enter your details to start your order.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. 555-123-4567"
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
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
