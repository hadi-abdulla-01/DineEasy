
'use client';
import { useEffect, useState } from 'react';
import { updateKitchenUserAction } from '@/lib/actions';
import type { KitchenUser } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { notFound, useRouter } from 'next/navigation';
import { User, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/admin/auth-provider';
import { useToast } from '@/hooks/use-toast';

export default function EditProfilePage() {
    const { user: currentUser, login } = useAuth();
    const [user, setUser] = useState<KitchenUser | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (currentUser) {
            setUser(currentUser);
        }
    }, [currentUser]);

    const handleSubmit = async (formData: FormData) => {
        if (!user) return;

        const result = await updateKitchenUserAction(user.id, formData);
        
        toast({
            title: "Profile Updated",
            description: "Your profile has been successfully updated.",
        });

        // Refetch user data and update auth context
        // This is a simplified way to update the context. In a real app, you might want a dedicated function.
        const updatedUser = {
            ...user,
            username: formData.get('username') as string
        };
        login(updatedUser);

        router.push('/admin');
    };

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-lg">Loading user data...</div>
            </div>
        );
    }
    
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="font-headline">Edit My Profile</CardTitle>
                <CardDescription>Update your username and password.</CardDescription>
            </CardHeader>
            <form action={handleSubmit}>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="username" name="username" defaultValue={user.username} required className="pl-9" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="password" name="password" type="password" placeholder="Leave blank to keep current password" className="pl-9" />
                        </div>
                         <p className="text-xs text-muted-foreground">Leave the password field blank if you do not wish to change it.</p>
                    </div>
                </CardContent>
                <CardFooter className="gap-2">
                    <Button type="submit">Save Changes</Button>
                    <Button variant="outline" asChild>
                        <Link href="/admin">Cancel</Link>
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

