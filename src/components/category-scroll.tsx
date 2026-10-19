'use client';

import { useEffect, useState } from 'react';
import type { MenuItem } from '@/lib/definitions';
import { Utensils, Beef, Wine, Leaf, Grid3x3, IceCream, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
    category: string;
    isSelected: boolean;
    onClick: () => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
    'All': <Grid3x3 className="w-6 h-6" />,
    'Meals': <Utensils className="w-6 h-6" />,
    'Snacks': <Beef className="w-6 h-6" />,
    'Beverages': <Wine className="w-6 h-6" />,
    'Breads': <CircleDot className="w-6 h-6" />,
    'Desserts': <IceCream className="w-6 h-6" />,
    'Vegan': <Leaf className="w-6 h-6" />,
};

export function CategoryCard({ category, isSelected, onClick }: CategoryCardProps) {
    const icon = categoryIcons[category] || <Utensils className="w-6 h-6" />;

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-[20px] transition-all min-w-[70px]",
                isSelected
                    ? "bg-[#CB1E1D] text-white shadow-md scale-105"
                    : "bg-[#f3e9b5] text-[#E95322] hover:bg-[#f3e9b5]/80"
            )}
        >
            <div className="w-10 h-10 flex items-center justify-center">
                {icon}
            </div>
            <span className="font-['League_Spartan',sans-serif] font-medium text-xs whitespace-nowrap">
                {category}
            </span>
        </button>
    );
}

interface CategoryScrollProps {
    categories: string[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
}

export function CategoryScroll({ categories, selectedCategory, onSelectCategory }: CategoryScrollProps) {
    return (
        <div className="mb-6">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {categories.map((category) => (
                    <CategoryCard
                        key={category}
                        category={category}
                        isSelected={selectedCategory === category}
                        onClick={() => onSelectCategory(category)}
                    />
                ))}
            </div>
        </div>
    );
}
