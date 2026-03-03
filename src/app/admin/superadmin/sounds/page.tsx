
'use client';

import { useState, useEffect, useActionState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Music, Plus, Trash2, LoaderCircle } from "lucide-react";
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getSoundOptions, addSoundOption, deleteSoundOption, type SoundOption } from '@/lib/server-actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ActionState = {
    success: boolean;
    message: string;
} | null;

async function handleAddSoundAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const name = formData.get('name') as string;
    const url = formData.get('url') as string;

    if (!name || !url) {
        return { success: false, message: 'Name and URL are required.' };
    }
    
    try {
        new URL(url);
    } catch (_) {
        return { success: false, message: 'Please enter a valid URL.' };
    }

    const result = await addSoundOption(name, url);
    if (result.success) {
        return { success: true, message: 'Sound added successfully!' };
    }
    return { success: false, message: result.error || 'Failed to add sound.' };
}

export default function SoundManagementPage() {
    const { toast } = useToast();
    const [sounds, setSounds] = useState<SoundOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [actionState, formAction, isPending] = useActionState<ActionState, FormData>(handleAddSoundAction, null);

    const fetchSounds = async () => {
        setIsLoading(true);
        const fetchedSounds = await getSoundOptions();
        setSounds(fetchedSounds);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchSounds();
    }, []);
    
    useEffect(() => {
        if (actionState?.success) {
            toast({ title: 'Success', description: actionState.message });
            fetchSounds();
        } else if (actionState?.message) {
            toast({ variant: 'destructive', title: 'Error', description: actionState.message });
        }
    }, [actionState, toast]);

    const handleDelete = async (sound: SoundOption) => {
        if (confirm(`Are you sure you want to delete the sound "${sound.name}"?`)) {
            const result = await deleteSoundOption(sound.id);
            if (result.success) {
                toast({ title: 'Sound Deleted' });
                fetchSounds();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        }
    };

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
                            <Music className="w-8 h-8 text-yellow-600" />
                            Notification Sound Management
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Add, view, or delete custom MP3 notification sounds for the KDS.
                        </p>
                    </div>
                </div>

                <Card>
                    <form action={formAction}>
                        <CardHeader>
                            <CardTitle>Add New Sound</CardTitle>
                            <CardDescription>
                                Provide a name and a direct URL to an MP3 file.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Sound Name</Label>
                                    <Input id="name" name="name" placeholder="e.g., 'Kitchen Bell'" required disabled={isPending} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="url">MP3 URL</Label>
                                    <Input id="url" name="url" type="url" placeholder="https://example.com/sound.mp3" required disabled={isPending} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> Adding...</> : <><Plus className="mr-2 h-4 w-4"/> Add Sound</>}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Available Sounds</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-24 flex items-center justify-center">
                                <LoaderCircle className="animate-spin" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>URL</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sounds.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center h-24">
                                                No custom sounds added yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sounds.map(sound => (
                                            <TableRow key={sound.id}>
                                                <TableCell className="font-medium">{sound.name}</TableCell>
                                                <TableCell>
                                                    <a href={sound.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block max-w-xs">{sound.url}</a>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(sound)}>
                                                        <Trash2 className="h-4 w-4"/>
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        ) }
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
