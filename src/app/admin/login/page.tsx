
'use client';

import { useState } from 'react';
import { useAuth } from '../auth-provider';
import { motion } from "motion/react";
import svgPaths from "@/imports/svg-6hzyqt81bp";
import Link from 'next/link';
import { getKitchenUserByUsername, seedInitialData } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

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

export default function AdminLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { toast } = useToast();
    const [isSeeding, setIsSeeding] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            let user = await getKitchenUserByUsername(username);

            if (!user) {
                setIsSeeding(true);
                const wasSeeded = await seedInitialData();
                setIsSeeding(false);

                if (wasSeeded) {
                    toast({
                        title: "Initial Setup Complete",
                        description: "The database has been initialized. Automatically logging you in...",
                    });
                    // Try to fetch the user again after seeding
                    user = await getKitchenUserByUsername('admin');
                    if (user && user.password === 'admin123') {
                        if (user.role === 'Kitchen') {
                            setError('Seed error: Default user is a kitchen user.');
                            return;
                        }
                        login(user);
                        return; // Exit after successful login
                    }
                }
            }
            
            // This part runs if the user existed initially, or after seeding is attempted.
            if (user) {
                 if (user.password === password) {
                    if (user.role === 'Kitchen') {
                        setError('Kitchen staff must log in through the kitchen portal.');
                        return;
                    }
                    login(user);
                } else {
                    setError('Invalid username or password.');
                }
            } else {
                setError('Invalid username or password. If this is the first time, try admin/admin123.');
            }
           
        } catch (err) {
            console.error("Login error:", err);
            setError('An error occurred during login.');
        }
    };

    return (
        <motion.div
            className="bg-[#f1b715] relative size-full min-h-screen overflow-hidden flex flex-col items-center justify-center p-8"
            data-name="Admin login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
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
                <form onSubmit={handleLogin} className="w-full">
                    <motion.div
                        className="flex flex-col gap-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        {/* Input Fields */}
                        <div className="flex flex-col gap-6">
                            {/* Username */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.6 }}
                            >
                                <Wrapper>
                                    <Group1 />
                                    <input
                                        type="text"
                                        placeholder="Your Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full outline-none text-[#969ab8] text-[14px] font-['Poppins:Medium',sans-serif] placeholder:text-[#969ab8] bg-transparent"
                                    />
                                </Wrapper>
                            </motion.div>

                            {/* Password */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.7 }}
                            >
                                <Wrapper>
                                    <Group2 />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full outline-none text-[#969ab8] text-[14px] font-['Poppins:Medium',sans-serif] placeholder:text-[#969ab8] bg-transparent"
                                    />
                                </Wrapper>
                            </motion.div>
                        </div>

                        {error && <p className="text-red-600 text-sm text-center font-bold bg-white/80 p-2 rounded">{error}</p>}

                        {/* Login Button */}
                        <motion.button
                            type="submit"
                            className="bg-[#cb1e1d] rounded-[8px] px-16 py-3 w-full transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isSeeding}
                        >
                            <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic text-[15px] text-center text-white tracking-[0.1px]">
                                {isSeeding ? 'Initializing...' : 'Log In'}
                            </p>
                        </motion.button>
                    </motion.div>
                </form>

                {/* Navigation Link */}
                <motion.div
                    className="flex gap-2 items-center justify-center leading-[24px] not-italic text-[15px] text-center tracking-[0.1px] flex-wrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                >
                    <p className="font-['Poppins:Regular',sans-serif] text-[rgba(203,30,29,0.45)]">Not an admin?</p>
                    <Link
                        href="/kitchen/login"
                        className="font-['Poppins:SemiBold',sans-serif] text-[#cb1e1d] hover:underline transition-all"
                    >
                        Kitchen Login
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    );
}

