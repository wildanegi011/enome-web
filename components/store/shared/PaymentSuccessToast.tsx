"use client";

import React from "react";
import { m } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentSuccessToastProps {
    title: string;
    message: string;
}

export const PaymentSuccessToast = ({ title, message }: PaymentSuccessToastProps) => {
    return (
        <m.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "relative overflow-hidden",
                "min-w-[320px] max-w-[400px] w-full",
                "bg-white/80 backdrop-blur-xl",
                "border border-emerald-100",
                "rounded-3xl p-5",
                "shadow-[0_20px_50px_-12px_rgba(16,185,129,0.15)]",
                "flex items-center gap-4"
            )}
        >
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-emerald-50 rounded-full blur-3xl opacity-50" />

            {/* Icon Container */}
            <div className="relative shrink-0">
                <m.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                    className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                >
                    <CheckCircle2 className="w-6 h-6 text-white" />
                </m.div>

                {/* Sparkles Micro-animation */}
                <m.div
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1.2, 0.5],
                        rotate: [0, 45, 90]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-1 -right-1"
                >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                </m.div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-neutral-900 mb-0.5 font-montserrat tracking-tight leading-tight">
                    {title}
                </h3>
                <p className="text-[13px] text-neutral-500 font-medium leading-relaxed">
                    {message}
                </p>
            </div>

            {/* Success indicator line */}
            <div className="absolute bottom-0 left-5 right-5 h-0.5 bg-emerald-500/10 rounded-full overflow-hidden">
                <m.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4, ease: "linear" }}
                    className="h-full bg-emerald-500"
                />
            </div>
        </m.div>
    );
};
