"use client";

import React, { useState, useEffect } from "react";
import WalletBalanceCard from "./WalletBalanceCard";
import WalletTransactionList from "./WalletTransactionList";
import TopUpModal from "./TopUpModal";
import { useWallet } from "@/hooks/use-wallet";

export default function WalletClient() {
    const [mounted, setMounted] = useState(false);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);

    const {
        balance,
        history,
        metadata,
        isLoading,
        isError,
        page,
        setPage,
        topUp,
        isTopUpLoading
    } = useWallet();

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="space-y-4 md:space-y-8">
            {/* Balance Card Section - Sticky */}
            <div className="sticky top-[80px] z-30 -mx-3 sm:-mx-4 md:-mx-8 px-3 sm:px-4 md:px-8 py-2 md:py-4 bg-[#F9FAFB]/80 backdrop-blur-md border-b border-transparent transition-all mb-4 md:mb-6">
                <WalletBalanceCard
                    balance={balance}
                    isLoading={isLoading}
                    onTopUpClick={() => setIsTopUpOpen(true)}
                    mounted={mounted}
                />
            </div>

            {/* Transactions Section */}
            <div className="space-y-5 md:space-y-6">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-lg md:text-xl font-montserrat font-black text-neutral-base-900 tracking-tight">Riwayat Transaksi</h3>
                </div>

                <div className="bg-white border border-neutral-base-100 rounded-[24px] md:rounded-[32px] overflow-hidden shadow-sm">
                    <WalletTransactionList
                        history={history}
                        isLoading={isLoading}
                        isError={isError}
                        metadata={metadata}
                        onPageChange={setPage}
                        mounted={mounted}
                    />
                </div>
            </div>

            <TopUpModal
                isOpen={isTopUpOpen}
                onClose={() => setIsTopUpOpen(false)}
                onTopUp={async (amount) => {
                    await topUp({ amount });
                }}
                isLoading={isTopUpLoading}
            />
        </div>
    );
}
