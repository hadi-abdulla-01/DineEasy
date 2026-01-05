

'use client';
import { MenuItem } from "@/lib/definitions";
import { addMenuItemAction, toggleMenuItemAddonAction, toggleMenuItemAvailabilityAction } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil } from "lucide-react";
import Link from "next/link";
import type { RestaurantSettings, Branch } from "@/lib/definitions";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../auth-provider";
import { useRestaurantData } from "@/lib/client-data";

function MenuItemList({ items, onToggle, settings, restaurantId }: { items: MenuItem[], onToggle: () => void, settings: RestaurantSettings | null, restaurantId: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const handleAvailabilityToggle = async (itemId: string, currentAvailability: boolean) => {
    await toggleMenuItemAvailabilityAction(itemId, !currentAvailability, restaurantId);
    onToggle();
  }

  const handleAddonToggle = async (itemId: string, currentAddonStatus: boolean) => {
    await toggleMenuItemAddonAction(itemId, !!currentAddonStatus, restaurantId);
    onToggle();
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'addons') return matchesSearch && item.isAddon;
    if (filter === 'non-addons') return matchesSearch && !item.isAddon;
    return matchesSearch;
  });

  const currencySymbol = settings?.currencySymbol || '$';
  const currencyDecimalPlaces = settings?.currencyDecimalPlaces ?? 2;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input
          type="text"
          placeholder="Search for a food item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="addons">Add-ons Only</SelectItem>
            <SelectItem value="non-addons">Regular Items</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {filteredItems.map((item) => {
        const imagePlaceholder = placeholderImages.find(p => p.id === item.imageId);
        let imageSrc = '';
        if (item.imageId) {
          if (item.imageId.startsWith('data:image')) {
            imageSrc = item.imageId;
          } else if (imagePlaceholder) {
            imageSrc = imagePlaceholder.imageUrl;
          }
        }

        return (
          <Card key={item.id}>
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  {imageSrc && (
                    <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                      <Image src={imageSrc} alt={item.name} fill objectFit="cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm font-mono">{currencySymbol}{item.price.toFixed(currencyDecimalPlaces)}</p>
                  </div>
                </div>
                <Button variant="outline" size="icon" asChild>
                  <Link href={`/admin/menu/${item.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit Item</span>
                  </Link>
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{item.description}</p>

                {/* Session Badges */}
                {item.availableSessions && item.availableSessions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.availableSessions.map(sessionId => {
                      const session = settings?.mealSessions?.find(s => s.id === sessionId);
                      return session ? (
                        <span key={sessionId} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {session.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                <Separator />
                <div className="flex items-center justify-end gap-6 pt-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`addon-switch-${item.id}`} className="text-sm text-muted-foreground">Add-on</Label>
                    <Switch
                      id={`addon-switch-${item.id}`}
                      checked={!!item.isAddon}
                      onCheckedChange={() => handleAddonToggle(item.id, !!item.isAddon)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`avail-switch-${item.id}`} className="text-sm text-muted-foreground">{item.isAvailable ? "Available" : "Unavailable"}</Label>
                    <Switch
                      id={`avail-switch-${item.id}`}
                      checked={item.isAvailable}
                      onCheckedChange={() => handleAvailabilityToggle(item.id, item.isAvailable)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  );
}


export default function MenuManagementPage() {
  const { user } = useAuth();
  const { getMenuItems, getSettings, getMainBranch, restaurantId } = useRestaurantData();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categoryValue, setCategoryValue] = useState<string>("");
  const [branchId, setBranchId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchToggle, setRefetchToggle] = useState(false);

  const fetchItemsAndSettings = useCallback(async () => {
    if (!branchId || !restaurantId) return;
    setError(null);
    try {
      const [items, s] = await Promise.all([
        getMenuItems(branchId),
        getSettings(branchId),
      ]);
      setMenuItems(items.sort((a, b) => a.name.localeCompare(b.name)));
      setSettings(s);
    } catch (err) {
      console.error("Failed to fetch menu items and settings:", err);
      setError("Failed to load menu data.");
    }
  }, [branchId, restaurantId, getMenuItems, getSettings]);


  useEffect(() => {
    async function loadData() {
      if (!user || !restaurantId) return;
      try {
        let activeBranchId = user.branchId || null; // Use explicit branch if user is branch-locked

        if (!activeBranchId) {
          const mainBranch = await getMainBranch();
          activeBranchId = mainBranch?.id || null;
        }

        setBranchId(activeBranchId);
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError("Failed to initialize menu management.");
      }
    }
    loadData();
  }, [user, restaurantId, getMainBranch]);

  useEffect(() => {
    if (branchId) {
      fetchItemsAndSettings();
    }
  }, [branchId, fetchItemsAndSettings, refetchToggle]);


  const categories = settings?.menuCategories || [];

  const handleAddMenuItem = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      if (previewImage) {
        formData.append('image', previewImage);
      }
      if (branchId) {
        formData.append('branchId', branchId);
      }
      formData.append('restaurantId', restaurantId);

      const selectedSessions: string[] = [];
      if (settings?.mealSessions) {
        settings.mealSessions.forEach(session => {
          if (formData.get(`session-${session.id}`) === 'on') {
            selectedSessions.push(session.id);
          }
        });
      }

      if (selectedSessions.length > 0) {
        formData.append('availableSessions', JSON.stringify(selectedSessions));
      }

      const newItem = await addMenuItemAction(formData);

      if (newItem) {
        setRefetchToggle(prev => !prev);
        formRef.current?.reset();
        setCategoryValue("");
        setPreviewImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setRefetchToggle(prev => !prev);
      }

    } catch (error) {
      console.error("Failed to add menu item", error);
      setError("Failed to add item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md flex items-center justify-between">
          <p>{error}</p>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="font-headline">Add New Menu Item</CardTitle>
          <CardDescription>Add a new dish or beverage to your menu.</CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={handleAddMenuItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" name="name" placeholder="Enter the Item Name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Price</Label>
                <Input id="price" name="price" type="number" step="0.01" placeholder="Item Price" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Enter the Item Description" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Select name="category" required value={categoryValue} onValueChange={setCategoryValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prepTime">Preparation Time</Label>
                <Input id="prepTime" name="prepTime" type="number" placeholder="Time in Minutes" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="image">Item Image</Label>
                <Input id="image" name="imageFile" type="file" accept="image/*" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
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
                      img.src = event.target?.result as string;
                    };
                    reader.readAsDataURL(file);
                  }
                }} />
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
                  />
                  <Label htmlFor="isBestSeller" className="cursor-pointer">
                    Mark as Best Seller
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isRecommended"
                    name="isRecommended"
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
                />
                <p className="text-xs text-muted-foreground">
                  This note will be displayed on recommended items in the customer view
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Session Availability */}
            {settings?.mealSessions && settings.mealSessions.length > 0 ? (
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
                        name={`session-${session.id}`}
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
            ) : settings === null ? (
              <div className="space-y-4">
                <div className="h-7 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              </div>
            ) : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Item"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="font-headline">Manage Menu</CardTitle>
          <CardDescription>Search for items and toggle their availability or add-on status.</CardDescription>
        </CardHeader>
        <CardContent>
          <MenuItemList items={menuItems} onToggle={() => setRefetchToggle(prev => !prev)} settings={settings} restaurantId={restaurantId} />
        </CardContent>
      </Card>
    </div>
  )
}
