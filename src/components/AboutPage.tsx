import { motion } from "motion/react";
import Link from "next/link";
import svgPaths from "../imports/svg-ltqdfmwwoe";
import imgScan11 from "../assets/daca942be80c946208617dc9f1a38f8d2626ebc9.png";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ResponsiveNavbar } from "./ResponsiveNavbar";

interface AboutPageProps {
  onNavigateToHome: () => void;
  onNavigateToContact: () => void;
}

/* ================ ICONS ================ */

function ScanIcon() {
  return (
    <div className="w-[52px] h-[52px] mb-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 52 52">
        <g>
          <path d={svgPaths.p3201aa00} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
          <path d={svgPaths.p79456e0} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
          <path d={svgPaths.p359b5900} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
          <path d={svgPaths.p39e63e00} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
          <path d="M45.5 45.5V45.5217" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
          <path d={svgPaths.pba90180} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
          <path d="M6.5 26H6.52167" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
          <path d="M26 6.5H26.0217" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
          <path d="M26 34.6667V34.6883" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
          <path d="M34.6667 26H36.8333" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
          <path d="M45.5 26V26.0217" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
          <path d="M26 45.5V43.3333" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
        </g>
      </svg>
    </div>
  );
}

function PhoneIcon() {
  return (
    <div className="w-[52px] h-[52px] mb-6">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 52 52">
        <g>
          <path d={svgPaths.p231b1a00} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
          <path d="M26 39H26.0217" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
        </g>
      </svg>
    </div>
  );
}

function UtensilsIcon() {
  return (
    <div className="w-[52px] h-[52px] mb-6">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 52 52">
        <g>
          <path d={svgPaths.p3e6c0080} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
          <path d="M15.1667 4.33333V47.6667" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
          <path d={svgPaths.p2234e080} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
        </g>
      </svg>
    </div>
  );
}

/* ================ MOBILE LAYOUT COMPONENTS (From src copy) ================ */

function MobileLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-[18.793px] items-center justify-center w-[13.318px]">
        <div className="flex-none rotate-[351.687deg] skew-x-[343.047deg]">
          <div className="h-[17.503px] relative w-[10.559px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.5594 17.503">
              <path d={svgPaths.p3188aa80} fill="#9E090F" />
            </svg>
          </div>
        </div>
      </div>
      <div className="font-['Mulish',sans-serif] font-bold text-[18px] text-[#9e090f]">
        D<span className="text-black">ineEzee</span>
      </div>
    </div>
  );
}

function MobileHeader({
  onNavigateToHome,
  onNavigateToContact,
}: {
  onNavigateToHome: () => void;
  onNavigateToContact: () => void;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-[#ffce46] px-4 py-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Tablet Layout (md:flex) - Visible on Tablet, Hidden on Mobile */}
        <div className="hidden md:flex items-center justify-between gap-8 relative">
          <div className="flex items-center gap-2">
            <MobileLogo />
          </div>

          <nav className="flex items-center gap-8 relative left-[-20px]">
            <button onClick={onNavigateToHome} className="font-['Mulish',sans-serif] font-bold text-[18px] text-black hover:text-[#9e090f] transition-colors">
              Home
            </button>
            <button className="font-['Mulish',sans-serif] font-bold text-[18px] text-[#9e090f]">
              About us
            </button>
            <button onClick={onNavigateToContact} className="font-['Mulish',sans-serif] font-bold text-[18px] text-[#171717] hover:text-[#9e090f] transition-colors">
              Contact
            </button>
          </nav>

          <div className="flex items-center">
            <Link href="/login?role=admin" className="bg-[#9e090f] text-[#ffce46] font-['Mulish',sans-serif] font-bold text-[18px] px-7 py-2 rounded-[25px] hover:bg-[#7a0709] transition-colors">
              Sign In
            </Link>
          </div>
        </div>

        {/* Mobile Layout (md:hidden) - Hamburger Menu */}
        <div className="md:hidden flex items-center justify-between">
          <MobileLogo />

          <button
            className="p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-black" />
            ) : (
              <Menu className="w-6 h-6 text-black" />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav className="md:hidden mt-4 flex flex-col gap-4 pb-4">
          <button onClick={() => { onNavigateToHome(); setIsMobileMenuOpen(false); }} className="font-['Mulish',sans-serif] font-bold text-[18px] text-black py-2 border-b border-black/10 text-left">
            Home
          </button>
          <button onClick={() => setIsMobileMenuOpen(false)} className="font-['Mulish',sans-serif] font-bold text-[18px] text-[#9e090f] py-2 border-b border-black/10 text-left">
            About us
          </button>
          <button onClick={() => { onNavigateToContact(); setIsMobileMenuOpen(false); }} className="font-['Mulish',sans-serif] font-bold text-[18px] text-[#171717] py-2 border-b border-black/10 text-left">
            Contact
          </button>
          <Link href="/login?role=admin" className="bg-[#9e090f] text-[#ffce46] font-['Mulish',sans-serif] font-bold text-[18px] px-7 py-2 rounded-[25px] mt-2 text-center">
            Sign In
          </Link>
        </nav>
      )}
    </header>
  );
}

function MobileStepCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-[#ffe088] rounded-[22.853px] shadow-[0px_4.353px_43.529px_0px_rgba(0,0,0,0.1)] p-8 flex flex-col items-center text-center w-full md:w-[222px] min-h-[265.529px]">
      <div className="mb-4 mt-4">
        {icon}
      </div>
      <h3 className="font-['Mulish',sans-serif] font-bold text-[26px] text-black mb-4">{title}</h3>
      <p className="font-['Mulish',sans-serif] font-bold text-[14px] text-[rgba(0,0,0,0.61)] leading-normal">{description}</p>
    </div>
  );
}

/* ================ DESKTOP COMPONENTS (New Grid Layout) ================ */

function DesktopHeader({
  onNavigateToHome,
  onNavigateToContact,
}: {
  onNavigateToHome: () => void;
  onNavigateToContact: () => void;
}) {
  return (
    <header className="absolute left-[105px] right-[105px] top-[35px] flex items-center justify-between z-10">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center h-[15.256px] w-[18.848px] rotate-[348.136deg] skew-x-[7.001deg]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.8479 15.2561">
            <path d={svgPaths.p3188aa80} fill="#9E090F" />
          </svg>
        </div>
        <div className="font-['Mulish:Bold',sans-serif] font-bold text-[18px]">
          <span className="text-[#9e090f]">D</span>
          <span className="text-black">ineEzee</span>
        </div>
      </div>

      <nav className="flex items-center gap-[60px]">
        <button onClick={onNavigateToHome} className="font-bold text-[18px] text-[#171717] hover:text-[#9e090f] transition-colors">
          Home
        </button>
        <button className="font-bold text-[18px] text-[#9e090f]">
          About us
        </button>
        <button onClick={onNavigateToContact} className="font-bold text-[18px] text-[#171717] hover:text-[#9e090f] transition-colors">
          Contact
        </button>
      </nav>

      <Link href="/login?role=admin" className="bg-[#9e090f] text-white px-[28px] py-[8px] rounded-[25px] font-bold text-[18px] hover:bg-[#7a0709] hover:scale-105 transition-all">
        Sign In
      </Link>
    </header>
  );
}

/* ================ MAIN PAGE COMPONENT ================ */

export function AboutPage({
  onNavigateToHome,
  onNavigateToContact,
}: AboutPageProps) {
  return (
    <div className="min-h-screen relative overflow-x-hidden">

      {/* ================= MOBILE VIEW (< 1024px) ================= */}
      <div className="lg:hidden h-screen w-full overflow-x-hidden overflow-y-auto bg-[#ffce46]">
        <ResponsiveNavbar
          onNavigateToHome={onNavigateToHome}
          onNavigateToContact={onNavigateToContact}
        />

        <main className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Hero */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="py-8 md:py-12 text-center"
          >
            <h1 className="font-['Mulish',sans-serif] font-bold text-[40px] leading-[50px] text-black mb-4 md:mb-6 capitalize">
              Simple 3-Step Process
            </h1>
            <p className="font-['Mulish',sans-serif] font-medium text-[18px] leading-normal text-[rgba(0,0,0,0.75)] max-w-3xl mx-auto px-4">
              We've streamlined the dining experience to be as simple and intuitive as possible for both you and your customers.
            </p>
          </motion.section>

          {/* Cards */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="py-8 md:py-12 pb-16 md:pb-24"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 place-items-center">
              <MobileStepCard
                icon={<ScanIcon />}
                title="Scan"
                description="Customers scan a QR code at their table for dine-in orders."
              />
              <MobileStepCard
                icon={<PhoneIcon />}
                title="Order"
                description="They browse the menu and place their order directly from their phone."
              />
              <MobileStepCard
                icon={<UtensilsIcon />}
                title="Enjoy"
                description="The kitchen receives the order instantly. Food is served fresh and fast."
              />
            </div>
          </motion.section>
        </main>
      </div>

      {/* ================= DESKTOP VIEW (>= 1024px) ================= */}
      <div className="hidden lg:block min-h-screen w-full relative">
        <div style={{ transform: "scale(0.92)", transformOrigin: "top left", width: "108.7%", height: "108.7%" }}>
          <DesktopHeader
            onNavigateToHome={onNavigateToHome}
            onNavigateToContact={onNavigateToContact}
          />

          <div className="flex h-screen items-center relative pt-20">
            {/* Left Column: Image */}
            <div className="w-1/2 flex justify-start pl-4 relative z-10 mt-10">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <img
                  src={imgScan11.src}
                  alt="QR Code Scan"
                  className="max-w-[536px] w-full h-auto rounded-[125px]"
                />
              </motion.div>
            </div>

            {/* Right Column: Content */}
            <div className="w-1/2 flex flex-col pl-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-12"
              >
                <h1 className="font-['Mulish',sans-serif] font-bold text-[66px] leading-tight text-black mb-4 whitespace-nowrap">
                  Simple 3-Step Process
                </h1>
                <p className="font-['Mulish',sans-serif] font-medium text-[18px] text-[rgba(0,0,0,0.75)] max-w-[600px]">
                  We've streamlined the dining experience to be as simple and intuitive as possible for both you and your customers.
                </p>
              </motion.div>

              <div className="flex gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-white rounded-[22.853px] shadow-[0px_4.353px_43.529px_0px_rgba(0,0,0,0.1)] p-8 flex flex-col items-center text-center w-[222px] min-h-[265px] hover:-translate-y-2 transition-transform duration-300"
                >
                  <ScanIcon />
                  <h3 className="text-[26px] font-bold mb-4">Scan</h3>
                  <p className="text-[14px] text-gray-600">Customers scan a QR code at their table for dine-in orders.</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-white rounded-[22.853px] shadow-[0px_4.353px_43.529px_0px_rgba(0,0,0,0.1)] p-8 flex flex-col items-center text-center w-[222px] min-h-[265px] hover:-translate-y-2 transition-transform duration-300"
                >
                  <PhoneIcon />
                  <h3 className="text-[26px] font-bold mb-4">Order</h3>
                  <p className="text-[14px] text-gray-600">They browse the menu and place their order directly from their phone.</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="bg-white rounded-[22.853px] shadow-[0px_4.353px_43.529px_0px_rgba(0,0,0,0.1)] p-8 flex flex-col items-center text-center w-[222px] min-h-[265px] hover:-translate-y-2 transition-transform duration-300"
                >
                  <UtensilsIcon />
                  <h3 className="text-[26px] font-bold mb-4">Enjoy</h3>
                  <p className="text-[14px] text-gray-600">The kitchen receives the order instantly. Food is served fresh and fast.</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
