import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import svgPaths from "../imports/svg-lrnqheam3z";
import { Mail, Phone, MapPin, Send, Facebook, Instagram, Twitter, Menu, X } from "lucide-react";
import { ResponsiveNavbar } from "./ResponsiveNavbar";

interface ContactPageProps {
  onNavigateToHome: () => void;
  onNavigateToAbout: () => void;
}

/* ================ ICONS (Shared/Mobile) ================ */

function MobileLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center h-[17px] w-[17px] rotate-[344.98deg]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
          <path d={svgPaths.p191d3c00} fill="#9E090F" />
        </svg>
      </div>
      <div className="font-['Mulish:Bold',sans-serif] font-bold text-[18px]">
        <span className="text-[#9e090f]">D</span>
        <span className="text-black">ineEzee</span>
      </div>
    </div>
  );
}

/* ================ MOBILE COMPONENTS ================ */

function MobileHeader({
  onNavigateToHome,
  onNavigateToAbout,
}: {
  onNavigateToHome: () => void;
  onNavigateToAbout: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="relative w-full px-4 py-6 md:px-8 bg-[#ffce46]">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Tablet Layout (md:flex) - Visible on Tablet, Hidden on Mobile */}
        <div className="hidden md:flex items-center justify-between gap-8 relative w-full">
          <div className="flex items-center gap-2">
            <MobileLogo />
          </div>

          <div className="flex items-center gap-8">
            <button onClick={onNavigateToHome} className="font-['Mulish',sans-serif] font-bold text-[18px] text-black hover:text-[#9e090f] transition-colors">
              Home
            </button>
            <button onClick={onNavigateToAbout} className="font-['Mulish',sans-serif] font-bold text-[18px] text-black hover:text-[#9e090f] transition-colors">
              About us
            </button>
            <button className="font-['Mulish',sans-serif] font-bold text-[18px] text-[#9e090f]">
              Contact
            </button>
          </div>

          <div className="flex items-center">
            <Link href="/login?role=admin" className="bg-[#9e090f] text-[#ffce46] font-['Mulish',sans-serif] font-bold text-[18px] px-7 py-2 rounded-[25px] hover:bg-[#7a0709] transition-colors">
              Sign In
            </Link>
          </div>
        </div>

        {/* Mobile Layout (md:hidden) */}
        <div className="md:hidden flex items-center justify-between w-full">
          <MobileLogo />

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden z-50 p-2 text-black hover:text-[#9e090f] transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-4 pb-4">
          <button
            onClick={() => { onNavigateToHome(); setIsMenuOpen(false); }}
            className="text-black text-lg py-2 hover:text-[#9e090f] transition-colors text-left border-b border-black/10 font-bold"
          >
            Home
          </button>
          <button
            onClick={() => { onNavigateToAbout(); setIsMenuOpen(false); }}
            className="text-black text-lg py-2 hover:text-[#9e090f] transition-colors text-left border-b border-black/10 font-bold"
          >
            About us
          </button>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="text-[#9e090f] text-lg py-2 hover:opacity-80 transition-opacity text-left border-b border-black/10 font-bold"
          >
            Contact
          </button>
          <Link href="/login?role=admin" className="bg-[#9e090f] text-[#ffce46] px-7 py-2 rounded-[25px] mt-2 text-center font-bold">
            Sign In
          </Link>
        </div>
      )}
    </nav>
  );
}

function MobileContactInfo() {
  return (
    <div className="bg-[#eee] rounded-3xl p-6 md:p-8">
      <h2 className="text-[#ffce46] text-3xl md:text-4xl font-['Poppins:Bold',sans-serif] font-bold mb-6 md:mb-8 text-center md:text-left">
        Contact Us
      </h2>

      <div className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex gap-4 items-center p-4 rounded-2xl transition-all border-[2px] border-transparent bg-white/30 hover:bg-[rgba(158,9,15,0.1)] hover:border-[#9e090f] cursor-pointer">
          <Mail className="size-6 text-[#9e090f]" />
          <p className="text-[#000] text-base md:text-lg font-['Poppins:Medium',sans-serif] font-medium">
            dineezee@gmail.com
          </p>
        </div>

        {/* Phone */}
        <div className="flex gap-4 items-center p-4 rounded-2xl transition-all border-[2px] border-transparent bg-white/30 hover:bg-[rgba(158,9,15,0.1)] hover:border-[#9e090f] cursor-pointer">
          <Phone className="size-6 text-[#9e090f]" />
          <p className="text-[#000] text-base md:text-lg font-['Poppins:Medium',sans-serif] font-medium">
            +123 456 789
          </p>
        </div>

        {/* Address */}
        <div className="flex gap-4 items-center p-4 rounded-2xl transition-all border-[2px] border-transparent bg-white/30 hover:bg-[rgba(158,9,15,0.1)] hover:border-[#9e090f] cursor-pointer">
          <MapPin className="size-6 text-[#9e090f]" />
          <p className="text-[#000] text-base md:text-lg font-['Poppins:Medium',sans-serif] font-medium">
            123 Street 456 House
          </p>
        </div>
      </div>
    </div>
  );
}

function MobileContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  return (
    <div className="bg-[#eee] rounded-3xl p-6 md:p-8">
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
        {/* Name Input */}
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Your name"
            className="bg-transparent border-b-[2px] border-[#9e090f] pb-2 text-lg text-black placeholder:text-black/40 outline-none font-['Poppins:Medium',sans-serif] focus:border-[#9e090f] transition-colors"
          />
        </div>

        {/* Email Input */}
        <div className="flex flex-col gap-2">
          <input
            type="email"
            placeholder="Your email"
            className="bg-transparent border-b-[2px] border-[#9e090f]/30 pb-2 text-lg text-black placeholder:text-black/40 outline-none font-['Poppins:Medium',sans-serif] focus:border-[#9e090f] transition-colors"
          />
        </div>

        {/* Message Input */}
        <div className="flex flex-col gap-2">
          <textarea
            placeholder="Your message"
            rows={4}
            className="bg-transparent border-b-[2px] border-[#9e090f]/30 pb-2 text-lg text-black placeholder:text-black/40 outline-none font-['Poppins:Medium',sans-serif] focus:border-[#9e090f] transition-colors resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          className="bg-[#9e090f] text-white rounded-2xl px-8 py-3 flex items-center justify-center gap-3 self-start hover:bg-[#7a0709] transition-all"
        >
          <Send className="size-5" />
          <span className="text-lg font-bold font-['Poppins:Medium',sans-serif]">Send Message</span>
        </button>
      </form>
    </div>
  );
}

/* ================ DESKTOP COMPONENTS (Original) ================ */

function DesktopLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center h-[17px] w-[17px] rotate-[344.98deg]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
          <path d={svgPaths.p191d3c00} fill="#9E090F" />
        </svg>
      </div>
      <div className="font-['Mulish:Bold',sans-serif] font-bold text-[18px]">
        <span className="text-[#9e090f]">D</span>
        <span className="text-black">ineEzee</span>
      </div>
    </div>
  );
}

function DesktopHeader({
  onNavigateToHome,
  onNavigateToAbout,
}: {
  onNavigateToHome: () => void;
  onNavigateToAbout: () => void;
}) {
  return (
    <header className="absolute left-[105px] right-[105px] top-[35px] flex items-center justify-between z-10">
      <DesktopLogo />

      <nav className="flex items-center gap-[60px]">
        <button
          onClick={onNavigateToHome}
          className="font-['Mulish:Bold',sans-serif] font-bold text-[18px] text-black hover:text-[#9e090f]"
        >
          Home
        </button>
        <button
          onClick={onNavigateToAbout}
          className="font-['Mulish:Bold',sans-serif] font-bold text-[18px] text-black hover:text-[#9e090f]"
        >
          About us
        </button>
        <button className="font-['Mulish:Bold',sans-serif] font-bold text-[18px] text-[#9e090f]">
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

export function ContactPage({ onNavigateToHome, onNavigateToAbout }: ContactPageProps) {
  return (
    <>
      {/* ================= MOBILE/TABLET VIEW (< 1024px) ================= */}
      <div className="lg:hidden h-screen w-full overflow-x-hidden overflow-y-auto bg-[#ffce46]">
        <ResponsiveNavbar
          onNavigateToHome={onNavigateToHome}
          onNavigateToAbout={onNavigateToAbout}
        />

        <main className="px-4 md:px-8 pb-12">
          <div className="max-w-7xl mx-auto flex flex-col gap-8 md:gap-12 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <MobileContactInfo />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <MobileContactForm />
            </motion.div>
          </div>
        </main>

        <footer className="py-8 text-center">
          <p className="text-black/60 text-sm">
            © 2026 DineEzee. All rights reserved.
          </p>
        </footer>
      </div>

      {/* ================= DESKTOP VIEW (>= 1024px) ================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="hidden lg:block absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute inset-0 origin-top-left"
          style={{
            transform: "scale(0.92)",
            width: "108.7%",
            height: "108.7%",
          }}
        >
          <DesktopHeader
            onNavigateToHome={onNavigateToHome}
            onNavigateToAbout={onNavigateToAbout}
          />

          {/* Heading */}
          <motion.h1
            className="absolute left-[179px] top-[152px] text-[48px] text-[#eee] font-['Poppins:Bold',sans-serif] w-[646px]"
          >
            Contact Us
          </motion.h1>

          {/* Contact Info */}
          <motion.div className="absolute left-[145px] top-[251px] w-[399px] flex flex-col gap-[24px]">

            {/* EMAIL */}
            <div className="
              flex items-center gap-[16px] py-[24px] px-[24px] rounded-[16px]
              cursor-pointer transition-all duration-300
              hover:bg-[rgba(158,9,15,0.15)]
              hover:border-[3px] hover:border-[#9e090f]
            ">
              <Mail className="size-[24px] text-[#9e090f]" />
              <p className="text-[20px] text-white font-['Poppins:Medium',sans-serif]">
                dineezee@gmail.com
              </p>
            </div>

            {/* PHONE */}
            <div className="
              flex items-center gap-[16px] py-[24px] px-[24px] rounded-[16px]
              cursor-pointer transition-all duration-300
              hover:bg-[rgba(158,9,15,0.5)]
              hover:border-[3px] hover:border-[#9e090f]
            ">
              <Phone className="size-[24px] text-[#9e090f]" />
              <p className="text-[20px] text-white font-['Poppins:Medium',sans-serif]">
                +123 456 789
              </p>
            </div>

            {/* ADDRESS */}
            <div className="
              flex items-center gap-[16px] py-[24px] px-[24px] rounded-[16px]
              cursor-pointer transition-all duration-300
              hover:bg-[rgba(158,9,15,0.15)]
              hover:border-[3px] hover:border-[#9e090f]
            ">
              <MapPin className="size-[24px] text-[#9e090f]" />
              <p className="text-[20px] text-white font-['Poppins:Medium',sans-serif]">
                123 Street 456 House
              </p>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div className="absolute left-[calc(33.33%+123px)] top-[200px] w-[722px] h-[896px] bg-[#eee] rounded-[44px]">
            <div className="absolute left-[48px] top-[48px] flex flex-col gap-[64px]">
              {["Your name", "Your email", "Your message"].map((placeholder, i) => (
                <div key={i} className="flex flex-col gap-[8px]">
                  <input
                    placeholder={placeholder}
                    className="bg-transparent text-[20px] outline-none font-['Poppins:Medium',sans-serif]"
                  />
                  <div className="h-[3px] w-[600px] bg-[#9e090f] opacity-50" />
                </div>
              ))}
            </div>

            <button className="absolute left-[33px] top-[448px] flex items-center gap-[16px] px-[64px] py-[24px] bg-[#9e090f] rounded-[16px] hover:bg-[#7a0709] hover:scale-105 transition-all">
              <Send className="size-[24px] text-[#eee]" />
              <span className="text-[20px] text-[#eee] font-['Poppins:Medium',sans-serif]">
                Send Message
              </span>
            </button>
          </motion.div>

          {/* Social Icons */}
          <motion.div className="absolute left-[151px] top-[941px] w-[228px] flex justify-between">
            {[Facebook, Instagram, Twitter].map((Icon, i) => (
              <button
                key={i}
                className="size-[64px] rounded-full bg-[#eee] flex items-center justify-center hover:scale-110 transition-all"
              >
                <Icon className="size-[24px] text-[#9e090f]" />
              </button>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
