
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, ChevronRight, QrCode, ShoppingBasket, Globe, FileText, Printer, GitBranch, Building, Clock, Tag } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/app/admin/auth-provider';
import { useEffect, useState } from 'react';
import type { Branch } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useRestaurantData } from "@/lib/client-data";

const restaurantSettingsSections = [
    {
        title: "Global Restaurant Details",
        description: "Manage your restaurant's global name and address.",
        href: "/admin/settings/restaurant",
        icon: <Building className="h-6 w-6" />,
        roles: ['Admin']
    },
    {
        title: "Branch Management",
        description: "Add, remove, or set the main branch for your restaurant.",
        href: "/admin/settings/branches",
        icon: <GitBranch className="h-6 w-6" />,
        roles: ['Admin']
    }
];

const branchSettingsSections = [
    {
        title: "General Settings",
        description: "Manage branch name, address, currency, and tax settings.",
        href: "/admin/settings/general",
        icon: <Settings className="h-6 w-6" />,
        roles: ['Admin', 'Manager']
    },
    {
        title: "Menu Categories",
        description: "Manage food categories like Meals, Snacks, Beverages, and more.",
        href: "/admin/settings/categories",
        icon: <Tag className="h-6 w-6" />,
        roles: ['Admin', 'Manager']
    },
    {
        title: "Meal Sessions",
        description: "Configure breakfast, lunch, dinner times and session-based menu availability.",
        href: "/admin/settings/sessions",
        icon: <Clock className="h-6 w-6" />,
        roles: ['Admin', 'Manager']
    },
    {
        title: "Online Order Settings",
        description: "Manage delivery fees, minimum order values, and more.",
        href: "/admin/settings/online-orders",
        icon: <ShoppingBasket className="h-6 w-6" />,
        roles: ['Admin', 'Manager']
    },
    {
        title: "Invoice & Numbering",
        description: "Set custom prefixes and numbering for your invoices.",
        href: "/admin/settings/invoicing",
        icon: <FileText className="h-6 w-6" />,
        roles: ['Admin', 'Manager']
    },
    {
        title: "Printing",
        description: "Configure paper sizes for invoices and kitchen tickets.",
        href: "/admin/settings/printing",
        icon: <Printer className="h-6 w-6" />,
        roles: ['Admin', 'Manager']
    },
    {
        title: "QR Code Customization",
        description: "Customize QR code appearance for this branch.",
        href: "/admin/settings/qr-code",
        icon: <QrCode className="h-6 w-6" />,
        roles: ['Admin', 'Manager']
    },
    {
        title: "Platform Management",
        description: "Manage online ordering platforms like Swiggy for this branch.",
        href: "/admin/settings/platforms",
        icon: <Globe className="h-6 w-6" />,
        roles: ['Admin', 'Manager']
    },
];


export default function SettingsPage() {
    const { user } = useAuth();
    const { getBranches, getMainBranch, restaurantId } = useRestaurantData();
    const [mainBranch, setMainBranch] = useState<Branch | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);

    // Centralized Global Admin Check
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

                setSelectedBranchId(prev => prev || fetchedMainBranch?.id);
            } else {
                setSelectedBranchId(user.branchId);
            }
        }
        fetchData();
    }, [user, restaurantId, isGlobalAdmin, getBranches, getMainBranch]);

    if (!user) return null;

    const getHref = (baseHref: string) => {
        if (!branchSettingsSections.some(s => s.href === baseHref)) return baseHref;
        const branchIdToUse = isGlobalAdmin ? selectedBranchId : user.branchId;
        return `${baseHref}?branchId=${branchIdToUse}`;
    };

    return (
        <div className="space-y-8">
            {isGlobalAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Global Restaurant Settings</CardTitle>
                        <CardDescription>These settings apply across all branches unless overridden.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {restaurantSettingsSections.map((section) => (
                            <Link href={getHref(section.href)} key={section.href} className="block group">
                                <Card className="hover:border-primary transition-colors">
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

            <Separator />

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
                    {!selectedBranchId ? (
                        <div className="text-center text-muted-foreground py-8">Loading...</div>
                    ) : (
                        branchSettingsSections.filter(s => s.roles.includes(user.role)).map((section) => (
                            <Link href={getHref(section.href)} key={section.href} className="block group">
                                <Card className="hover:border-primary transition-colors">
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
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
