"use client";

import React from "react";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface WalletBalanceCardProps {
    balance: number;
    isLoading: boolean;
    onTopUpClick: () => void;
    mounted: boolean;
}

const WalletBalanceCard = ({ balance, isLoading, onTopUpClick, mounted }: WalletBalanceCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-neutral-base-900 rounded-[28px] md:rounded-[32px] p-6 md:p-8 text-white shadow-2xl shadow-neutral-base-900/20"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl opacity-50" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
                <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-2 text-white/50">
                        <Wallet className="w-4 h-4 md:w-5 md:h-5 text-white/70" />
                        <span className="text-[10px] md:text-[12px] font-bold uppercase tracking-[0.2em]">Total Saldo</span>
                    </div>
                    <div className="space-y-1">
                        {!mounted || isLoading ? (
                            <Skeleton className="h-10 md:h-12 w-48 md:w-64 bg-white/10 rounded-xl" />
                        ) : (
                            <h2 className="text-3xl md:text-5xl font-montserrat font-black tracking-tight">
                                {formatCurrency(balance)}
                            </h2>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0">
                    <button
                        onClick={onTopUpClick}
                        className="w-full md:w-auto h-12 md:h-14 px-10 bg-white text-neutral-base-900 rounded-[18px] font-black text-[11px] md:text-[12px] uppercase tracking-[0.15em] hover:bg-neutral-base-50 transition-all active:scale-95 shadow-lg shadow-white/5 flex items-center justify-center"
                    >
                        Top Up
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default WalletBalanceCard;
