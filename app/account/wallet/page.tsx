"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, AlertCircle } from "lucide-react";
import Navbar from "@/components/store/layout/Navbar";
import UserSidebar from "@/components/store/layout/UserSidebar";
import AccountHeader from "@/components/store/layout/AccountHeader";
import Footer from "@/components/store/layout/Footer";
import { useWallet } from "@/hooks/use-wallet";
import TopUpModal from "@/components/store/wallet/TopUpModal";
import WalletBalanceCard from "@/components/store/wallet/WalletBalanceCard";
import WalletTransactionList from "@/components/store/wallet/WalletTransactionList";

export default function WalletPage() {
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
        <div className="min-h-screen bg-[#F9FAFB] font-montserrat text-neutral-base-900">
            <Navbar />

            <main className="max-w-[1340px] mx-auto px-4 md:px-8 py-6 md:py-10">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    <div className="hidden lg:block lg:w-[280px] shrink-0">
                        <UserSidebar />
                    </div>

                    <div className="flex-1 min-w-0 space-y-4 md:space-y-8">
                        <AccountHeader
                            title="Wallet"
                            description="Kelola saldo dan pantau riwayat transaksi Anda."
                        />

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
                    </div>
                </div>
            </main>
            <Footer />

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
