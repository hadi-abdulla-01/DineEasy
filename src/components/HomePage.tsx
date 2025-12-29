import { motion } from "motion/react";
import svgPaths from "../imports/svg-xk929g7nkl";
import imgFlatChineseNewYearReunionDinnerIllustration1 from "../assets/e469a5ef4a653f0f58194891b580d935bd7fc2ba.png";
import Link from "next/link";

interface HomePageProps {
  onNavigateToAbout: () => void;
  onNavigateToContact: () => void;
}

/* ---------------- LOGO ---------------- */

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center h-[15.256px] w-[18.848px] rotate-[348.136deg] skew-x-[7.001deg]">
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 18.8479 15.2561"
        >
          <path d={svgPaths.p372f1e00} fill="#9E090F" />
        </svg>
      </div>
      <div className="font-['Mulish:Bold',sans-serif] font-bold text-[18px]">
        <span className="text-[#9e090f]">D</span>
        <span className="text-black">ineEzee</span>
      </div>
    </div>
  );
}

/* ---------------- HEADER ---------------- */

function Header({
  onNavigateToAbout,
  onNavigateToContact,
}: {
  onNavigateToAbout: () => void;
  onNavigateToContact: () => void;
}) {
  return (
    <header className="absolute left-[105px] right-[105px] top-[35px] flex items-center justify-between z-10">
      <Logo />

      <nav className="flex items-center gap-[60px]">
        <button className="font-['Mulish:Bold',sans-serif] font-bold text-[18px] text-[#9e090f]">
          Home
        </button>

        <button
          onClick={onNavigateToAbout}
          className="font-['Mulish:Bold',sans-serif] font-bold text-[18px] text-[#171717] hover:text-[#9e090f] transition-colors"
        >
          About us
        </button>

        <button
          onClick={onNavigateToContact}
          className="font-['Mulish:Bold',sans-serif] font-bold text-[18px] text-[#171717] hover:text-[#9e090f] transition-colors"
        >
          Contact
        </button>
      </nav>

      <Link href="/login?role=admin" className="bg-[#9e090f] text-white px-[28px] py-[8px] rounded-[25px] font-bold text-[18px] hover:bg-[#7a0709] hover:scale-105 transition-all">
        Sign In
      </Link>
    </header>
  );
}

/* ---------------- HERO CONTENT ---------------- */

function HeroContent() {
  return (
    <motion.div
      className="absolute left-[78px] top-[201px] z-10 max-w-[674px]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h1 className="font-['Mulish:Bold',sans-serif] font-bold text-[78px] leading-[91px] text-black mb-[30px]">
        Effortless Dining, Unforgettable Experience
      </h1>

      <p className="font-['Outfit:Medium',sans-serif] text-[18px] leading-[34px] text-[#5a5a5a] mb-[64px] max-w-[529px]">
        Revolutionize your restaurant with seamless QR code ordering. Increase
        efficiency, reduce wait times, and delight your customers.
      </p>

      <div className="flex gap-[20px]">
        <Link
          href="/login?role=kitchen"
          className="bg-[#9e090f] text-white px-[40px] py-[14px] rounded-[77px] text-[18px] hover:bg-[#7a0709] hover:scale-105 transition-all"
        >
          Kitchen Login
        </Link>

        <Link
          href="/login?role=admin"
          className="bg-[#f3f3f3] text-[#171717] px-[40px] py-[14px] rounded-[77px] text-[18px] hover:bg-[#e0e0e0] hover:scale-105 transition-all"
        >
          Admin Login
        </Link>
      </div>
    </motion.div>
  );
}

/* ---------------- HERO IMAGE ---------------- */

function HeroImage() {
  return (
    <motion.div
      className="absolute h-[388px] left-[calc(58.33%+27px)] top-[281px] w-[582px]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
    >
      <img
        alt="Family dining together illustration"
        src={imgFlatChineseNewYearReunionDinnerIllustration1.src}
        className="absolute inset-0 size-full object-cover pointer-events-none"
      />
    </motion.div>
  );
}

/* ---------------- PAGE ---------------- */

export function HomePage({
  onNavigateToAbout,
  onNavigateToContact,
}: HomePageProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* SCALE WRAPPER — KEEP CONSISTENT WITH OTHER PAGES */}
      <div
        className="origin-top-left"
        style={{
          transform: "scale(0.92)", // slightly better than 0.9 (less white gap)
          width: "108.7%",
          height: "108.7%",
        }}
      >
        <Header
          onNavigateToAbout={onNavigateToAbout}
          onNavigateToContact={onNavigateToContact}
        />
        <HeroContent />
        <HeroImage />
      </div>
    </div>
  );
}
