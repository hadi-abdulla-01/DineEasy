"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "motion/react";
import KitchenLoginPage from "./KitchenLoginPage";
import AdminLoginPage from "./AdminLoginPage";

type Page = "admin" | "kitchen";

function LoginSwitcherContent() {
    const searchParams = useSearchParams();
    const role = searchParams.get("role");

    // Initialize state based on query param, default to 'admin'
    const [currentPage, setCurrentPage] = useState<Page>(() => {
        return role === "kitchen" ? "kitchen" : "admin";
    });

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
        <Suspense fallback={<div className="w-full h-screen bg-[#f1b715]" />}>
            <LoginSwitcherContent />
        </Suspense>
    );
}
