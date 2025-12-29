import { motion } from "motion/react";
import Link from "next/link";
import svgPaths from "../imports/svg-lrnqheam3z";
import { Mail, Phone, MapPin, Send, Facebook, Instagram, Twitter } from "lucide-react";

interface ContactPageProps {
  onNavigateToHome: () => void;
  onNavigateToAbout: () => void;
}

function Logo() {
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

function Header({
  onNavigateToHome,
  onNavigateToAbout,
}: {
  onNavigateToHome: () => void;
  onNavigateToAbout: () => void;
}) {
  return (
    <header className="absolute left-[105px] right-[105px] top-[35px] flex items-center justify-between z-10">
      <Logo />

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

export function ContactPage({ onNavigateToHome, onNavigateToAbout }: ContactPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 overflow-hidden"
    >
      {/* SCALE CONTENT ONLY */}
      <div
        className="absolute inset-0 origin-top-left"
        style={{
          transform: "scale(0.9)",
          width: "111.11%",
          height: "111.11%",
        }}
      >
        <Header
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
  );
}
