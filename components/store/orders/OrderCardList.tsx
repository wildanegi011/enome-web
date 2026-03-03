import React from "react";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import OrderCard, { Order } from "./OrderCard";
import ResultsInfo from "../shared/ResultsInfo";
import Pagination from "../shared/Pagination";
import EmptyState from "../shared/EmptyState";

interface OrderCardListProps {
    orders: Order[];
    isLoading: boolean;
    onEmptyActionClick?: () => void;
    currentPage?: number;
    totalItems?: number;
    itemsPerPage?: number;
    onPageChange?: (page: number) => void;
}

const OrderCardSkeleton = () => (
    <div className="bg-white border border-neutral-base-100 rounded-[28px] md:rounded-3xl p-5 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-base-50">
            <div className="flex items-center gap-3 md:gap-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-20 h-5" />
                        <Skeleton className="w-16 h-4" />
                    </div>
                    <Skeleton className="w-32 h-3" />
                </div>
            </div>
            <div className="space-y-2 text-left sm:text-right w-full sm:w-auto">
                <Skeleton className="w-20 h-3 sm:ml-auto" />
                <Skeleton className="w-28 h-5 sm:ml-auto" />
            </div>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 md:gap-6 w-full">
                <Skeleton className="w-16 h-20 md:w-20 md:h-24 rounded-xl md:rounded-2xl shrink-0" />
                <div className="flex-1 space-y-3">
                    <Skeleton className="w-3/4 h-5" />
                    <Skeleton className="w-1/2 h-4" />
                    <Skeleton className="w-24 h-5 mt-2" />
                </div>
            </div>
            <div className="flex gap-2 md:gap-3 w-full md:w-auto">
                <Skeleton className="flex-1 md:w-32 h-11 md:h-12 rounded-[14px] md:rounded-xl" />
                <Skeleton className="flex-1 md:w-32 h-11 md:h-12 rounded-[14px] md:rounded-xl" />
            </div>
        </div>
    </div>
);

export default function OrderCardList({
    orders,
    isLoading,
    onEmptyActionClick,
    currentPage = 1,
    totalItems = 0,
    itemsPerPage = 10,
    onPageChange,
}: OrderCardListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <OrderCardSkeleton />
                <OrderCardSkeleton />
                <OrderCardSkeleton />
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <EmptyState
                icon={ShoppingBag}
                title="Belum ada transaksi"
                description="Anda belum memiliki riwayat transaksi apa pun."
                actionLabel="Mulai Belanja"
                actionHref="/products"
                onActionClick={onEmptyActionClick}
            />
        );
    }

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="space-y-4">
            <ResultsInfo
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                label="pesanan"
                className="mb-4 px-1"
            />

            <div className="space-y-4">
                {orders.map((order) => (
                    <OrderCard key={order.orderId} order={order} />
                ))}
            </div>

            {totalItems > itemsPerPage && onPageChange && (
                <div className="pt-10 flex justify-center">
                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={onPageChange}
                    />
                </div>
            )}
        </div>
    );
}
