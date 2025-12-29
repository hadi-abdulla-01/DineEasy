

'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import type { KitchenUser, MenuItem, UserRole, NavMenuKey, UserPermissions, Branch } from '@/lib/definitions';
import { getKitchenUsers, getMenuItems, getBranches, getMainBranch } from '@/lib/data';
import { createKitchenUserAction, deleteKitchenUserAction } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, KeyRound, Pencil, Trash2, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
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

const USER_ROLES: UserRole[] = ['Admin', 'Manager', 'Server', 'Kitchen'];

const ALL_PERMISSIONS_CONFIG: {key: NavMenuKey, label: string, rights: ('view' | 'create' | 'edit' | 'delete')[]}[] = [
    { key: 'dashboard', label: 'Dashboard', rights: ['view'] },
    { key: 'tableOrder', label: 'Table Order', rights: ['view'] },
    { key: 'tables', label: 'Table Management', rights: ['view', 'create', 'edit', 'delete'] },
    { key: 'menu', label: 'Menu Management', rights: ['view', 'create', 'edit', 'delete'] },
    { key: 'kitchen', label: 'Kitchen View', rights: ['view'] },
    { key: 'sales', label: 'Sales Report', rights: ['view'] },
    { key: 'salesHistory', label: 'Sales History', rights: ['view', 'edit', 'delete'] },
    { key: 'onlineOrders', label: 'Online Orders', rights: ['view', 'create'] },
    { key: 'takeAway', label: 'Take Away', rights: ['view', 'create'] },
    { key: 'userManagement', label: 'User Management', rights: ['view', 'create', 'edit', 'delete'] },
    { key: 'settings', label: 'Settings', rights: ['view', 'edit'] },
];

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<KitchenUser[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [mainBranch, setMainBranch] = useState<Branch | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
  const [permissions, setPermissions] = useState<UserPermissions>({});
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

  const fetchUsers = async () => {
    const fetchedUsers = await getKitchenUsers();
    setUsers(fetchedUsers);
  };
  
  const fetchMenuItemsAndBranches = async () => {
      const items = await getMenuItems();
      setMenuItems(items);
      const fetchedBranches = await getBranches();
      setBranches(fetchedBranches);
      const fetchedMainBranch = await getMainBranch();
      setMainBranch(fetchedMainBranch);
      // Set default selected branch
      if (currentUser?.role !== 'Admin' && currentUser?.branchId) {
          setSelectedBranch(currentUser.branchId);
      } else if (fetchedMainBranch) {
          setSelectedBranch(fetchedMainBranch.id);
      }
  }

  useEffect(() => {
    fetchUsers();
    fetchMenuItemsAndBranches();
  }, [currentUser]);

  const canCreate = currentUser?.permissions?.userManagement?.create || currentUser?.role === 'Admin';
  const canEdit = currentUser?.permissions?.userManagement?.edit || currentUser?.role === 'Admin';
  const canDelete = currentUser?.permissions?.userManagement?.delete || currentUser?.role === 'Admin';
  const isMainBranchManager = currentUser?.role === 'Manager' && currentUser?.branchId === mainBranch?.id;
  const canManageAllBranches = currentUser?.role === 'Admin' || isMainBranchManager;

  const handleAddUser = async (formData: FormData) => {
    formData.delete('categories');
    selectedCategories.forEach(category => {
      formData.append('categories', category);
    });

    formData.append('permissions', JSON.stringify(permissions));
    
    // If user is a branch manager (not main), their branchId is implicitly used.
    if (currentUser?.role === 'Manager' && !isMainBranchManager) {
        formData.append('branchId', currentUser.branchId);
    }

    const result = await createKitchenUserAction(undefined, formData);
    
    if (result?.message) {
        toast({
            title: result.message.includes("success") ? "User Created" : "Error",
            description: result.message,
            variant: result.message.includes("success") ? "default" : "destructive"
        });
    }

    if (result?.message.includes("success")) {
      fetchUsers();
      formRef.current?.reset();
      setSelectedCategories(['All']);
      setPermissions({});
      setSelectAllPermissions(false);
      setSelectedRole('Kitchen');
      if (canManageAllBranches && mainBranch) {
        setSelectedBranch(mainBranch.id);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteKitchenUserAction(userId);
    fetchUsers();
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
          (menuPermissions as any)[right] = value;

          if (right === 'view' && !value) {
              Object.keys(menuPermissions).forEach(key => {
                  (menuPermissions as any)[key] = false;
              });
          }
          if (right !== 'view' && value) {
              menuPermissions.view = true;
          }

          return newPermissions;
      });
  };

  const handleSelectAllPermissionsChange = (checked: boolean) => {
    setSelectAllPermissions(checked);
    const newPermissions: UserPermissions = {};
    if(checked) {
        ALL_PERMISSIONS_CONFIG.forEach(menu => {
            newPermissions[menu.key] = {};
            menu.rights.forEach(right => {
                (newPermissions[menu.key] as any)[right] = true;
            });
        });
    }
    setPermissions(newPermissions);
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
      
      const isVisibleForManager = canManageAllBranches || user.branchId === currentUser?.branchId;

      return nameMatch && branchMatch && roleMatch && isVisibleForManager;
    });
  }, [users, nameFilter, branchFilter, roleFilter, canManageAllBranches, currentUser?.branchId]);

  return (
    <div className="space-y-8">
      {canCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Add New User</CardTitle>
            <CardDescription>Create a new login for a member of your staff.</CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} action={handleAddUser} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="username" name="username" placeholder="e.g., chef_john" required className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select name="role" required value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                          <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                              {USER_ROLES.filter(r => (currentUser?.role === 'Admin' || isMainBranchManager) ? true : r !== 'Admin').map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
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
               {canManageAllBranches && (
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

              <Separator/>
              
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                        <Label>Permissions</Label>
                        <p className="text-xs text-muted-foreground pt-1">Which sidebar menus and actions can this user access?</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="select-all-perms-add"
                            checked={selectAllPermissions}
                            onCheckedChange={handleSelectAllPermissionsChange}
                        />
                        <label htmlFor="select-all-perms-add" className="text-sm font-medium">Select All</label>
                    </div>
                  </div>

                  <div className="rounded-md border p-4 space-y-4">
                      {ALL_PERMISSIONS_CONFIG.map(menu => (
                          <div key={menu.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3">
                             <Label htmlFor={`perm-view-${menu.key}`} className="font-semibold">{menu.label}</Label>
                             <div className="flex items-center gap-x-4 gap-y-2 pt-2 sm:pt-0">
                                 {menu.rights.map(right => (
                                     <div key={right} className="flex items-center space-x-2">
                                         <Checkbox 
                                              id={`perm-${right}-${menu.key}`}
                                              checked={permissions[menu.key]?.[right] || false}
                                              onCheckedChange={(checked) => handlePermissionChange(menu.key, right, !!checked)}
                                         />
                                         <label htmlFor={`perm-${right}-${menu.key}`} className="text-sm font-medium capitalize">
                                              {right}
                                          </label>
                                     </div>
                                 ))}
                             </div>
                          </div>
                      ))}
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
              <Button type="submit">Create User</Button>
            </form>
          </CardContent>
        </Card>
      )}

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
              {canManageAllBranches && (
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{getBranchName(user.branchId)}</TableCell>
                      <TableCell className="truncate max-w-[150px]">{user.role === 'Kitchen' ? (user.categories?.join(', ') || 'N/A') : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            {canEdit && (
                              <Button variant="outline" size="icon" asChild>
                                  <Link href={`/admin/user-management/${user.id}/edit`}>
                                      <Pencil className="h-4 w-4" />
                                      <span className="sr-only">Edit User</span>
                                  </Link>
                              </Button>
                            )}
                            {canDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon" disabled={user.role === 'Admin'}>
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
