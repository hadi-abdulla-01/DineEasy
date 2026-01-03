"use client";

import { useState } from "react";
import { motion } from "motion/react";
import svgPaths from "../imports/svg-6hzyqt81bp";
import imgImage1 from "@/assets/admin-login-illustration.png";
import { useAuth } from "@/app/admin/auth-provider";
import { signInWithEmail } from "@/lib/auth";

interface AdminLoginPageProps {
  onNavigateToKitchen: () => void;
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#e0e2e9] border-[1.604px] border-solid inset-[-0.802px] pointer-events-none rounded-[8.802px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[16px] items-center px-[20px] py-[12px] relative w-full">{children}</div>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="[grid-area:1_/_1] h-[17.2px] ml-0 mt-0 relative w-[21.5px]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.5001 17.2001">
        <g id="Group">
          <path d={svgPaths.p284e0100} fill="var(--fill-0, #ADB0CD)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group1() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0" data-name="Group">
      <Group />
    </div>
  );
}

function Frame1({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <Wrapper>
      <Group1 />
      <input
        type="email"
        placeholder="Email Address"
        value={value}
        onChange={onChange}
        className="w-full outline-none text-[#969ab8] text-[14px] font-['Poppins:Medium',sans-serif] placeholder:text-[#969ab8] bg-transparent"
      />
    </Wrapper>
  );
}

function Group2() {
  return (
    <div className="relative shrink-0 size-[19px]" data-name="Group">
      <div className="absolute inset-[-6.06%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.3028 21.303">
          <g id="Group">
            <path d={svgPaths.p17bde00} id="Vector" stroke="var(--stroke-0, #ADB0CD)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.30303" />
            <path d={svgPaths.p22eec3e0} id="Vector_2" stroke="var(--stroke-0, #ADB0CD)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.30303" />
            <path d={svgPaths.p655580} id="Vector_3" stroke="var(--stroke-0, #ADB0CD)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.30303" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <Wrapper>
      <Group2 />
      <input
        type="password"
        placeholder="Password"
        value={value}
        onChange={onChange}
        className="w-full outline-none text-[#969ab8] text-[14px] font-['Poppins:Medium',sans-serif] placeholder:text-[#969ab8] bg-transparent"
      />
    </Wrapper>
  );
}

export default function AdminLoginPage({ onNavigateToKitchen }: AdminLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithEmail(email, password);

      if (result.success && result.user) {
        if (result.user.role === 'Kitchen') {
          setError('Kitchen staff must log in through the kitchen portal.');
          setIsLoading(false);
          return;
        }
        login(result.user);
      } else {
        setError(result.error || 'Login failed');
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('An error occurred during login.');
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-[#cb1e1d] relative size-full min-h-screen overflow-hidden"
      data-name="Admin login"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Illustration Section - Hidden on mobile, RIGHT side on desktop */}
      <motion.div
        className="absolute lg:left-1/2 lg:right-0 lg:top-0 lg:bottom-0 hidden lg:flex items-center justify-center overflow-hidden"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <div className="w-full h-full flex items-center justify-center p-8 lg:p-16">
          <div className="relative w-full max-w-[500px] lg:max-w-[600px] aspect-[3/2]">
            <img
              alt="Admin illustration"
              className="w-full h-full object-contain transform rotate-180 scale-y-[-1]"
              src={imgImage1.src}
            />
          </div>
        </div>
      </motion.div>

      {/* Form Section - LEFT side on desktop, full screen on mobile */}
      <motion.div
        className="absolute lg:left-0 lg:right-1/2 lg:top-0 lg:bottom-0 left-0 right-0 top-0 bottom-0 bg-[#f1b715] flex flex-col items-center justify-center p-8 lg:p-16"
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "-100%", opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <div className="w-full max-w-[400px] flex flex-col gap-10">
          {/* Title */}
          <motion.p
            className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic text-[#cb1e1d] text-[24px] lg:text-[30px] text-center tracking-[0.1px]"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Admin Login
          </motion.p>

          {/* Form Content */}
          <motion.div
            className="flex flex-col gap-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {/* Input Fields */}
            <div className="flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Frame1 value={email} onChange={(e) => setEmail(e.target.value)} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Frame value={password} onChange={(e) => setPassword(e.target.value)} />
              </motion.div>
            </div>

            {error && <p className="text-red-700 font-bold bg-white/50 p-2 rounded text-center text-sm">{error}</p>}

            {/* Login Button */}
            <motion.button
              onClick={handleLogin}
              disabled={isLoading}
              className="bg-[#cb1e1d] rounded-[8px] px-16 py-3 w-full transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic text-[15px] text-center text-white tracking-[0.1px]">
                {isLoading ? 'Logging in...' : 'Log In'}
              </p>
            </motion.button>
          </motion.div>

          {/* Navigation Link */}
          <motion.div
            className="flex gap-2 items-center justify-center leading-[24px] not-italic text-[15px] text-center tracking-[0.1px] flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <p className="font-['Poppins:Regular',sans-serif] text-[rgba(203,30,29,0.45)]">Not an admin?</p>
            <button
              onClick={onNavigateToKitchen}
              className="font-['Poppins:SemiBold',sans-serif] text-[#cb1e1d] hover:underline transition-all"
            >
              Kitchen Login
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
