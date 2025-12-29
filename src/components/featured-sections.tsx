'use client';

import { useState } from 'react';
import type { MenuItem, RestaurantSettings, MealSession } from '@/lib/definitions';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images';
import { ChevronRight, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface FeaturedSectionsProps {
    menu: MenuItem[];
    onViewAllMenu: () => void;
    onItemClick: (item: MenuItem) => void;
    settings: RestaurantSettings | null;
    currentSession?: MealSession | null;
}

export function FeaturedSections({ menu, onViewAllMenu, onItemClick, settings, currentSession }: FeaturedSectionsProps) {
    const currencySymbol = settings?.currencySymbol || '₹';
    const currencyDecimalPlaces = settings?.currencyDecimalPlaces ?? 2;

    const bestSellers = menu
        .filter(item => item.isAvailable && item.isBestSeller)
        .slice(0, 4);

    const recommended = menu
        .filter(item => item.isAvailable && item.isRecommended)
        .slice(0, 2);

    // Session-specific items
    const sessionItems = currentSession
        ? menu.filter(item => {
            if (!item.isAvailable) return false;
            // If item has no sessions, it's available all times
            if (!item.availableSessions || item.availableSessions.length === 0) return false;
            // Only show items specifically assigned to this session
            return item.availableSessions.includes(currentSession.id);
        }).slice(0, 2)
        : [];

    return (
        <div className="space-y-6">
            <Button
                onClick={onViewAllMenu}
                className="w-full h-auto bg-gradient-to-r from-[#E95322] to-[#CB1E1D] rounded-[20px] p-6 text-left shadow-lg hover:shadow-xl transition-all"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-['League_Spartan',sans-serif] font-bold text-white text-2xl mb-1">
                            View All Menu
                        </h2>
                        <p className="font-['League_Spartan',sans-serif] text-white/90 text-sm">
                            Browse our complete menu
                        </p>
                    </div>
                    <ChevronRight className="w-8 h-8 text-white" />
                </div>
            </Button>

            {/* Session Special Section */}
            {currentSession && sessionItems.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[#E95322]" />
                            <h3 className="font-['League_Spartan',sans-serif] font-semibold text-[#391713] text-xl">
                                {currentSession.name} Special
                            </h3>
                        </div>
                        <button
                            onClick={onViewAllMenu}
                            className="font-['League_Spartan',sans-serif] font-semibold text-[#E95322] text-sm"
                        >
                            View All
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {sessionItems.map((item) => {
                            const image = placeholderImages.find(p => p.id === item.imageId);
                            const imageSrc = item.imageId?.startsWith('data:image') ? item.imageId : image?.imageUrl;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onItemClick(item)}
                                    className="bg-white rounded-[20px] p-3 shadow-sm hover:shadow-md transition-all text-left relative"
                                >
                                    {/* Session badge */}
                                    <div className="absolute top-2 right-2 z-10 bg-[#E95322] px-2 py-1 rounded-full">
                                        <span className="font-['League_Spartan',sans-serif] text-white text-xs font-semibold">
                                            {currentSession.name}
                                        </span>
                                    </div>
                                    {imageSrc && (
                                        <div className="relative w-full aspect-square rounded-[15px] overflow-hidden mb-2">
                                            <Image
                                                src={imageSrc}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <h4 className="font-['Poppins',sans-serif] font-semibold text-[#391713] text-sm mb-1 line-clamp-1">
                                        {item.name}
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <span className="font-['League_Spartan',sans-serif] font-bold text-[#CB1E1D] text-base">
                                            {currencySymbol}{item.price.toFixed(currencyDecimalPlaces)}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {bestSellers.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-['League_Spartan',sans-serif] font-semibold text-[#391713] text-xl">
                            Best Seller
                        </h3>
                        <button
                            onClick={onViewAllMenu}
                            className="font-['League_Spartan',sans-serif] font-semibold text-[#E95322] text-sm"
                        >
                            View All
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {bestSellers.map((item) => {
                            const image = placeholderImages.find(p => p.id === item.imageId);
                            const imageSrc = item.imageId?.startsWith('data:image') ? item.imageId : image?.imageUrl;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onItemClick(item)}
                                    className="bg-white rounded-[20px] p-3 shadow-sm hover:shadow-md transition-all text-left"
                                >
                                    {imageSrc && (
                                        <div className="relative w-full aspect-square rounded-[15px] overflow-hidden mb-2">
                                            <Image
                                                src={imageSrc}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <h4 className="font-['Poppins',sans-serif] font-semibold text-[#391713] text-sm mb-1 line-clamp-1">
                                        {item.name}
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <span className="font-['League_Spartan',sans-serif] font-bold text-[#CB1E1D] text-base">
                                            {currencySymbol}{item.price.toFixed(currencyDecimalPlaces)}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {recommended.length > 0 && (
                <div>
                    <h3 className="font-['League_Spartan',sans-serif] font-semibold text-[#391713] text-xl mb-4">
                        Recommended
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                        {recommended.map((item) => {
                            const image = placeholderImages.find(p => p.id === item.imageId);
                            const imageSrc = item.imageId?.startsWith('data:image') ? item.imageId : image?.imageUrl;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onItemClick(item)}
                                    className="bg-white rounded-[20px] p-3 shadow-sm hover:shadow-md transition-all text-left"
                                >
                                    {imageSrc && (
                                        <div className="relative w-full aspect-square rounded-[15px] overflow-hidden mb-2">
                                            <Image
                                                src={imageSrc}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <h4 className="font-['Poppins',sans-serif] font-semibold text-[#391713] text-sm mb-1 line-clamp-1">
                                        {item.name}
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <span className="font-['League_Spartan',sans-serif] font-bold text-[#CB1E1D] text-base">
                                            {currencySymbol}{item.price.toFixed(currencyDecimalPlaces)}
                                        </span>
                                        {item.recommendationNote && (
                                            <div className="bg-[#E95322] px-2 py-0.5 rounded-full">
                                                <span className="font-['League_Spartan',sans-serif] text-white text-xs">
                                                    {item.recommendationNote}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
