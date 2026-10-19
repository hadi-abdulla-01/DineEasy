
'use client';
import { Leaf, Droplets, Flame, Pizza } from 'lucide-react';
import type { MenuItem } from '@/lib/definitions';

const infoItems = [
    { key: 'carbs', label: 'Carbs', icon: <Leaf className="h-4 w-4" /> },
    { key: 'protein', label: 'Protein', icon: <Droplets className="h-4 w-4" /> },
    { key: 'kcal', label: 'Kcal', icon: <Flame className="h-4 w-4" /> },
    { key: 'fats', label: 'Fats', icon: <Pizza className="h-4 w-4" /> },
];

export function NutritionalInfo({ nutrition }: { nutrition: NonNullable<MenuItem['nutrition']> }) {
    return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {infoItems.map(info => (
                <div key={info.key} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                       {info.icon}
                    </div>
                    <span className="font-medium">{nutrition[info.key as keyof typeof nutrition]}</span>
                </div>
            ))}
        </div>
    );
}
