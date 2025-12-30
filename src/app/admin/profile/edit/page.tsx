
'use client';
import { useEffect, useState } from 'react';
import { updateKitchenUserAction } from '@/lib/actions';
import type { ActivityLog, KitchenUser } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { User, KeyRound, ShieldCheck, CheckCircle, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/admin/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ALL_PERMISSIONS_CONFIG } from '@/lib/permissions';
import { getActivityLogsByUser } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';


export default function EditProfilePage() {
    const { user: currentUser, login } = useAuth();
    const [user, setUser] = useState<KitchenUser | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const { toast } = useToast();
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

    useEffect(() => {
        if (currentUser) {
            setUser(currentUser);
            getActivityLogsByUser(currentUser.id).then(setActivityLogs);
        }
    }, [currentUser]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (password && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        const formData = new FormData(e.currentTarget);
        if (!password) {
            formData.delete('password');
        }
        if (!user) return;
        
        await updateKitchenUserAction(user.id, formData);
        
        toast({
            title: "Profile Updated",
            description: "Your profile has been successfully updated.",
        });

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
        <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Edit My Profile</CardTitle>
                        <CardDescription>Update your username and password.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
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
                                    <Input 
                                        id="password" 
                                        name="password" 
                                        type="password" 
                                        placeholder="Leave blank to keep current password" 
                                        className="pl-9" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Leave the password field blank if you do not wish to change it.</p>
                            </div>
                            {password && (
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="confirmPassword" 
                                            name="confirmPassword" 
                                            type="password" 
                                            placeholder="Confirm your new password" 
                                            className="pl-9"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                        <CardFooter className="gap-2">
                            <Button type="submit">Save Changes</Button>
                            <Button variant="outline" asChild>
                                <Link href="/admin">Cancel</Link>
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-primary"/>
                            Recent Activity
                        </CardTitle>
                        <CardDescription>A log of your recent actions in the app.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-72">
                            <div className="space-y-4">
                                {activityLogs.length > 0 ? activityLogs.map(log => (
                                    <div key={log.id} className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{log.action}</p>
                                            <p className="text-sm text-muted-foreground">{log.details}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">No activity recorded yet.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-primary"/>
                            Your Role & Permissions
                        </CardTitle>
                         <CardDescription>This is a summary of your account access.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-xs uppercase text-muted-foreground">Role</Label>
                            <p className="font-semibold text-lg">{user.role}</p>
                        </div>
                        <Separator />
                        <div>
                            <Label className="text-xs uppercase text-muted-foreground">Permissions</Label>
                            <ul className="space-y-2 mt-2">
                               {ALL_PERMISSIONS_CONFIG.map(perm => {
                                    const userPerm = user.permissions?.[perm.key];
                                    if(userPerm?.view) {
                                        return (
                                            <li key={perm.key} className="flex items-center gap-2 text-sm">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <span>{perm.label}</span>
                                            </li>
                                        );
                                    }
                                    return null;
                               })}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

