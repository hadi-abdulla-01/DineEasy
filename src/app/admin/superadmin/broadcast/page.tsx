
'use client';

import { useActionState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Megaphone, Send, LoaderCircle, CheckCircle, XCircle } from "lucide-react";
import Link from 'next/link';
import { broadcastMessageAction } from '@/lib/server-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ActionState = {
  success: boolean;
  message: string;
} | null;


export default function BroadcastPage() {
  const [actionState, formAction, isPending] = useActionState<ActionState, FormData>(broadcastMessageAction, null);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/superadmin">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Megaphone className="w-8 h-8 text-purple-600" />
                        Broadcast Announcements
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Send a push notification to all restaurant administrators.
                    </p>
                </div>
            </div>
            
            <Card>
                <form action={formAction}>
                    <CardHeader>
                        <CardTitle>Compose Message</CardTitle>
                        <CardDescription>
                            This message will be sent as a push notification to all active restaurant admin devices.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {actionState && (
                            <Alert variant={actionState.success ? 'default' : 'destructive'} className={actionState.success ? "border-green-500/50" : ""}>
                                {actionState.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                <AlertTitle>{actionState.success ? 'Success' : 'Error'}</AlertTitle>
                                <AlertDescription>{actionState.message}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" placeholder="e.g., Important Update" required disabled={isPending} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea id="message" name="message" placeholder="Your announcement details here..." required rows={5} disabled={isPending} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> Sending...</> : <><Send className="mr-2 h-4 w-4"/> Send Broadcast</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    </div>
  );
}

    
