
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, ChevronRight, QrCode, ShoppingBasket, Globe, FileText, Printer, GitBranch, Building, Clock, Tag, Layers, Monitor, Percent, Wallet, Palette } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/app/admin/auth-provider';
import { useEffect, useState } from 'react';
import type { Branch, NavMenuKey } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useRestaurantData } from "@/lib/client-data";
import { cn } from "@/lib/utils";

const restaurantSettingsSections = [
    {
        title: "Global Restaurant Details",
        description: "Manage your restaurant's global name and address.",
        href: "/admin/settings/restaurant",
        icon: <Building className="h-6 w-6" />,
        permissionKey: 'settingsRestaurant' as NavMenuKey
    },
    {
        title: "Branch Management",
        description: "Add, remove, or set the main branch for your restaurant.",
        href: "/admin/settings/branches",
        icon: <GitBranch className="h-6 w-6" />,
        permissionKey: 'settingsBranches' as NavMenuKey
    }
];

const branchSettingsSections = [
    {
        title: "General Settings",
        description: "Manage branch name, address, currency, and tax settings.",
        href: "/admin/settings/general",
        icon: <Settings className="h-6 w-6" />,
        permissionKey: 'settingsGeneral' as NavMenuKey
    },
    {
        title: "Subscription & Billing",
        description: "View and manage your subscription plan.",
        href: "/admin/settings/subscription",
        icon: <Wallet className="h-6 w-6" />,
        permissionKey: 'settingsSubscription' as NavMenuKey
    },
     {
        title: "Floor Management",
        description: "Configure floors for multi-level table layouts.",
        href: "/admin/settings/floors",
        icon: <Layers className="h-6 w-6" />,
        permissionKey: 'settingsFloors' as NavMenuKey
    },
    {
        title: "Menu Categories",
        description: "Manage food categories like Meals, Snacks, Beverages, and more.",
        href: "/admin/settings/categories",
        icon: <Tag className="h-6 w-6" />,
        permissionKey: 'settingsCategories' as NavMenuKey
    },
    {
        title: "Meal Sessions",
        description: "Configure breakfast, lunch, dinner times and session-based menu availability.",
        href: "/admin/settings/sessions",
        icon: <Clock className="h-6 w-6" />,
        permissionKey: 'settingsSessions' as NavMenuKey
    },
    {
        title: "POS Settings",
        description: "Configure cash denominations and other POS screen options.",
        href: "/admin/settings/pos",
        icon: <Monitor className="h-6 w-6" />,
        permissionKey: 'settingsPos' as NavMenuKey
    },
    {
        title: "Kitchen Display (KDS)",
        description: "Customize sound alerts and order colors for the kitchen screen.",
        href: "/admin/settings/kds",
        icon: <Palette className="h-6 w-6" />,
        permissionKey: 'settingsKds' as NavMenuKey
    },
    {
        title: "Discount & Offer Management",
        description: "Create and manage discounts like Happy Hour.",
        href: "/admin/settings/discounts",
        icon: <Percent className="h-6 w-6" />,
        permissionKey: 'settingsDiscounts' as NavMenuKey
    },
    {
        title: "Online Order Settings",
        description: "Manage delivery fees, minimum order values, and more.",
        href: "/admin/settings/online-orders",
        icon: <ShoppingBasket className="h-6 w-6" />,
        permissionKey: 'settingsOnline' as NavMenuKey
    },
    {
        title: "Invoice & Numbering",
        description: "Set custom prefixes and numbering for your invoices.",
        href: "/admin/settings/invoicing",
        icon: <FileText className="h-6 w-6" />,
        permissionKey: 'settingsInvoicing' as NavMenuKey
    },
    {
        title: "Printing",
        description: "Configure paper sizes for invoices and kitchen tickets.",
        href: "/admin/settings/printing",
        icon: <Printer className="h-6 w-6" />,
        permissionKey: 'settingsPrinting' as NavMenuKey
    },
    {
        title: "QR Code Customization",
        description: "Customize QR code appearance for this branch.",
        href: "/admin/settings/qr-code",
        icon: <QrCode className="h-6 w-6" />,
        permissionKey: 'settingsQr' as NavMenuKey
    },
    {
        title: "Platform Management",
        description: "Manage online ordering platforms like Swiggy for this branch.",
        href: "/admin/settings/platforms",
        icon: <Globe className="h-6 w-6" />,
        permissionKey: 'settingsPlatforms' as NavMenuKey
    },
];


export default function SettingsPage() {
    const { user } = useAuth();
    const { getBranches, getMainBranch, restaurantId } = useRestaurantData();
    const [mainBranch, setMainBranch] = useState<Branch | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);

    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';

    const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(undefined);

    useEffect(() => {
        async function fetchData() {
            if (!user || !restaurantId) return;

            if (isGlobalAdmin) {
                const [fetchedBranches, fetchedMainBranch] = await Promise.all([
                    getBranches(),
                    getMainBranch()
                ]);

                setBranches(fetchedBranches);
                setMainBranch(fetchedMainBranch);

                // If no branch is selected yet, default to the main branch
                if (!selectedBranchId) {
                    setSelectedBranchId(fetchedMainBranch?.id || fetchedBranches[0]?.id);
                }

            } else {
                setSelectedBranchId(user.branchId);
            }
        }
        fetchData();
    }, [user, restaurantId, isGlobalAdmin, getBranches, getMainBranch]);

    if (!user) return null;

    const hasPermission = (key: NavMenuKey) => {
        if (!user) return false;
        if (user.isSuperAdmin || user.role === 'Admin') return true;
        // Non-admins need explicit view permission for each setting.
        return !!user.permissions?.[key]?.view;
    };

    const branchIdToLink = isGlobalAdmin ? selectedBranchId : user.branchId;

    const getHref = (baseHref: string) => {
        const isBranchSetting = branchSettingsSections.some(s => s.href === baseHref);
        if (!isBranchSetting) return baseHref;
        
        if (!branchIdToLink) return '#';
        return `${baseHref}?branchId=${branchIdToLink}`;
    };

    const visibleGlobalSettings = restaurantSettingsSections.filter(section => isGlobalAdmin && hasPermission(section.permissionKey));
    const visibleBranchSettings = branchSettingsSections.filter(section => hasPermission(section.permissionKey));

    return (
        <div className="space-y-8">
            {isGlobalAdmin && visibleGlobalSettings.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Global Restaurant Settings</CardTitle>
                        <CardDescription>These settings apply across all branches unless overridden.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {visibleGlobalSettings.map((section) => (
                            <Link href={getHref(section.href)} key={section.href} className="block group">
                                <Card className="border-gray-300 dark:border-gray-600 hover:border-primary transition-colors">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-muted p-3 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                {section.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{section.title}</h3>
                                                <p className="text-sm text-muted-foreground">{section.description}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            )}

            {visibleGlobalSettings.length > 0 && visibleBranchSettings.length > 0 && <Separator />}

            {visibleBranchSettings.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="font-headline">Branch-Specific Settings</CardTitle>
                                <CardDescription>These settings can be configured individually for each branch.</CardDescription>
                            </div>
                            {isGlobalAdmin && (
                                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                    <SelectTrigger className="w-full sm:w-[220px]">
                                        <SelectValue placeholder="Select a branch to configure" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map(branch => (
                                            <SelectItem key={branch.id} value={branch.id}>Configure {branch.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!branchIdToLink && isGlobalAdmin ? (
                            <div className="text-center text-muted-foreground py-8">
                                <p>Loading branches...</p>
                            </div>
                        ) : (
                            visibleBranchSettings.map((section) => {
                                const href = getHref(section.href);
                                const isDisabled = href === '#';
                                return (
                                <Link 
                                    href={href} 
                                    key={section.href} 
                                    className={cn(
                                        "block group",
                                        isDisabled && "pointer-events-none opacity-50"
                                    )}
                                    aria-disabled={isDisabled}
                                    tabIndex={isDisabled ? -1 : undefined}
                                >
                                    <Card className="border-gray-300 dark:border-gray-600 hover:border-primary transition-colors">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-muted p-3 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                    {section.icon}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">{section.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{section.description}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        </CardContent>
                                    </Card>
                                </Link>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
