import { motion } from "motion/react";
import Link from "next/link";
import svgPaths from "../imports/svg-ltqdfmwwoe";
import imgScan11 from "../assets/daca942be80c946208617dc9f1a38f8d2626ebc9.png";

interface AboutPageProps {
  onNavigateToHome: () => void;
  onNavigateToContact: () => void;
}

/* ---------------- LOGO (MATCH HOME) ---------------- */

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
          <path d={svgPaths.p3188aa80} fill="#9E090F" />
        </svg>
      </div>
      <div className="font-['Mulish:Bold',sans-serif] font-bold text-[18px]">
        <span className="text-[#9e090f]">D</span>
        <span className="text-black">ineEzee</span>
      </div>
    </div>
  );
}

/* ---------------- HEADER (MATCH HOME) ---------------- */

function Header({
  onNavigateToHome,
  onNavigateToContact,
}: {
  onNavigateToHome: () => void;
  onNavigateToContact: () => void;
}) {
  return (
    <header className="absolute left-[105px] right-[105px] top-[35px] flex items-center justify-between z-10">
      <Logo />

      <nav className="flex items-center gap-[60px]">
        <button
          onClick={onNavigateToHome}
          className="font-bold text-[18px] text-[#171717] hover:text-[#9e090f] transition-colors"
        >
          Home
        </button>

        <button className="font-bold text-[18px] text-[#9e090f]">
          About us
        </button>

        <button
          onClick={onNavigateToContact}
          className="font-bold text-[18px] text-[#171717] hover:text-[#9e090f] transition-colors"
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

/* ---------------- HERO IMAGE (NO CARD) ---------------- */

function HeroImage() {
  return (
    <motion.div
      className="absolute h-[412px] left-[-83px] top-[256px] w-[619px]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <img
        alt="QR code scanning illustration"
        src={imgScan11.src}
        className="absolute inset-0 size-full object-contain pointer-events-none"
      />
    </motion.div>
  );
}

/* ---------------- PROCESS CARD ---------------- */

function ProcessCard({
  icon,
  title,
  description,
  leftPosition,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  leftPosition: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`absolute ${leftPosition} top-[415px]`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="bg-white h-[265.529px] rounded-[22.853px] shadow-[0px_4.353px_43.529px_rgba(0,0,0,0.1)] w-[222px] hover:-translate-y-2 transition-all" />
      <div className="absolute size-[52px] left-[85px] top-[50px]">
        {icon}
      </div>
      <div className="absolute font-bold left-[111px] top-[122px] text-[26px] text-center translate-x-[-50%] w-[158px]">
        {title}
      </div>
      <div className="absolute font-bold left-[111px] top-[185px] text-[14px] text-center text-[rgba(0,0,0,0.61)] translate-x-[-50%] w-[188px]">
        {description}
      </div>
    </motion.div>
  );
}

/* ---------------- ICONS (UNCHANGED) ---------------- */

function ScanIcon() {
  return (
    <svg className="block size-full" fill="none" viewBox="0 0 52 52">
      <path d={svgPaths.p3201aa00} stroke="black" strokeWidth="4.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p79456e0} stroke="black" strokeWidth="4.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p359b5900} stroke="black" strokeWidth="4.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p39e63e00} stroke="black" strokeWidth="4.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M45.5 45.5V45.5217" stroke="black" strokeWidth="4.33333" strokeLinecap="round" />
      <path d={svgPaths.pba90180} stroke="black" strokeWidth="4.33333" strokeLinecap="round" />
      <path d="M6.5 26H6.52167" stroke="black" strokeWidth="4.33333" strokeLinecap="round" />
      <path d="M26 6.5H26.0217" stroke="black" strokeWidth="4.33333" strokeLinecap="round" />
      <path d="M26 34.6667V34.6883" stroke="black" strokeWidth="4.33333" strokeLinecap="round" />
      <path d="M34.6667 26H36.8333" stroke="black" strokeWidth="4.33333" strokeLinecap="round" />
      <path d="M45.5 26V26.0217" stroke="black" strokeWidth="4.33333" strokeLinecap="round" />
      <path d="M26 45.5V43.3333" stroke="black" strokeWidth="4.33333" strokeLinecap="round" />
    </svg>
  );
}


function OrderIcon() {
  return (
    <svg className="block size-full" fill="none" viewBox="0 0 52 52">
      <path d={svgPaths.p231b1a00} stroke="black" strokeWidth="4.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 39H26.0217" stroke="black" strokeWidth="4.33333" strokeLinecap="round" />
    </svg>
  );
}


function EnjoyIcon() {
  return (
    <svg className="block size-full" fill="none" viewBox="0 0 52 52">
      <path d={svgPaths.p3e6c0080} stroke="black" strokeWidth="4.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.1667 4.33333V47.6667" stroke="black" strokeWidth="4.33333" strokeLinecap="round" />
      <path d={svgPaths.p2234e080} stroke="black" strokeWidth="4.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


/* ---------------- PAGE ---------------- */

export function AboutPage({
  onNavigateToHome,
  onNavigateToContact,
}: AboutPageProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* SCALE WRAPPER — MATCH HOME & CONTACT */}
      <div
        className="origin-top-left"
        style={{
          transform: "scale(0.92)",
          width: "108.7%",
          height: "108.7%",
        }}
      >
        <Header
          onNavigateToHome={onNavigateToHome}
          onNavigateToContact={onNavigateToContact}
        />

        <HeroImage />

        {/* Heading */}
        <motion.div
          className="absolute left-1/2 top-[179.5px] w-[773px] text-[66px] font-bold text-center translate-x-[-50%]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Simple 3-Step Process
        </motion.div>

        {/* Subtitle */}
        <motion.div
          className="absolute left-1/2 top-[350.5px] w-[604px] text-[18px] text-center text-[rgba(0,0,0,0.75)] translate-x-[-50%]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          We've streamlined the dining experience to be as simple and intuitive
          as possible for both you and your customers.
        </motion.div>

        {/* Cards */}
        <ProcessCard
          icon={<ScanIcon />}
          title="Scan"
          description="Customers scan a QR code at their table for dine-in orders."
          leftPosition="left-[calc(41.67%+79px)]"
          delay={0.2}
        />

        <ProcessCard
          icon={<OrderIcon />}
          title="Order"
          description="They browse the menu and place their order directly from their phone."
          leftPosition="left-[calc(58.33%+77px)]"
          delay={0.25}
        />

        <ProcessCard
          icon={<EnjoyIcon />}
          title="Enjoy"
          description="The kitchen receives the order instantly. Food is served fresh and fast."
          leftPosition="left-[calc(83.33%-48px)]"
          delay={0.3}
        />
      </div>
    </div>
  );
}
