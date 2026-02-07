
'use client';
import { useState, useEffect } from 'react';
import type { Discount, DayOfWeek, DiscountType, DiscountApplicability, MenuItem } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ChevronsUpDown, Calendar as CalendarIcon, Search } from 'lucide-react';
import { createDiscountAction, updateDiscountAction } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { ScrollArea } from './ui/scroll-area';

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Discount')}
        </Button>
    );
}

interface DiscountFormProps {
    branchId: string;
    restaurantId: string;
    menuCategories: string[];
    menuItems: MenuItem[];
    onFormSuccess: () => void;
    onCancel: () => void;
    existingDiscount?: Discount | null;
}

export function DiscountForm({ branchId, restaurantId, menuCategories, menuItems, onFormSuccess, onCancel, existingDiscount }: DiscountFormProps) {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
    const [value, setValue] = useState<number | string>('');
    const [isActive, setIsActive] = useState(true);
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>([]);
    const [applicability, setApplicability] = useState<DiscountApplicability>('all');
    const [applicableCategories, setApplicableCategories] = useState<string[]>([]);
    const [applicableItems, setApplicableItems] = useState<string[]>([]);
    const [itemSearchTerm, setItemSearchTerm] = useState('');

    useEffect(() => {
        if (existingDiscount) {
            setName(existingDiscount.name);
            setDescription(existingDiscount.description || '');
            setType(existingDiscount.type);
            setValue(existingDiscount.value);
            setIsActive(existingDiscount.isActive);
            setStartDate(existingDiscount.startDate ? new Date(existingDiscount.startDate) : undefined);
            setEndDate(existingDiscount.endDate ? new Date(existingDiscount.endDate) : undefined);
            setStartTime(existingDiscount.startTime || '');
            setEndTime(existingDiscount.endTime || '');
            setDaysOfWeek(existingDiscount.daysOfWeek || []);
            setApplicability(existingDiscount.applicability || 'all');
            setApplicableCategories(existingDiscount.applicableCategories || []);
            setApplicableItems(existingDiscount.applicableItems || []);
        }
    }, [existingDiscount]);

    const handleDayToggle = (day: DayOfWeek) => {
        setDaysOfWeek(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const handleCategoryToggle = (category: string) => {
        setApplicableCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, c]);
    };
    
    const handleItemToggle = (itemId: string) => {
        setApplicableItems(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
    };

    const handleFormSubmit = async (formData: FormData) => {
        formData.append('branchId', branchId);
        formData.append('restaurantId', restaurantId);
        formData.append('daysOfWeek', JSON.stringify(daysOfWeek));
        formData.append('applicability', applicability);
        formData.append('applicableCategories', JSON.stringify(applicability === 'categories' ? applicableCategories : []));
        formData.append('applicableItems', JSON.stringify(applicability === 'items' ? applicableItems : []));

        const action = existingDiscount ? updateDiscountAction.bind(null, existingDiscount.id) : createDiscountAction;

        const result = await action(formData);

        if (result?.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Success', description: `Discount ${existingDiscount ? 'updated' : 'created'} successfully.` });
            onFormSuccess();
        }
    };
    
    const filteredMenuItems = menuItems.filter(item => item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()));

    return (
        <form action={handleFormSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>{existingDiscount ? 'Edit Discount' : 'Create New Discount'}</CardTitle>
                    <CardDescription>Fill in the details for your discount or offer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="isActive" className="text-base">Active</Label>
                        <Switch id="isActive" name="isActive" checked={isActive} onCheckedChange={setIsActive} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Discount Name *</Label>
                        <Input id="name" name="name" placeholder="e.g., Happy Hour, Lunch Special" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="A short description for the discount." value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type *</Label>
                            <Select name="type" value={type} onValueChange={(v: 'percentage' | 'fixed') => setType(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="value">Value *</Label>
                            <Input id="value" name="value" type="number" value={value} onChange={e => setValue(e.target.value)} required />
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold pt-4 border-t">Rules & Conditions</h3>
                    
                    <div className="space-y-2">
                        <Label>Applies To</Label>
                        <RadioGroup value={applicability} onValueChange={(v: DiscountApplicability) => setApplicability(v)} className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all" id="r-all" />
                                <Label htmlFor="r-all">All Products</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="categories" id="r-cat" />
                                <Label htmlFor="r-cat">Specific Categories</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="items" id="r-items" />
                                <Label htmlFor="r-items">Specific Items</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {applicability === 'categories' && (
                        <div className="space-y-2 pl-2">
                            <Label>Applicable Categories</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start font-normal">
                                        <ChevronsUpDown className="mr-2 h-4 w-4"/>
                                        {applicableCategories.length > 0 ? `${applicableCategories.length} selected` : 'Select Categories'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-2">
                                    <div className="space-y-1">
                                        {menuCategories.map(cat => (
                                            <div key={cat} className="flex items-center gap-2">
                                                <Checkbox id={`cat-${cat}`} checked={applicableCategories.includes(cat)} onCheckedChange={() => handleCategoryToggle(cat)} />
                                                <Label htmlFor={`cat-${cat}`} className="font-normal">{cat}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {applicability === 'items' && (
                        <div className="space-y-2 pl-2">
                            <Label>Applicable Items</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start font-normal">
                                        <ChevronsUpDown className="mr-2 h-4 w-4"/>
                                        {applicableItems.length > 0 ? `${applicableItems.length} selected` : 'Select Items'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <div className="p-2 border-b">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search items..."
                                                value={itemSearchTerm}
                                                onChange={(e) => setItemSearchTerm(e.target.value)}
                                                className="pl-9 h-9"
                                            />
                                        </div>
                                    </div>
                                    <ScrollArea className="h-64">
                                    <div className="p-2 space-y-1">
                                        {filteredMenuItems.map(item => (
                                            <div key={item.id} className="flex items-center gap-2">
                                                <Checkbox id={`item-${item.id}`} checked={applicableItems.includes(item.id)} onCheckedChange={() => handleItemToggle(item.id)} />
                                                <Label htmlFor={`item-${item.id}`} className="font-normal">{item.name}</Label>
                                            </div>
                                        ))}
                                    </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}


                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Popover><PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger><PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                            </PopoverContent></Popover>
                            <input type="hidden" name="startDate" value={startDate?.toISOString()} />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                             <Popover><PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger><PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                            </PopoverContent></Popover>
                            <input type="hidden" name="endDate" value={endDate?.toISOString()} />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time</Label>
                            <Input id="startTime" name="startTime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="endTime">End Time</Label>
                            <Input id="endTime" name="endTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Days of the Week</Label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS_OF_WEEK.map(day => (
                                <Button key={day} type="button" variant={daysOfWeek.includes(day) ? 'default' : 'outline'} onClick={() => handleDayToggle(day)}>
                                    {day.substring(0, 3)}
                                </Button>
                            ))}
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="gap-2">
                    <SubmitButton isEditing={!!existingDiscount} />
                    <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
                </CardFooter>
            </Card>
        </form>
    );
}
