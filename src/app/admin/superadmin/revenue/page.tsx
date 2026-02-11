'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, CircleDollarSign } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function RevenueDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/superadmin">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <CircleDollarSign className="w-8 h-8 text-green-600" />
                        Platform Revenue Dashboard
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        This feature is coming soon.
                    </p>
                </div>
            </div>

            <Card className="h-96">
                <CardHeader>
                    <CardTitle>Platform-Wide Revenue</CardTitle>
                    <CardDescription>Charts and metrics for total revenue processed across all restaurants will be displayed here.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Revenue dashboard is under construction.</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
