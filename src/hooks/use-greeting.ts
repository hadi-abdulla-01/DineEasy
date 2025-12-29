
'use client';

import { useEffect, useState } from 'react';

interface GreetingData {
    greeting: string;
    subtitle: string;
}

function getGreetingFromTime(): GreetingData {
    const hour = new Date().getHours();

    // Evening/Dinner: 5 PM (17:00) to 1 AM (01:00)
    if (hour >= 17 || hour < 1) {
        return {
            greeting: "Good Evening",
            subtitle: "Enjoy your dinner with us"
        };
    }
    // Morning/Breakfast: 1 AM to 12 PM (noon)
    else if (hour >= 1 && hour < 12) {
        return {
            greeting: "Good Morning",
            subtitle: "Rise and shine! It's breakfast time"
        };
    }
    // Afternoon/Lunch: 12 PM to 5 PM
    else {
        return {
            greeting: "Good Afternoon",
            subtitle: "Perfect time for a delicious meal"
        };
    }
}

const defaultGreeting: GreetingData = {
    greeting: 'Welcome!',
    subtitle: 'Ready to order something delicious?',
};

export function useGreeting(): GreetingData & { mounted: boolean } {
    const [mounted, setMounted] = useState(false);
    const [greetingData, setGreetingData] = useState<GreetingData>(defaultGreeting);

    useEffect(() => {
        setMounted(true);
        
        const updateGreeting = () => {
            setGreetingData(getGreetingFromTime());
        };
        
        updateGreeting(); // Set the correct greeting only on the client
        
        // Update every minute to keep it fresh
        const interval = setInterval(updateGreeting, 60000);
        return () => clearInterval(interval);
    }, []);

    return { ...greetingData, mounted };
}
