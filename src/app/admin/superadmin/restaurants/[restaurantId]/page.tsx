
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/admin/auth-provider';
import { getBranches, getActivityLogs, getUsers } from '@/lib/data';
import type { AppUser, Branch, ActivityLog } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { ArrowLeft, Building2, Users, GitBranch, User, Eye, EyeOff, BookOpen, Clock, Edit, QrCode, KeyRound, LoaderCircle } from 'lucide-react';
import { getRestaurantById, getAdminForRestaurant, getRestaurantFeatureFlags, updateRestaurantFeatureFlags, type RestaurantFeatureFlags } from '@/lib/server-actions';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PasswordCell } from '@/components/password-cell';

export default function RestaurantDetailsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const restaurantId = params.restaurantId as string;

    const [restaurant, setRestaurant] = useState<{ id: string; name: string } | null>(null);
    const [adminUser, setAdminUser] = useState<AppUser | null>(null);
    const [usersList, setUsersList] = useState<AppUser[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [featureFlags, setFeatureFlags] = useState<RestaurantFeatureFlags | null>(null);
    const [isSavingFlags, setIsSavingFlags] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!user || !user.isSuperAdmin) {
            router.push('/admin');
            return;
        }

        if (restaurantId) {
            const fetchData = async () => {
                setIsLoading(true);
                setFetchError(null);
                try {
                    const [restaurantData, usersData, branchesData, logsData, adminData, flagsData] = await Promise.all([
                        getRestaurantById(restaurantId),
                        getUsers(restaurantId),
                        getBranches(restaurantId),
                        getActivityLogs(50, restaurantId),
                        getAdminForRestaurant(restaurantId),
                        getRestaurantFeatureFlags(restaurantId)
                    ]);
                    setFeatureFlags(flagsData);

                    if (!restaurantData) {
                        router.push('/admin/superadmin');
                        return;
                    }
                    setRestaurant(restaurantData);
                    setAdminUser(adminData);
                    setUsersList(usersData);
                    setBranches(branchesData);
                    
                    // Filter logs for user management actions
                    const userManagementActions = ['Created User', 'Updated User', 'Deleted User'];
                    const filteredLogs = logsData.filter(log => userManagementActions.includes(log.action));
                    setActivityLogs(filteredLogs);

                } catch (error: any) {
                    console.error("Failed to fetch restaurant details:", error);
                    setFetchError(error?.message || 'Failed to load restaurant data. Please try again.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [user, router, restaurantId]);

    const usersWithoutBranch = usersList.filter(u => !u.branchId || u.branchId === '');

    const renderUserTable = (users: AppUser[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Password</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.length > 0 ? (
                    users.map((u) => (
                        <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.username}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>{u.role}</TableCell>
                            <TableCell>
                                <PasswordCell password={u.password} />
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">
                            No users found for this category.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <p>Loading restaurant details...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900">
                <p className="text-destructive font-medium">Error loading restaurant</p>
                <p className="text-sm text-muted-foreground">{fetchError}</p>
                <Link href="/admin/superadmin" className="text-sm underline">Back to super admin</Link>
            </div>
        );
    }
    
    if (!restaurant) {
        return (
             <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <p>Restaurant not found.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/admin/superadmin">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <Building2 className="w-8 h-8 text-red-600" />
                                {restaurant.name}
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                Details for restaurant ID: <span className="font-mono text-xs">{restaurant.id}</span>
                            </p>
                        </div>
                    </div>
                     <Button
                        variant="outline"
                        size="sm"
                        disabled={!adminUser}
                        asChild
                        title={!adminUser ? "No user with 'Admin' role found for this restaurant." : "Edit administrator permissions"}
                    >
                        <Link href={adminUser ? `/admin/superadmin/restaurants/${restaurantId}/edit-admin` : '#'}>
                            <Edit className="w-4 h-4 mr-2" />
                            {adminUser ? 'Edit Admin Permissions' : 'No Admin Found'}
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-red-600" />
                            Feature Controls
                        </CardTitle>
                        <CardDescription>
                            Enable or disable OTP verification and Dynamic QR codes for this restaurant. Changes reflect immediately in the restaurant's settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!featureFlags ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <LoaderCircle className="h-4 w-4 animate-spin" /> Loading feature flags…
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Dynamic QR Codes</Label>
                                        <p className="text-sm text-muted-foreground">When off, tables fall back to static QR codes and the duration setting is hidden.</p>
                                    </div>
                                    <Switch
                                        checked={featureFlags.dynamicQrEnabled}
                                        disabled={isSavingFlags}
                                        onCheckedChange={async (checked) => {
                                            const prev = featureFlags;
                                            setFeatureFlags({ ...prev, dynamicQrEnabled: checked });
                                            setIsSavingFlags(true);
                                            const result = await updateRestaurantFeatureFlags(restaurantId, { dynamicQrEnabled: checked });
                                            setIsSavingFlags(false);
                                            if (result.success) {
                                                toast({ title: 'Saved', description: `Dynamic QR ${checked ? 'enabled' : 'disabled'} for this restaurant.` });
                                            } else {
                                                setFeatureFlags(prev);
                                                toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to update.' });
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Dine-in OTP Verification</Label>
                                        <p className="text-sm text-muted-foreground">When off, the restaurant cannot require OTP for dine-in orders.</p>
                                    </div>
                                    <Switch
                                        checked={featureFlags.dineInOtpEnabled}
                                        disabled={isSavingFlags}
                                        onCheckedChange={async (checked) => {
                                            const prev = featureFlags;
                                            setFeatureFlags({ ...prev, dineInOtpEnabled: checked });
                                            setIsSavingFlags(true);
                                            const result = await updateRestaurantFeatureFlags(restaurantId, { dineInOtpEnabled: checked });
                                            setIsSavingFlags(false);
                                            if (result.success) {
                                                toast({ title: 'Saved', description: `Dine-in OTP ${checked ? 'enabled' : 'disabled'} for this restaurant.` });
                                            } else {
                                                setFeatureFlags(prev);
                                                toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to update.' });
                                            }
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="feature-qr-duration">Dynamic QR Timeout Duration (seconds)</Label>
                                    <div className="flex items-center gap-3 max-w-xs">
                                        <Input
                                            id="feature-qr-duration"
                                            type="number"
                                            min={30}
                                            step={30}
                                            value={featureFlags.dynamicQrDuration}
                                            disabled={isSavingFlags || !featureFlags.dynamicQrEnabled}
                                            onChange={(e) => setFeatureFlags({ ...featureFlags, dynamicQrDuration: Number(e.target.value) })}
                                            onBlur={async () => {
                                                const duration = featureFlags.dynamicQrDuration;
                                                if (isNaN(duration) || duration < 30) {
                                                    toast({ variant: 'destructive', title: 'Invalid value', description: 'Duration must be at least 30 seconds.' });
                                                    const fresh = await getRestaurantFeatureFlags(restaurantId);
                                                    setFeatureFlags(fresh);
                                                    return;
                                                }
                                                setIsSavingFlags(true);
                                                const result = await updateRestaurantFeatureFlags(restaurantId, { dynamicQrDuration: duration });
                                                setIsSavingFlags(false);
                                                if (result.success) {
                                                    toast({ title: 'Saved', description: `QR timeout set to ${duration} seconds.` });
                                                } else {
                                                    toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to update.' });
                                                }
                                            }}
                                        />
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">seconds</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Used as the default rotation timeout for this restaurant's tables and branches.</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {usersWithoutBranch.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-red-600" />
                                Global Users (No Branch Assigned)
                            </CardTitle>
                            <CardDescription>
                                These users, typically administrators, have access not tied to a specific branch.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderUserTable(usersWithoutBranch)}
                        </CardContent>
                    </Card>
                )}

                {branches.length === 0 && usersWithoutBranch.length === 0 && (
                    <Card>
                        <CardContent className="pt-6 text-center text-slate-500">
                            This restaurant has no branches or users yet.
                        </CardContent>
                    </Card>
                )}

                {branches.map(branch => {
                    const branchUsers = usersList.filter(u => u.branchId === branch.id);
                    return (
                        <Card key={branch.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GitBranch className="w-5 h-5 text-red-600" />
                                    Branch: {branch.name}
                                </CardTitle>
                                <CardDescription>
                                    List of users assigned to the {branch.name} branch.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderUserTable(branchUsers)}
                            </CardContent>
                        </Card>
                    );
                })}
                
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-red-600" />
                            Recent User Activity
                        </CardTitle>
                        <CardDescription>
                            A log of user management actions in this restaurant.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-96">
                            <div className="space-y-4">
                                {activityLogs.length > 0 ? activityLogs.map(log => (
                                    <div key={log.id} className="flex items-start gap-4">
                                        <div className="mt-1 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                            <Clock className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{log.username}</span> {log.action.toLowerCase()}
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{log.details}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-slate-500 text-center py-8">No user management activity recorded for this restaurant yet.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>


            </div>
        </div>
    );
}

    
