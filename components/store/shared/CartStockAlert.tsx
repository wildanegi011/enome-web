"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Trash2, RefreshCw, Loader2 } from "lucide-react";

interface CartStockAlertProps {
    items: any[];
    onFixQuantities: (insufficientItems: any[]) => Promise<void>;
    onClearUnavailable: (unavailableItems: any[]) => Promise<void>;
    isLoading?: boolean;
}

export default function CartStockAlert({
    items,
    onFixQuantities,
    onClearUnavailable,
    isLoading = false
}: CartStockAlertProps) {
    const [isFixing, setIsFixing] = useState(false);

    // Identify problematic items based on the logic in CartReview/OrderItem
    const unavailableItems = items.filter(item => 
        item.isOnline === 0 || 
        (item.stock !== undefined && item.stock !== null && item.stock <= 0) ||
        (item.stock === null)
    );
    
    const insufficientStockItems = items.filter(item => 
        item.isOnline !== 0 && 
        item.stock !== undefined && 
        item.stock !== null && 
        item.stock > 0 && 
        Number(item.qty) > item.stock
    );

    const hasProblems = (unavailableItems.length > 0 || insufficientStockItems.length > 0) && !isLoading;

    if (!hasProblems) return null;

    const handleClearUnavailable = async () => {
        setIsFixing(true);
        try {
            await onClearUnavailable(unavailableItems);
        } finally {
            setIsFixing(false);
        }
    };

    const handleFixQuantities = async () => {
        setIsFixing(true);
        try {
            await onFixQuantities(insufficientStockItems);
        } finally {
            setIsFixing(false);
        }
    };

    return (
        <AnimatePresence mode="popLayout">
            <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="overflow-hidden mb-4 md:mb-6"
            >
                <div className="relative group/banner">
                    {/* Glassmorphic Background with Gradient */}
                    <div className="absolute inset-0 bg-linear-to-br from-red-50 to-rose-50/80 backdrop-blur-md rounded-[24px] md:rounded-[32px] border border-red-100/60 shadow-[0_20px_50px_-12px_rgba(239,68,68,0.12)] transition-all duration-500 group-hover/banner:shadow-[0_25px_60px_-12px_rgba(239,68,68,0.18)]" />

                    <div className="relative p-5 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-8">
                        <div className="flex items-start gap-4 md:gap-5">
                            {/* Animated Icon Container */}
                            <div className="relative shrink-0">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        opacity: [0.5, 0.8, 0.5]
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute inset-0 bg-red-400 rounded-2xl blur-xl"
                                />
                                <div className="relative w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-red-50">
                                    <AlertCircle className="w-5 h-5 md:w-7 md:h-7 text-red-600" />
                                </div>
                            </div>

                            <div className="flex-1 pt-0.5">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-[14px] md:text-[18px] font-black text-red-950 tracking-tight font-montserrat uppercase">
                                        Kendala Pesanan
                                    </h4>
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                </div>
                                <p className="text-[11px] md:text-[13px] font-bold text-red-800/70 leading-relaxed max-w-[320px] md:max-w-md font-montserrat">
                                    Ada <span className="text-red-600 underline decoration-red-200 decoration-2 underline-offset-4">{unavailableItems.length + insufficientStockItems.length} produk</span> bermasalah. Segera bereskan sebelum melanjutkan pembayaran.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                            {unavailableItems.length > 0 && (
                                <motion.button
                                    whileHover={{ y: -1, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={isLoading || isFixing}
                                    onClick={handleClearUnavailable}
                                    className="h-9 md:h-11 bg-rose-600 hover:bg-rose-700 text-white px-5 md:px-7 rounded-full font-bold text-[10px] md:text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2 disabled:opacity-50 font-montserrat"
                                >
                                    {isFixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                                    <span>hapus</span>
                                </motion.button>
                            )}
                            {insufficientStockItems.length > 0 && (
                                <motion.button
                                    whileHover={{ y: -1, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={isLoading || isFixing}
                                    onClick={handleFixQuantities}
                                    className="h-9 md:h-11 bg-neutral-base-900 hover:bg-black text-white px-5 md:px-7 rounded-full font-bold text-[10px] md:text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-neutral-base-900/10 flex items-center justify-center gap-2 disabled:opacity-50 font-montserrat"
                                >
                                    {isFixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                                    <span>sesuaikan</span>
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
