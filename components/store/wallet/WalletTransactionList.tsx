"use client";

import React from "react";
import { Wallet } from "lucide-react";
import { WalletTransaction } from "@/lib/api/user-api";
import WalletTransactionItem from "./WalletTransactionItem";
import WalletHistorySkeleton from "./WalletHistorySkeleton";
import EmptyState from "../shared/EmptyState";
import ResultsInfo from "../shared/ResultsInfo";
import Pagination from "../shared/Pagination";

interface WalletTransactionListProps {
    history: WalletTransaction[];
    isLoading: boolean;
    isError: boolean;
    metadata?: {
        total: number;
        currentPage: number;
        limit: number;
        totalPages: number;
    };
    onPageChange: (page: number) => void;
    mounted: boolean;
}

const WalletTransactionList = ({
    history,
    isLoading,
    isError,
    metadata,
    onPageChange,
    mounted
}: WalletTransactionListProps) => {
    if (!mounted || isLoading) {
        return <WalletHistorySkeleton />;
    }

    if (isError) {
        return (
            <div className="py-16 md:py-24 flex flex-col items-center justify-center text-center space-y-4 px-6 md:px-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                    <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-current border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="space-y-1">
                    <p className="text-lg font-bold text-neutral-base-900">Gagal memuat data</p>
                    <p className="text-[13px] md:text-sm text-neutral-base-400 max-w-[280px]">Silakan muat ulang halaman atau coba lagi nanti.</p>
                </div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <EmptyState
                icon={Wallet}
                title="Belum ada transaksi"
                description="Transaksi wallet Anda akan muncul di sini setelah Anda melakukan top up atau belanja."
            />
        );
    }

    return (
        <div className="flex flex-col">
            {/* Results Info at the top of the list */}
            {metadata && (
                <div className="px-4 md:px-6 py-4 border-b border-neutral-base-50">
                    <ResultsInfo
                        currentPage={metadata.currentPage}
                        itemsPerPage={metadata.limit}
                        totalItems={metadata.total}
                        label="transaksi"
                    />
                </div>
            )}

            <div className="divide-y divide-neutral-base-50">
                {history.map((tx) => (
                    <WalletTransactionItem key={tx.id} tx={tx} />
                ))}
            </div>

            {/* Pagination Controls */}
            {metadata && metadata.totalPages > 1 && (
                <div className="p-6 md:p-8 border-t border-neutral-base-50">
                    <div className="flex justify-center">
                        <Pagination
                            currentPage={metadata.currentPage}
                            totalItems={metadata.total}
                            itemsPerPage={metadata.limit}
                            onPageChange={(p) => {
                                onPageChange(p);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletTransactionList;
