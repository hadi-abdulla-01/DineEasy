
'use client';
import { updateMenuItemAction } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { notFound, useParams, useRouter } from "next/navigation";
import type { MenuItem, AddonGroup, AddonOption, RestaurantSettings } from "@/lib/definitions";
import { placeholderImages } from "@/lib/placeholder-images";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { PlusCircle, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useRestaurantData } from "@/lib/client-data";
import { useAuth } from "@/app/admin/auth-provider";

export default function EditMenuPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { getMenuItemById, getMenuItems, getSettings, restaurantId } = useRestaurantData();
    const itemId = Array.isArray(params.id) ? params.id[0] : params.id;
    const [item, setItem] = useState<MenuItem | null>(null);
    const [restaurantMenuItems, setRestaurantMenuItems] = useState<MenuItem[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [categoryValue, setCategoryValue] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([]);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!itemId || !restaurantId) return;

        const fetchItem = async () => {
            try {
                const menuItem = await getMenuItemById(itemId);
                if (menuItem) {
                    setItem(menuItem);
                    setCategoryValue(menuItem.category);
                    setAddonGroups(menuItem.addonGroups || []);
                    setSelectedSessions(menuItem.availableSessions || []);
                    const imagePlaceholder = placeholderImages.find(p => p.id === menuItem.imageId);
                    let imageSrc = '';
                    if (menuItem.imageId) {
                        if (menuItem.imageId.startsWith('data:image')) {
                            imageSrc = menuItem.imageId;
                        } else if (imagePlaceholder) {
                            imageSrc = imagePlaceholder.imageUrl;
                        }
                    }
                    if (imageSrc) {
                        setPreviewImage(imageSrc);
                    }
                } else {
                    notFound();
                }
            } catch (err) {
                console.error("Error fetching menu item:", err);
                setError("Failed to load menu item details. Please try again.");
            }
        };

        fetchItem();
    }, [itemId, getMenuItemById, restaurantId]);

    useEffect(() => {
        if (item?.branchId && restaurantId) {
            getSettings(item.branchId).then(setSettings).catch(err => console.error("Error fetching settings:", err));
            // Fetch menu items only for the current restaurant content context
            getMenuItems(item.branchId).then(setRestaurantMenuItems).catch(err => console.error("Error fetching menu items:", err));
        }
    }, [item, restaurantId, getSettings, getMenuItems]);


    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    setPreviewImage(dataUrl);
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFormSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            if (previewImage) {
                formData.append('image', previewImage);
            }
            formData.append('addonGroups', JSON.stringify(addonGroups));
            formData.append('restaurantId', restaurantId);

            // Add selected sessions
            if (selectedSessions.length > 0) {
                formData.append('availableSessions', JSON.stringify(selectedSessions));
            } else {
                formData.append('availableSessions', JSON.stringify([]));
            }

            if (!itemId) {
                throw new Error("Invalid Item ID");
            }
            await updateMenuItemAction(itemId, formData);
            router.push('/admin/menu');
        } catch (error) {
            console.error("Failed to update item", error);
            setIsSubmitting(false);
        }
    };

    // --- Add-on Group Handlers ---
    const handleAddGroup = () => {
        setAddonGroups([...addonGroups, { id: `group-${Date.now()}`, title: '', isRequired: false, options: [] }]);
    };
    const handleGroupChange = (groupId: string, field: keyof AddonGroup, value: any) => {
        setAddonGroups(addonGroups.map(g => g.id === groupId ? { ...g, [field]: value } : g));
    };
    const handleDeleteGroup = (groupId: string) => {
        setAddonGroups(addonGroups.filter(g => g.id !== groupId));
    };
    const handleAddOption = (groupId: string) => {
        const newOption: AddonOption = { id: `option-${Date.now()}`, name: '', price: 0 };
        setAddonGroups(addonGroups.map(g => g.id === groupId ? { ...g, options: [...g.options, newOption] } : g));
    };
    const handleOptionChange = (groupId: string, optionId: string, field: keyof AddonOption, value: any) => {
        setAddonGroups(addonGroups.map(g =>
            g.id === groupId
                ? { ...g, options: g.options.map(o => o.id === optionId ? { ...o, [field]: value } : o) }
                : g
        ));
    };
    const handleDeleteOption = (groupId: string, optionId: string) => {
        setAddonGroups(addonGroups.map(g => g.id === groupId ? { ...g, options: g.options.filter(o => o.id !== optionId) } : g));
    };
    // --- End Add-on Group Handlers ---

    if (error) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-destructive font-medium">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
                    <Button variant="ghost" asChild className="ml-2">
                        <Link href="/admin/menu">Back to Menu</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (!restaurantId || !item) {
        return <div>Loading...</div>; // Wait for context and item
    }

    // Correctly scope categories to the current restaurant's items and settings
    const categoriesFromItems = Array.from(new Set(restaurantMenuItems.map(item => item.category)));
    const categoriesFromSettings = settings?.menuCategories || [];
    const uniqueCategories = Array.from(new Set([...categoriesFromItems, ...categoriesFromSettings]));


    return (
        <form action={handleFormSubmit} className="space-y-6">
            <Card className="bg-card">
                <CardHeader>
                    <CardTitle className="font-headline">Edit {item.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="name">Item Name</Label>
                            <Input id="name" name="name" defaultValue={item.name} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="price">Price</Label>
                            <Input id="price" name="price" type="number" step="0.01" defaultValue={item.price} required />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" defaultValue={item.description} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="category">Category</Label>
                            <Select name="category" required value={categoryValue} onValueChange={setCategoryValue}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {uniqueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    <SelectItem value="new">...add a new category</SelectItem>
                                </SelectContent>
                            </Select>
                            {categoryValue === 'new' && <Input name="newCategory" placeholder="Enter new category name" required className="mt-2" />}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="prepTime">Preparation Time</Label>
                            <Input id="prepTime" name="prepTime" type="number" defaultValue={item.prepTime || ''} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="image">Item Image</Label>
                            <Input id="image" name="imageFile" type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} />
                        </div>
                    </div>

                    {previewImage && (
                        <div className="flex justify-center">
                            <div className="relative w-48 h-48">
                                <Image src={previewImage} alt="Image preview" fill objectFit="cover" className="rounded-md" />
                            </div>
                        </div>
                    )}

                    <Separator className="my-4" />

                    {/* Best Seller & Recommended Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Featured Item Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isBestSeller"
                                    name="isBestSeller"
                                    defaultChecked={item.isBestSeller}
                                />
                                <Label htmlFor="isBestSeller" className="cursor-pointer">
                                    Mark as Best Seller
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isRecommended"
                                    name="isRecommended"
                                    defaultChecked={item.isRecommended}
                                />
                                <Label htmlFor="isRecommended" className="cursor-pointer">
                                    Mark as Recommended
                                </Label>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="recommendationNote">Recommendation Note (Optional)</Label>
                            <Input
                                id="recommendationNote"
                                name="recommendationNote"
                                placeholder="e.g., Our Special, Chef's Choice, Customer Favorite"
                                defaultValue={item.recommendationNote || ''}
                            />
                            <p className="text-xs text-muted-foreground">
                                This note will be displayed on recommended items in the customer view
                            </p>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Session Availability */}
                    {settings?.mealSessions && settings.mealSessions.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Session Availability</h3>
                            <p className="text-sm text-muted-foreground">
                                Select which meal sessions this item is available in. Leave unchecked to make it available at all times.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {settings.mealSessions.map((session) => (
                                    <div key={session.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                                        <input
                                            type="checkbox"
                                            id={`session-${session.id}`}
                                            checked={selectedSessions.includes(session.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedSessions([...selectedSessions, session.id]);
                                                } else {
                                                    setSelectedSessions(selectedSessions.filter(id => id !== session.id));
                                                }
                                            }}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        <Label htmlFor={`session-${session.id}`} className="cursor-pointer flex-1">
                                            <div>
                                                <p className="font-medium">{session.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {session.startTime} - {session.endTime}
                                                </p>
                                            </div>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-card">
                <CardHeader>
                    <CardTitle className="font-headline">Add-on Groups</CardTitle>
                    <CardDescription>Create groups of choices for this menu item, like "Choose a Drink".</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {addonGroups.map((group) => (
                        <Card key={group.id} className="p-4 bg-muted/50">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2 flex-grow pr-4">
                                    <Label htmlFor={`group-title-${group.id}`}>Group Title</Label>
                                    <Input
                                        id={`group-title-${group.id}`}
                                        placeholder="e.g., Choose your Drink"
                                        value={group.title}
                                        onChange={(e) => handleGroupChange(group.id, 'title', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 flex items-center pt-8 gap-2">
                                    <Label htmlFor={`group-required-${group.id}`} className="text-sm">Required</Label>
                                    <Switch
                                        id={`group-required-${group.id}`}
                                        checked={group.isRequired}
                                        onCheckedChange={(checked) => handleGroupChange(group.id, 'isRequired', checked)}
                                    />
                                    <Button variant="ghost" size="icon" type="button" onClick={() => handleDeleteGroup(group.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-2 pl-4">
                                <Label>Options</Label>
                                {group.options.map((option) => (
                                    <div key={option.id} className="flex items-end gap-2">
                                        <div className="flex-grow">
                                            <Label htmlFor={`option-name-${option.id}`} className="text-xs text-muted-foreground">Option Name</Label>
                                            <Input
                                                id={`option-name-${option.id}`}
                                                placeholder="e.g., Extra Cheese"
                                                value={option.name}
                                                onChange={(e) => handleOptionChange(group.id, option.id, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-32">
                                            <Label htmlFor={`option-price-${option.id}`} className="text-xs text-muted-foreground">Price (0 for free)</Label>
                                            <Input
                                                id={`option-price-${option.id}`}
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={option.price}
                                                onChange={(e) => handleOptionChange(group.id, option.id, 'price', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" type="button" className="mb-1" onClick={() => handleDeleteOption(group.id, option.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" type="button" onClick={() => handleAddOption(group.id)} className="mt-2">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Option
                                </Button>
                            </div>
                        </Card>
                    ))}
                    <Button type="button" variant="secondary" onClick={handleAddGroup}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Group
                    </Button>
                </CardContent>
            </Card>

            <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
                <Button variant="outline" asChild>
                    <Link href="/admin/menu">Cancel</Link>
                </Button>
            </div>
        </form>
    );
}
