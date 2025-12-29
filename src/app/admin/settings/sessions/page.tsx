'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { addMealSessionAction, updateMealSessionAction, deleteMealSessionAction, updateManualSessionOverrideAction } from '@/lib/actions';
import { useAuth } from '../../auth-provider';
import { getSettings, getMainBranch } from '@/lib/data';
import { useEffect } from 'react';
import type { MealSession, RestaurantSettings } from '@/lib/definitions';
import { Clock, Plus, Trash2, Edit2, Settings2 } from 'lucide-react';
import { formatSessionTime, getCurrentActiveSession } from '@/lib/utils/session-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SessionsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [editingSession, setEditingSession] = useState<MealSession | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [manualOverrideEnabled, setManualOverrideEnabled] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [branchId, setBranchId] = useState<string | null>(null);
    const [isActiveSwitch, setIsActiveSwitch] = useState(true); // Default to true for new sessions

    useEffect(() => {
        async function fetchData() {
            let activeBranchId = user?.branchId;

            // If no branchId, get main branch
            if (!activeBranchId) {
                const mainBranch = await getMainBranch();
                activeBranchId = mainBranch?.id || null;
            }

            setBranchId(activeBranchId);

            if (activeBranchId) {
                getSettings(activeBranchId).then(s => {
                    setSettings(s);
                    setManualOverrideEnabled(s.manualSessionOverride?.enabled || false);
                    setSelectedSessionId(s.manualSessionOverride?.sessionId || '');
                });
            }
        }
        fetchData();
    }, [user]);

    const handleAddSession = async (formData: FormData) => {
        if (!branchId) return;

        formData.append('branchId', branchId);
        await addMealSessionAction(formData);

        // Refresh settings
        const updatedSettings = await getSettings(branchId);
        setSettings(updatedSettings);
        setIsAdding(false);
    };

    const handleUpdateSession = async (formData: FormData) => {
        if (!branchId || !editingSession) return;

        formData.append('branchId', branchId);
        formData.append('sessionId', editingSession.id);
        await updateMealSessionAction(formData);

        // Refresh settings
        const updatedSettings = await getSettings(branchId);
        setSettings(updatedSettings);
        setEditingSession(null);
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!branchId) return;
        if (!confirm('Are you sure you want to delete this session?')) return;

        await deleteMealSessionAction(branchId, sessionId);

        // Refresh settings
        const updatedSettings = await getSettings(branchId);
        setSettings(updatedSettings);
    };

    const handleManualOverrideUpdate = async () => {
        if (!branchId) return;

        const formData = new FormData();
        formData.append('branchId', branchId);
        formData.append('enabled', manualOverrideEnabled.toString());
        formData.append('sessionId', selectedSessionId);

        await updateManualSessionOverrideAction(formData);

        // Refresh settings
        const updatedSettings = await getSettings(branchId);
        setSettings(updatedSettings);
    };

    const sessions = settings?.mealSessions || [];

    if (!user) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-headline font-bold">Meal Sessions</h1>
                <p className="text-muted-foreground mt-2">
                    Configure meal sessions (Breakfast, Lunch, Dinner) with time ranges and greetings
                </p>
            </div>

            {/* Manual Session Override */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5" />
                        Manual Session Control
                    </CardTitle>
                    <CardDescription>
                        Override automatic time-based session detection for testing or special events
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="manualOverride"
                            checked={manualOverrideEnabled}
                            onCheckedChange={setManualOverrideEnabled}
                        />
                        <Label htmlFor="manualOverride" className="cursor-pointer">
                            Enable Manual Override
                        </Label>
                    </div>

                    {manualOverrideEnabled && (
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="activeSession">Active Session</Label>
                                <Select
                                    value={selectedSessionId}
                                    onValueChange={setSelectedSessionId}
                                >
                                    <SelectTrigger id="activeSession">
                                        <SelectValue placeholder="Select a session" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sessions.map(session => (
                                            <SelectItem key={session.id} value={session.id}>
                                                {session.name} ({session.startTime} - {session.endTime})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {settings?.mealSessions && (
                                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                    <p className="font-medium mb-1">ℹ️ Auto-detected session:</p>
                                    <p>
                                        {(() => {
                                            const autoSession = getCurrentActiveSession(settings.mealSessions);
                                            return autoSession
                                                ? `${autoSession.name} (${formatSessionTime(autoSession.startTime)} - ${formatSessionTime(autoSession.endTime)})`
                                                : 'No active session at current time';
                                        })()}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <Button onClick={handleManualOverrideUpdate}>
                        Save Changes
                    </Button>
                </CardContent>
            </Card>

            {/* Add New Session */}
            {!isAdding && !editingSession && (
                <Button onClick={() => {
                    setIsAdding(true);
                    setIsActiveSwitch(true); // Reset to true for new session
                }} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Session
                </Button>
            )}

            {/* Add/Edit Form */}
            {(isAdding || editingSession) && (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingSession ? 'Edit Session' : 'Add New Session'}</CardTitle>
                        <CardDescription>
                            {editingSession ? 'Update the session details' : 'Create a new meal session'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={editingSession ? handleUpdateSession : handleAddSession} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Session Name *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g., Breakfast, Lunch, Dinner"
                                        defaultValue={editingSession?.name || ''}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="greeting">Greeting *</Label>
                                    <Input
                                        id="greeting"
                                        name="greeting"
                                        placeholder="e.g., Good Morning"
                                        defaultValue={editingSession?.greeting || ''}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="displayMessage">Display Message *</Label>
                                <Input
                                    id="displayMessage"
                                    name="displayMessage"
                                    placeholder="e.g., Rise and shine! It's breakfast time"
                                    defaultValue={editingSession?.displayMessage || ''}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Start Time (24-hour) *</Label>
                                    <Input
                                        id="startTime"
                                        name="startTime"
                                        type="time"
                                        defaultValue={editingSession?.startTime || ''}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="endTime">End Time (24-hour) *</Label>
                                    <Input
                                        id="endTime"
                                        name="endTime"
                                        type="time"
                                        defaultValue={editingSession?.endTime || ''}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isActive"
                                    checked={isActiveSwitch}
                                    onCheckedChange={setIsActiveSwitch}
                                />
                                <Label htmlFor="isActive" className="cursor-pointer">
                                    Active (session is currently in use)
                                </Label>
                            </div>

                            <input type="hidden" name="isActive" value={isActiveSwitch ? 'true' : 'false'} />

                            <Separator />

                            <div className="flex gap-2">
                                <Button type="submit">
                                    {editingSession ? 'Update Session' : 'Add Session'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsAdding(false);
                                        setEditingSession(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Existing Sessions List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Configured Sessions</h2>
                {sessions.length === 0 ? (
                    <Card>
                        <CardContent className="p-6 text-center text-muted-foreground">
                            No sessions configured yet. Add your first session to get started.
                        </CardContent>
                    </Card>
                ) : (
                    sessions.map((session) => (
                        <Card key={session.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold">{session.name}</h3>
                                            {!session.isActive && (
                                                <span className="text-xs px-2 py-1 bg-muted rounded">Inactive</span>
                                            )}
                                        </div>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                    {formatSessionTime(session.startTime)} - {formatSessionTime(session.endTime)}
                                                </span>
                                            </div>
                                            <p><strong>Greeting:</strong> {session.greeting}</p>
                                            <p><strong>Message:</strong> {session.displayMessage}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                setEditingSession(session);
                                                setIsActiveSwitch(session.isActive);
                                            }}
                                            disabled={isAdding || !!editingSession}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleDeleteSession(session.id)}
                                            disabled={isAdding || !!editingSession}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
