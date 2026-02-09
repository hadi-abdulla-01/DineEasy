

'use client';
import { useEffect, useState, useMemo } from 'react';
import { updateUserAction } from '@/lib/actions';
import type { AppUser, MenuItem, UserRole, NavMenuKey, UserPermissions, Branch, Table } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { notFound, useParams, useRouter } from 'next/navigation';
import { User, KeyRound, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/app/admin/auth-provider';
import { ALL_PERMISSIONS_CONFIG } from '@/lib/permissions';
import { useRestaurantData } from '@/lib/client-data';
import { Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const USER_ROLES: UserRole[] = ['Admin', 'Manager', 'Server', 'Captain', 'Cashier', 'Accountant', 'Kitchen', 'Table'];

export default function EditUserPage() {
    const { user: currentUser, login, refreshUser } = useAuth();
    const { getUserById, getMenuItems, getBranches, getMainBranch, getTables, restaurantId } = useRestaurantData();
    const [user, setUser] = useState<AppUser | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [mainBranch, setMainBranch] = useState<Branch | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<UserPermissions>({});
    const [selectedRole, setSelectedRole] = useState<UserRole | undefined>(undefined);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [categorySearchTerm, setCategorySearchTerm] = useState("");
    const [selectAllPermissions, setSelectAllPermissions] = useState(false);
    const [assignedTableId, setAssignedTableId] = useState<string | undefined>(undefined);


    useEffect(() => {
        if (userId && restaurantId) {
            getUserById(userId).then(fetchedUser => {
                if (fetchedUser) {
                    setUser(fetchedUser);
                    setSelectedCategories(fetchedUser.categories || []);
                    setSelectedRole(fetchedUser.role || 'Kitchen');
                    setPermissions(fetchedUser.permissions || {});
                    setSelectedBranch(fetchedUser.branchId);
                    setAssignedTableId(fetchedUser.assignedTableId);
                } else {
                    notFound();
                }
            });
            getMenuItems().then(setMenuItems);
            getBranches().then(setBranches);
            getMainBranch().then(setMainBranch);
            getTables().then(setTables);
        }
    }, [userId, restaurantId, getUserById, getMenuItems, getBranches, getMainBranch, getTables]);

    const handleSubmit = async (formData: FormData) => {
        formData.delete('categories');
        selectedCategories.forEach(category => {
            formData.append('categories', category);
        });

        formData.append('permissions', JSON.stringify(permissions));
        formData.append('restaurantId', restaurantId);
        if(currentUser?.id) {
            formData.append('updatedBy', currentUser.id);
        }
        if (assignedTableId) {
            formData.append('assignedTableId', assignedTableId);
        }


        await updateUserAction(userId, formData);
        
        if (currentUser?.id === userId) {
           await refreshUser();
        }

        router.push('/admin/user-management');
    };

    if (!user || !currentUser) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-lg">Loading user data...</div>
            </div>
        );
    }
    
    const isEditingSelf = currentUser.id === userId;
    const canEditSensitiveFields = currentUser.role === 'Admin' || !isEditingSelf;

    const allCategories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];

    const filteredCategories = allCategories.filter(cat =>
        cat.toLowerCase().includes(categorySearchTerm.toLowerCase())
    );

    const handleCategoryChange = (category: string) => {
        setSelectedCategories(prev => {
            if (category === 'All') {
                return prev.includes('All') ? [] : ['All'];
            }
            const newSelection = prev.filter(c => c !== 'All');
            return newSelection.includes(category)
                ? newSelection.filter(c => c !== category)
                : [...newSelection, category];
        });
    };

    const handlePermissionChange = (menu: NavMenuKey, right: 'view' | 'create' | 'edit' | 'delete', value: boolean) => {
        setPermissions(prev => {
            const newPermissions = { ...prev };
            if (!newPermissions[menu]) {
                newPermissions[menu] = {};
            }
            const menuPermissions = newPermissions[menu]!;

            if (right === 'view') {
                if (value) {
                    const menuConfig = ALL_PERMISSIONS_CONFIG.find(p => p.key === menu);
                    menuConfig?.rights.forEach(r => {
                        (menuPermissions as any)[r] = true;
                    });
                } else {
                    Object.keys(menuPermissions).forEach(key => {
                        (menuPermissions as any)[key] = false;
                    });
                }
            } else {
                (menuPermissions as any)[right] = value;
                if (value) {
                    menuPermissions.view = true;
                }
            }

            return newPermissions;
        });
    };

    const handleSelectAllPermissionsChange = (checked: boolean) => {
        setSelectAllPermissions(checked);
        const newPermissions: UserPermissions = {};
        if (checked) {
            ALL_PERMISSIONS_CONFIG.forEach(menu => {
                if(currentUser?.isSuperAdmin || currentUser?.role === 'Admin' || currentUser?.permissions?.[menu.key]?.view) {
                    newPermissions[menu.key] = {};
                    menu.rights.forEach(right => {
                        if(currentUser?.isSuperAdmin || currentUser?.role === 'Admin' || currentUser?.permissions?.[menu.key]?.[right]) {
                            (newPermissions[menu.key] as any)[right] = true;
                        }
                    });
                }
            });
        }
        setPermissions(newPermissions);
    };

    const handleRoleChange = (role: UserRole) => {
        setSelectedRole(role);
        if (role === 'Kitchen') {
            setPermissions({ kitchen: { view: true } });
            setSelectAllPermissions(false);
        }
    };

    const selectedCategoriesText = selectedCategories.length > 0
        ? selectedCategories.join(', ')
        : 'Select categories';

    const showCategorySelector = selectedRole === 'Kitchen';

    const canManageAllBranches = currentUser?.role === 'Admin';
    
    const availablePermissionsConfig = useMemo(() => {
        if (currentUser?.isSuperAdmin || currentUser?.role === 'Admin') {
          return ALL_PERMISSIONS_CONFIG;
        }
        return ALL_PERMISSIONS_CONFIG.filter(p => currentUser?.permissions?.[p.key]?.view);
    }, [currentUser]);


    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Edit User: {user.username}</CardTitle>
                <CardDescription>Update the credentials and permissions for this staff member.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-6 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="username" name="username" defaultValue={user.username} required className="pl-9" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select name="role" required value={selectedRole} onValueChange={handleRoleChange} disabled={!canEditSensitiveFields}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {USER_ROLES.filter(r => (currentUser?.role === 'Admin') ? true : r !== 'Admin').map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                </SelectContent>
                            </Select>
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
                    {canManageAllBranches && (
                        <div className="space-y-2">
                            <Label htmlFor="branchId">Branch</Label>
                            <Select name="branchId" required value={selectedBranch} onValueChange={setSelectedBranch} disabled={!canEditSensitiveFields}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(branch => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {selectedRole === 'Table' && (
                        <div className="space-y-2">
                            <Label htmlFor="assignedTableId">Assigned Table</Label>
                            <Select name="assignedTableId" required value={assignedTableId} onValueChange={setAssignedTableId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a table" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tables.filter(t => t.branchId === selectedBranch).map(table => (
                                        <SelectItem key={table.id} value={table.id}>Table {table.number}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}


                    <Separator />

                    {selectedRole !== 'Table' && (
                        <fieldset disabled={!canEditSensitiveFields} className="disabled:opacity-60 space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <Label className="text-base">Permissions</Label>
                                    <p className="text-xs text-muted-foreground pt-1">Which menus and actions can this user access?</p>
                                </div>
                                {selectedRole !== 'Kitchen' && (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="select-all-perms"
                                            checked={selectAllPermissions}
                                            onCheckedChange={handleSelectAllPermissionsChange}
                                            disabled={!(currentUser?.isSuperAdmin || currentUser?.role === 'Admin')}
                                        />
                                        <label htmlFor="select-all-perms" className="text-sm font-medium">Select All</label>
                                    </div>
                                )}
                            </div>

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
                                        {availablePermissionsConfig.map(menu => {
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
                                                                    disabled={
                                                                        (right !== 'view' && !currentPerms.view) ||
                                                                        !canEditSensitiveFields ||
                                                                        !(currentUser?.isSuperAdmin || currentUser?.role === 'Admin' || currentUser?.permissions?.[menu.key]?.[right])
                                                                    }
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
                        </fieldset>
                    )}


                    {showCategorySelector && selectedRole !== 'Table' && (
                        <fieldset disabled={!canEditSensitiveFields} className="disabled:opacity-60">
                            <div className="space-y-2">
                                <Label>Accessible Kitchen Categories</Label>
                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={popoverOpen}
                                            className="w-full justify-between disabled:cursor-not-allowed disabled:opacity-100"
                                            disabled={!canEditSensitiveFields}
                                        >
                                            <span className="truncate">{selectedCategoriesText}</span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <div className="p-2">
                                            <Input
                                                placeholder="Search categories..."
                                                value={categorySearchTerm}
                                                onChange={(e) => setCategorySearchTerm(e.target.value)}
                                                className="w-full"
                                            />
                                        </div>
                                        <ScrollArea className="h-48">
                                            <div className="p-4 pt-0 space-y-2">
                                                {filteredCategories.length > 0 ? filteredCategories.map(cat => (
                                                    <div key={cat} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`edit-category-${cat}`}
                                                            checked={selectedCategories.includes(cat)}
                                                            onCheckedChange={() => handleCategoryChange(cat)}
                                                        />
                                                        <label htmlFor={`edit-category-${cat}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                            {cat}
                                                        </label>
                                                    </div>
                                                )) : (
                                                    <div className="text-sm text-center text-muted-foreground py-4">No categories found.</div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs text-muted-foreground pt-1">Select 'All' to grant access to all categories, or select individual ones.</p>
                            </div>
                        </fieldset>
                    )}
                    <div className="flex gap-2 pt-4">
                        <Button type="submit">Save Changes</Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/user-management">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

