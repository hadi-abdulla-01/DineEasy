import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import AdminLoginPage from "./components/AdminLoginPage";
import KitchenLoginPage from "./components/KitchenLoginPage";

type Page = "admin" | "kitchen";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("admin");

  const handleNavigateToKitchen = () => {
    setCurrentPage("kitchen");
  };

  const handleNavigateToAdmin = () => {
    setCurrentPage("admin");
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-[#f1b715]">
      <AnimatePresence mode="wait" initial={false}>
        {currentPage === "admin" ? (
          <AdminLoginPage key="admin" onNavigateToKitchen={handleNavigateToKitchen} />
        ) : (
          <KitchenLoginPage key="kitchen" onNavigateToAdmin={handleNavigateToAdmin} />
        )}
      </AnimatePresence>
    </div>
  );
}