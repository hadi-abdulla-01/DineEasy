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
    onAddToCart: (item: MenuItem) => void;
    getQuantity: (itemId: string) => number;
    onRemoveFromCart: (item: MenuItem) => void;
    settings: RestaurantSettings | null;
    currentSession?: MealSession | null;
}

export function FeaturedSections({ menu, onViewAllMenu, onItemClick, onAddToCart, getQuantity, onRemoveFromCart, settings, currentSession }: FeaturedSectionsProps) {
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
                            const quantity = getQuantity(item.id);

                            return (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-[20px] p-3 shadow-sm hover:shadow-md transition-all relative"
                                >
                                    {/* Session badge */}
                                    <div className="absolute top-2 right-2 z-10 bg-[#E95322] px-2 py-1 rounded-full">
                                        <span className="font-['League_Spartan',sans-serif] text-white text-xs font-semibold">
                                            {currentSession.name}
                                        </span>
                                    </div>

                                    {/* Clickable area for details */}
                                    <button
                                        onClick={() => onItemClick(item)}
                                        className="text-left w-full"
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
                                    </button>

                                    {/* Price and Add/Quantity controls */}
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="font-['League_Spartan',sans-serif] font-bold text-[#CB1E1D] text-base">
                                            {currencySymbol}{item.price.toFixed(currencyDecimalPlaces)}
                                        </span>
                                        {quantity > 0 ? (
                                            <div className="flex items-center gap-2 bg-[#E95322] rounded-full px-2 py-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemoveFromCart(item);
                                                    }}
                                                    className="text-white hover:text-gray-200 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9" />
                                                    </svg>
                                                </button>
                                                <span className="text-white font-semibold text-sm min-w-[1.5rem] text-center">
                                                    {quantity}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddToCart(item);
                                                    }}
                                                    className="text-white hover:text-gray-200 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddToCart(item);
                                                }}
                                                className="bg-[#E95322] hover:bg-[#CB1E1D] text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                                            >
                                                Add
                                            </button>
                                        )}
                                    </div>
                                </div>
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
                            const quantity = getQuantity(item.id);

                            return (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-[20px] p-3 shadow-sm hover:shadow-md transition-all"
                                >
                                    {/* Clickable area for details */}
                                    <button
                                        onClick={() => onItemClick(item)}
                                        className="text-left w-full"
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
                                    </button>

                                    {/* Price and Add/Quantity controls */}
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="font-['League_Spartan',sans-serif] font-bold text-[#CB1E1D] text-base">
                                            {currencySymbol}{item.price.toFixed(currencyDecimalPlaces)}
                                        </span>
                                        {quantity > 0 ? (
                                            <div className="flex items-center gap-2 bg-[#E95322] rounded-full px-2 py-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemoveFromCart(item);
                                                    }}
                                                    className="text-white hover:text-gray-200 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9" />
                                                    </svg>
                                                </button>
                                                <span className="text-white font-semibold text-sm min-w-[1.5rem] text-center">
                                                    {quantity}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddToCart(item);
                                                    }}
                                                    className="text-white hover:text-gray-200 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddToCart(item);
                                                }}
                                                className="bg-[#E95322] hover:bg-[#CB1E1D] text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                                            >
                                                Add
                                            </button>
                                        )}
                                    </div>
                                </div>
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
                            const quantity = getQuantity(item.id);

                            return (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-[20px] p-3 shadow-sm hover:shadow-md transition-all"
                                >
                                    {/* Clickable area for details */}
                                    <button
                                        onClick={() => onItemClick(item)}
                                        className="text-left w-full"
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
                                    </button>

                                    {/* Price, recommendation note, and Add/Quantity controls */}
                                    <div className="flex items-center justify-between mt-2 gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
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
                                        {quantity > 0 ? (
                                            <div className="flex items-center gap-2 bg-[#E95322] rounded-full px-2 py-1 flex-shrink-0">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemoveFromCart(item);
                                                    }}
                                                    className="text-white hover:text-gray-200 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9" />
                                                    </svg>
                                                </button>
                                                <span className="text-white font-semibold text-sm min-w-[1.5rem] text-center">
                                                    {quantity}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddToCart(item);
                                                    }}
                                                    className="text-white hover:text-gray-200 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddToCart(item);
                                                }}
                                                className="bg-[#E95322] hover:bg-[#CB1E1D] text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex-shrink-0"
                                            >
                                                Add
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
