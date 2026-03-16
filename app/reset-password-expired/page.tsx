"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

function ExpiredContent() {
    const searchParams = useSearchParams();
    const errorType = searchParams.get("type"); // 'expired' | 'invalid'
    
    const isExpired = errorType === "expired";

    return (
        <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_80px_-15px_rgba(0,0,0,0.08)] border border-neutral-base-100 flex flex-col items-center text-center space-y-7 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative">
                <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center relative z-10">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                </div>
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-rose-500 rounded-full blur-xl"
                />
            </div>

            <div className="space-y-3 relative z-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-base-900 tracking-tight">
                    {isExpired ? "Tautan Kedaluwarsa" : "Akses Tidak Valid"}
                </h2>
                <p className="text-neutral-base-500 text-sm sm:text-base leading-relaxed">
                    {isExpired 
                        ? "Tautan pemulihan ini sudah tidak berlaku karena telah melewati batas waktu keamanan 1 jam."
                        : "Halaman ini tidak dapat diakses, kemungkinan karena Anda telah meminta tautan pemulihan yang baru."
                    }
                </p>
            </div>

            <div className="w-full pt-2 relative z-10 space-y-4">
                <Button asChild className="w-full h-14 bg-neutral-base-900 hover:bg-neutral-base-800 text-white rounded-2xl uppercase tracking-[0.2em] text-xs font-bold shadow-xl shadow-neutral-base-900/10 transition-all group">
                    <Link href="/forgot-password" className="flex items-center justify-center gap-2">
                        <span>Minta Tautan Baru</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </Button>
                <Button variant="ghost" asChild className="w-full h-12 text-neutral-base-400 hover:text-neutral-base-900 text-[10px] font-bold uppercase tracking-[0.2em]">
                    <Link href="/login">Kembali ke Login</Link>
                </Button>
            </div>
        </div>
    );
}

export default function ResetPasswordExpiredPage() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FAF9F6] px-4 py-12 text-center selection:bg-neutral-base-900/10">
            {/* Background Decorative Batik Patterns */}
            <div className="absolute inset-0 z-0 overflow-hidden opacity-5">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute -top-1/4 -left-1/4 rotate-12 transform scale-150">
                    <defs>
                        <pattern id="batik-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                            <path d="M100 0 L200 100 L100 200 L0 100 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                            <circle cx="100" cy="100" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
                            <path d="M50 50 L150 150 M150 50 L50 150" stroke="currentColor" strokeWidth="0.5" />
                            <circle cx="50" cy="50" r="5" fill="currentColor" />
                            <circle cx="150" cy="50" r="5" fill="currentColor" />
                            <circle cx="50" cy="150" r="5" fill="currentColor" />
                            <circle cx="150" cy="150" r="5" fill="currentColor" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#batik-pattern)" />
                </svg>
            </div>

            {/* Glow Effect */}
            <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-200/50 blur-[120px] opacity-50"></div>

            {/* Main Content */}
            <div className="w-full max-w-[450px] relative z-10 space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <Link href="/" className="inline-block mb-4">
                        <span className="text-3xl font-bold tracking-tighter text-neutral-base-900 uppercase">Énome</span>
                    </Link>
                </motion.div>

                <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-neutral-base-900 shadow-sm" /></div>}>
                    <ExpiredContent />
                </Suspense>
            </div>

            {/* Footer Signature */}
            <div className="absolute bottom-12 text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-base-400">
                The Art of ÉNOMÉ &copy; 2026
            </div>
        </div>
    );
}
