"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "motion/react";
import dynamic from 'next/dynamic';
import { LoaderCircle } from "lucide-react";

// Dynamically import the login pages to create separate chunks
const AdminLoginPage = dynamic(() => import('./AdminLoginPage'), {
    loading: () => <div className="flex h-screen w-screen items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin"/></div>,
    ssr: false
});
const KitchenLoginPage = dynamic(() => import('./KitchenLoginPage'), {
    loading: () => <div className="flex h-screen w-screen items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin"/></div>,
    ssr: false
});

type Page = "admin" | "kitchen";

function LoginSwitcherContent() {
    const searchParams = useSearchParams();
    const role = searchParams.get("role");

    const [currentPage, setCurrentPage] = useState<Page>(() => {
        return role === "kitchen" ? "kitchen" : "admin";
    });

    // This effect ensures that if the user navigates back/forward and the `role` param changes,
    // the component re-renders to the correct login page.
    useEffect(() => {
        setCurrentPage(role === "kitchen" ? "kitchen" : "admin");
    }, [role]);


    const handleNavigateToKitchen = () => {
        setCurrentPage("kitchen");
    };

    const handleNavigateToAdmin = () => {
        setCurrentPage("admin");
    };

    return (
        <div className="w-full h-screen overflow-hidden bg-[#f1b715]">
            <AnimatePresence mode="wait">
                {currentPage === "admin" ? (
                    <AdminLoginPage key="admin" onNavigateToKitchen={handleNavigateToKitchen} />
                ) : (
                    <KitchenLoginPage key="kitchen" onNavigateToAdmin={handleNavigateToAdmin} />
                )}
            </AnimatePresence>
        </div>
    );
}

export default function LoginSwitcher() {
    return (
        <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin"/></div>}>
            <LoginSwitcherContent />
        </Suspense>
    );
}
