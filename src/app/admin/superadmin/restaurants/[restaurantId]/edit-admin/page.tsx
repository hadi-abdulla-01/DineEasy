
'use client';
import { useEffect, useState } from 'react';
import { updateUserAction } from '@/lib/actions';
import type { AppUser, NavMenuKey, UserPermissions } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/admin/auth-provider';
import { ALL_PERMISSIONS_CONFIG } from '@/lib/permissions';
import { getRestaurantById, getAdminForRestaurant } from '@/lib/server-actions';
import { Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditAdminPermissionsPage() {
    const { user: currentUser } = useAuth();
    const params = useParams();
    const router = useRouter();
    const restaurantId = params.restaurantId as string;

    const [adminUser, setAdminUser] = useState<AppUser | null>(null);
    const [restaurant, setRestaurant] = useState<{ id: string; name: string; } | null>(null);
    const [permissions, setPermissions] = useState<UserPermissions>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) return;

        async function loadData() {
            setIsLoading(true);
            try {
                const [fetchedAdmin, fetchedRestaurant] = await Promise.all([
                    getAdminForRestaurant(restaurantId),
                    getRestaurantById(restaurantId),
                ]);

                if (!fetchedAdmin || !fetchedRestaurant) {
                    notFound();
                    return;
                }

                setAdminUser(fetchedAdmin);
                setRestaurant(fetchedRestaurant);
                setPermissions(fetchedAdmin.permissions || {});
            } catch (error) {
                console.error("Failed to load admin permissions data:", error);
                notFound();
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [restaurantId]);

    const handleSubmit = async (formData: FormData) => {
        if (!adminUser) return;

        formData.append('permissions', JSON.stringify(permissions));
        formData.append('restaurantId', restaurantId);
        if (currentUser?.id) {
            formData.append('updatedBy', currentUser.id);
        }

        await updateUserAction(adminUser.id, formData);

        router.push(`/admin/superadmin/restaurants/${restaurantId}`);
    };
    
    const handlePermissionChange = (menu: NavMenuKey, right: 'view' | 'create' | 'edit' | 'delete', value: boolean) => {
        setPermissions(prev => {
            const newPermissions = { ...prev };
            if (!newPermissions[menu]) {
                newPermissions[menu] = {};
            }
            const menuPermissions = newPermissions[menu]!;

            (menuPermissions as any)[right] = value;

            if (right === 'view' && !value) {
                // If view is unchecked, uncheck all others for that menu
                Object.keys(menuPermissions).forEach(key => {
                    (menuPermissions as any)[key] = false;
                });
            } else if (right !== 'view' && value) {
                 // If a specific right is checked, ensure view is also checked
                 menuPermissions.view = true;
            }

            return newPermissions;
        });
    };

    if (isLoading || !adminUser || !restaurant) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-80" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-96 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
         <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/superadmin/restaurants/${restaurantId}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit Admin Permissions</h1>
                        <p className="text-slate-600 dark:text-slate-400">
                           For <span className="font-semibold">{adminUser.username}</span> at <span className="font-semibold">{restaurant.name}</span>
                        </p>
                    </div>
                </div>

                <Card>
                    <form action={handleSubmit}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-red-600" />
                                Assign Rights
                            </CardTitle>
                            <CardDescription>
                                Select the features and actions this restaurant administrator can access and grant to their own users.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <UiTable>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-1/3">Feature</TableHead>
                                            <TableHead className="text-center">View</TableHead>
                                            <TableHead className="text-center">Create</TableHead>
                                            <TableHead className="text-center">Edit</TableHead>
                                            <TableHead className="text-center">Delete</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ALL_PERMISSIONS_CONFIG.map(menu => {
                                            const availableRights = ['view', 'create', 'edit', 'delete'];
                                            const currentPerms = permissions[menu.key] || {};
                                            return (
                                                <TableRow key={menu.key}>
                                                    <TableCell className="font-medium">{menu.label}</TableCell>
                                                    {availableRights.map(right => (
                                                        <TableCell key={right} className="text-center">
                                                            {menu.rights.includes(right as any) ? (
                                                                <Checkbox
                                                                    checked={currentPerms[right as keyof typeof currentPerms] || false}
                                                                    onCheckedChange={(checked) => handlePermissionChange(menu.key, right as any, !!checked)}
                                                                />
                                                            ) : <span className="text-muted-foreground">-</span>}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </UiTable>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button variant="outline" asChild>
                               <Link href={`/admin/superadmin/restaurants/${restaurantId}`}>Cancel</Link>
                            </Button>
                            <Button type="submit">Save Permissions</Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}

    