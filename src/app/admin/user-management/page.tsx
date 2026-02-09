

'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import type { AppUser, MenuItem, UserRole, NavMenuKey, UserPermissions, Branch, Table } from '@/lib/definitions';
import { createUserAction, deleteUserAction } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, KeyRound, Pencil, Trash2, ChevronsUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/app/admin/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { ALL_PERMISSIONS_CONFIG } from '@/lib/permissions';
import { useRestaurantData } from '@/lib/client-data';

const USER_ROLES: UserRole[] = ['Admin', 'Manager', 'Server', 'Captain', 'Cashier', 'Accountant', 'Kitchen', 'Table'];

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { getUsers, getMenuItems, getBranches, getMainBranch, getTables, restaurantId } = useRestaurantData();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [mainBranch, setMainBranch] = useState<Branch | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
  const [permissions, setPermissions] = useState<UserPermissions>({ kitchen: { view: true }});
  const [selectedRole, setSelectedRole] = useState<UserRole>('Kitchen');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const { toast } = useToast();
  const [selectAllPermissions, setSelectAllPermissions] = useState(false);

  // Filters for user list
  const [nameFilter, setNameFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (!currentUser || !restaurantId) return;

    const fetchData = async () => {
      const [fetchedUsers, items, fetchedBranches, fetchedMainBranch, allTables] = await Promise.all([
        getUsers(),
        getMenuItems(),
        getBranches(),
        getMainBranch(),
        getTables(),
      ]);
      setUsers(fetchedUsers);
      setMenuItems(items);
      setBranches(fetchedBranches);
      setMainBranch(fetchedMainBranch);
      setTables(allTables);

      if (isGlobalAdmin) {
        if (fetchedMainBranch) setSelectedBranch(fetchedMainBranch.id);
      } else if (currentUser?.branchId) {
        setSelectedBranch(currentUser.branchId);
      }
    };
    fetchData();

  }, [currentUser, restaurantId, getUsers, getMenuItems, getBranches, getMainBranch, getTables]);

  const canCreate = currentUser?.permissions?.userManagement?.create || currentUser?.role === 'Admin';
  const canEdit = currentUser?.permissions?.userManagement?.edit || currentUser?.role === 'Admin';
  const canDelete = currentUser?.permissions?.userManagement?.delete || currentUser?.role === 'Admin';

  const isGlobalAdmin = (currentUser?.role === 'Admin' && !currentUser?.branchId) || currentUser?.isSuperAdmin;

  const handleAddUser = async (formData: FormData) => {
    if (!restaurantId) {
      toast({
        title: "Error",
        description: "Could not determine the restaurant. Please try again.",
        variant: "destructive"
      });
      return;
    }


    if (!formData.get('branchId') && selectedBranch) {
      formData.append('branchId', selectedBranch);
    }

    formData.delete('categories');
    selectedCategories.forEach(category => {
      formData.append('categories', category);
    });

    formData.append('permissions', JSON.stringify(permissions));

    if (currentUser?.id) {
      formData.append('createdBy', currentUser.id);
    }

    const result = await createUserAction(restaurantId, formData);

    if (result?.message) {
      toast({
        title: result.message.includes("success") ? "User Created" : "Error",
        description: result.message,
        variant: result.message.includes("success") ? "default" : "destructive"
      });
    }

    if (result?.message && result.message.includes("success")) {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
      formRef.current?.reset();
      setSelectedCategories(['All']);
      setPermissions({ kitchen: { view: true } });
      setSelectAllPermissions(false);
      setSelectedRole('Kitchen');
      if (isGlobalAdmin && mainBranch) {
        setSelectedBranch(mainBranch.id);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (currentUser?.id) {
      await deleteUserAction(userId, currentUser.id, restaurantId);
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    }
  }

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
        // Only grant permissions that the current user has
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
      } else {
          setPermissions({});
          setSelectAllPermissions(false);
      }
  };

  const selectedCategoriesText = selectedCategories.length > 0
    ? selectedCategories.join(', ')
    : 'Select categories';

  const showCategorySelector = selectedRole === 'Kitchen';

  const getBranchName = (branchId: string) => {
    return branches.find(b => b.id === branchId)?.name || 'N/A';
  }

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const nameMatch = nameFilter ? user.username.toLowerCase().includes(nameFilter.toLowerCase()) : true;
      const branchMatch = branchFilter !== 'all' ? user.branchId === branchFilter : true;
      const roleMatch = roleFilter !== 'all' ? user.role === roleFilter : true;

      const isVisibleForManager = isGlobalAdmin || user.branchId === currentUser?.branchId;

      return nameMatch && branchMatch && roleMatch && isVisibleForManager;
    });
  }, [users, nameFilter, branchFilter, roleFilter, isGlobalAdmin, currentUser?.branchId]);
  
  const availablePermissionsConfig = useMemo(() => {
    if (currentUser?.isSuperAdmin || currentUser?.role === 'Admin') {
      return ALL_PERMISSIONS_CONFIG;
    }
    return ALL_PERMISSIONS_CONFIG.filter(p => currentUser?.permissions?.[p.key]?.view);
  }, [currentUser]);


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Manage Users</CardTitle>
          <CardDescription>View, edit, or delete existing staff accounts. Apply filters to narrow down the list.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Input
              placeholder="Filter by username..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="max-w-sm"
            />
            {isGlobalAdmin && (
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {USER_ROLES.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full overflow-auto">
            <UiTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Assignments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => {
                    const isTargetAdmin = user.role === 'Admin';
                    const currentUserIsAdmin = currentUser?.role === 'Admin';
                    const canManageTarget = !isTargetAdmin || currentUserIsAdmin;

                    return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{getBranchName(user.branchId)}</TableCell>
                      <TableCell className="truncate max-w-[150px]">
                        {user.role === 'Kitchen' ? (user.categories?.join(', ') || 'N/A') :
                         user.role === 'Table' && user.assignedTableId ? `Table ${tables.find(t=>t.id === user.assignedTableId)?.number}` :
                         'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <Button
                              variant="outline"
                              size="icon"
                              disabled={!canManageTarget}
                              onClick={() => canManageTarget && router.push(`/admin/user-management/${user.id}/edit`)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit User</span>
                            </Button>
                          )}
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  disabled={!canManageTarget || user.id === currentUser?.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete User</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the user account for {user.username}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )})
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </UiTable>
          </div>
        </CardContent>
      </Card>
      {canCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Add New User</CardTitle>
            <CardDescription>Create a new login for a member of your staff or a table device.</CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} action={handleAddUser} className="space-y-6 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="username" name="username" placeholder="e.g., chef_john or table_5" required className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" required value={selectedRole} onValueChange={handleRoleChange}>
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
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" name="password" type="password" placeholder="Enter a secure password" required className="pl-9" />
                </div>
              </div>
              {isGlobalAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="branchId">Branch</Label>
                  <Select name="branchId" required value={selectedBranch} onValueChange={setSelectedBranch}>
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
                      <Select name="assignedTableId" required>
                          <SelectTrigger>
                              <SelectValue placeholder="Select a table" />
                          </SelectTrigger>
                          <SelectContent>
                              {tables.filter(t => t.branchId === selectedBranch).map(table => (
                                  <SelectItem key={table.id} value={table.id}>Table {table.number}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground pt-1">Assign this user to a specific table device.</p>
                  </div>
              )}


              <Separator />

              {selectedRole !== 'Table' && (
                <>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <Label className="text-base">Permissions</Label>
                          <p className="text-xs text-muted-foreground pt-1">Which menus and actions can this user access?</p>
                        </div>
                        {selectedRole !== 'Kitchen' && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="select-all-perms-add"
                              checked={selectAllPermissions}
                              onCheckedChange={handleSelectAllPermissionsChange}
                              disabled={!(currentUser?.isSuperAdmin || currentUser?.role === 'Admin')}
                            />
                            <label htmlFor="select-all-perms-add" className="text-sm font-medium">Select All</label>
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
                                                            id={`perm-${right}-${menu.key}-add`}
                                                            checked={currentPerms[right as keyof typeof currentPerms] || false}
                                                            onCheckedChange={(checked) => handlePermissionChange(menu.key, right as any, !!checked)}
                                                            disabled={
                                                                selectedRole === 'Kitchen' || 
                                                                (right !== 'view' && !currentPerms.view) ||
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
                  </div>


                  {showCategorySelector && (
                    <div className="space-y-2">
                      <Label>Accessible Kitchen Categories</Label>
                      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={popoverOpen}
                            className="w-full justify-between"
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
                                    id={`category-${cat}`}
                                    checked={selectedCategories.includes(cat)}
                                    onCheckedChange={() => handleCategoryChange(cat)}
                                  />
                                  <label htmlFor={`category-${cat}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
                  )}
                </>
              )}
              <Button type="submit">Create User</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

