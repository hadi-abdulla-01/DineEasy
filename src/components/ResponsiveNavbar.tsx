import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from '@/components/logo';

interface ResponsiveNavbarProps {
    onNavigateToHome?: () => void;
    onNavigateToAbout?: () => void;
    onNavigateToContact?: () => void;
}

function NavbarLogo() {
    return (
        <Logo className="h-6 w-auto text-[#9e090f]" />
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
            <div className="max-w-7xl mx-auto">
                {/* Mobile: Centered Logo with Absolute Hamburger */}
                <div className="md:hidden relative flex items-center justify-center">
                    <NavbarLogo />
                    <button
                        className="absolute right-0 p-2 text-black hover:text-[#9e090f] transition-colors z-50"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Tablet/Desktop: Normal Flex Layout */}
                <div className="hidden md:flex items-center justify-between">
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
                        <Link href="/login?role=admin" className="bg-[#9e090f] text-white font-['Mulish:Bold',sans-serif] text-[15px] md:text-[17px] leading-none px-6 py-2 md:px-7 md:py-2 rounded-full hover:bg-[#8a0810] transition-all font-bold">
                            Sign In
                        </Link>
                    </div>
                </div>
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
