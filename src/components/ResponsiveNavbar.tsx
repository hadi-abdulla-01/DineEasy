import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import svgPaths from "../imports/svg-xk929g7nkl"; // Using HomePage paths as base

interface ResponsiveNavbarProps {
    onNavigateToHome?: () => void;
    onNavigateToAbout?: () => void;
    onNavigateToContact?: () => void;
}

function NavbarLogo() {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-6 w-5">
                <svg
                    className="block size-full"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 13.0569 16.6654"
                >
                    <path d={svgPaths.p372f1e00} fill="#9E090F" />
                </svg>
            </div>
            <p className="font-['Mulish:Bold',sans-serif] text-[17px] md:text-[19.5px] leading-none text-[#9e090f] font-bold">
                D<span className="text-black font-bold">ineEzee</span>
            </p>
        </div>
    );
}

export function ResponsiveNavbar({
    onNavigateToHome,
    onNavigateToAbout,
    onNavigateToContact,
}: ResponsiveNavbarProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="w-full bg-[#ffce46] px-4 py-6 md:px-8 z-50 relative">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <NavbarLogo />

                {/* Tablet Navigation (Visible md:flex, Hidden on Mobile) */}
                <nav className="hidden md:flex items-center gap-8">
                    <button
                        onClick={onNavigateToHome}
                        className={`font-['Mulish:Bold',sans-serif] text-[15px] md:text-[17px] leading-none transition-colors font-bold ${onNavigateToHome ? "text-[#171717] hover:text-[#9e090f]" : "text-[#9e090f]"
                            }`}
                    >
                        Home
                    </button>
                    <button
                        onClick={onNavigateToAbout}
                        className={`font-['Mulish:Bold',sans-serif] text-[15px] md:text-[17px] leading-none transition-colors font-bold ${onNavigateToAbout ? "text-[#171717] hover:text-[#9e090f]" : "text-[#9e090f]"
                            }`}
                    >
                        About us
                    </button>
                    <button
                        onClick={onNavigateToContact}
                        className={`font-['Mulish:Bold',sans-serif] text-[15px] md:text-[17px] leading-none transition-colors font-bold ${onNavigateToContact ? "text-[#171717] hover:text-[#9e090f]" : "text-[#9e090f]"
                            }`}
                    >
                        Contact
                    </button>
                </nav>

                {/* Tablet Sign In Button */}
                <div className="hidden md:block">
                    {/* Using Yellow text for Tablet to match HomePage design, or White to match others? User asked specifically for "hamburger menu" sign in to be white. Tablet is 'navbar' style. Let's use White for consistency if allowed, or stick to the mixed style. I'll use White for better contrast on Red. */}
                    <Link href="/login?role=admin" className="bg-[#9e090f] text-white font-['Mulish:Bold',sans-serif] text-[15px] md:text-[17px] leading-none px-6 py-2 md:px-7 md:py-2 rounded-full hover:bg-[#8a0810] transition-all font-bold">
                        Sign In
                    </Link>
                </div>

                {/* Mobile Hamburger Button */}
                <button
                    className="md:hidden p-2 text-black hover:text-[#9e090f] transition-colors z-50"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <nav className="md:hidden mt-4 flex flex-col gap-4 pb-4 px-2">
                    <button
                        onClick={() => { if (onNavigateToHome) onNavigateToHome(); setIsOpen(false); }}
                        className={`block font-['Mulish:Bold',sans-serif] text-[15px] leading-none transition-opacity py-2 w-full text-left font-bold border-b border-black/10 ${onNavigateToHome ? "text-[#171717] hover:text-[#9e090f]" : "text-[#9e090f]"
                            }`}
                    >
                        Home
                    </button>
                    <button
                        onClick={() => { if (onNavigateToAbout) onNavigateToAbout(); setIsOpen(false); }}
                        className={`block font-['Mulish:Bold',sans-serif] text-[15px] leading-none transition-colors py-2 w-full text-left font-bold border-b border-black/10 ${onNavigateToAbout ? "text-[#171717] hover:text-[#9e090f]" : "text-[#9e090f]"
                            }`}
                    >
                        About us
                    </button>
                    <button
                        onClick={() => { if (onNavigateToContact) onNavigateToContact(); setIsOpen(false); }}
                        className={`block font-['Mulish:Bold',sans-serif] text-[15px] leading-none transition-colors py-2 w-full text-left font-bold border-b border-black/10 ${onNavigateToContact ? "text-[#171717] hover:text-[#9e090f]" : "text-[#9e090f]"
                            }`}
                    >
                        Contact
                    </button>
                    <Link href="/login?role=admin" className="bg-[#9e090f] text-white font-['Mulish:Bold',sans-serif] text-[15px] leading-none px-7 py-2 rounded-[25px] mt-2 text-center font-bold block">
                        Sign In
                    </Link>
                </nav>
            )}
        </header>
    );
}
