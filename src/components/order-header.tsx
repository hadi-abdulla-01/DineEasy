'use client';

import Logo from "@/components/logo";
import { useGreeting } from "@/hooks/use-greeting";
import type { MealSession } from "@/lib/definitions";

interface OrderHeaderProps {
    restaurantName: string;
    tableNumber: number;
    currentSession?: MealSession | null;
    customerName: string;
}

export function OrderHeader({ restaurantName, tableNumber, currentSession, customerName }: OrderHeaderProps) {
    const { greeting: defaultGreeting, subtitle: defaultSubtitle, mounted } = useGreeting();

    const greeting = currentSession?.greeting ? `Hi ${customerName}, ${currentSession.greeting.toLowerCase()}`: `Hi ${customerName}, ${defaultGreeting.toLowerCase()}`;
    const subtitle = currentSession?.displayMessage || defaultSubtitle;

    return (
        <header className="bg-[#f5cb58] px-6 pt-8 pb-8 rounded-b-[30px] shadow-md">
            <div className="container mx-auto max-w-md">
                {/* Top bar with logo and table */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Logo className="h-8 w-8 text-[#CB1E1D]" />
                        <span className="font-['League_Spartan',sans-serif] font-bold text-[#391713] text-lg">
                            {restaurantName}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-[#391713]/70 text-xs font-['League_Spartan',sans-serif]">Table</p>
                        <p className="font-['League_Spartan',sans-serif] font-bold text-[#391713] text-2xl">
                            {tableNumber}
                        </p>
                    </div>
                </div>

                {/* Greeting - fade in when mounted to prevent flash */}
                <div className={`transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                    <h1 className="font-['League_Spartan',sans-serif] font-bold text-[#f8f8f8] text-3xl mb-1">
                        {greeting}
                    </h1>
                    <p className="font-['League_Spartan',sans-serif] font-medium text-[#CB1E1D] text-sm">
                        {subtitle}
                    </p>
                    {currentSession && (
                        <p className="font-['League_Spartan',sans-serif] text-[#391713] text-sm mt-3 font-semibold">
                            {currentSession.name} • {currentSession.startTime} - {currentSession.endTime}
                        </p>
                    )}
                </div>
            </div>
        </header>
    );
}
