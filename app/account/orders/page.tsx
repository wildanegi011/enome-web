"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/store/layout/Navbar";
import UserSidebar from "@/components/store/layout/UserSidebar";
import AccountHeader from "@/components/store/layout/AccountHeader";
import { CONFIG } from "@/lib/config";
import OrderCardList from "@/components/store/orders/OrderCardList";
import OrderTabs from "@/components/store/orders/OrderTabs";
import SearchInput from "@/components/store/shared/SearchInput";
import DateRangeFilter from "@/components/store/shared/DateRangeFilter";
import { useOrders } from "@/hooks/use-orders";

export default function OrderHistoryPage() {
    const limit = CONFIG.ORDER_HISTORY.PAGINATION_LIMIT;
    const {
        orders,
        total: totalOrders,
        tabs,
        isLoading,
        page: currentPage,
        setPage: setCurrentPage,
        filters,
        setFilters,
        datePresets
    } = useOrders(limit);

    return (
        <div className="min-h-screen bg-neutral-base-50/30 font-sans text-neutral-base-900">
            <Navbar />

            <main className="max-w-[1340px] mx-auto px-3 sm:px-4 md:px-8 py-6 md:py-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="hidden lg:block">
                        <UserSidebar />
                    </div>

                    <div className="flex-1 min-w-0">
                        <AccountHeader
                            title="Riwayat Pesanan"
                            description="Lacak dan kelola semua pesanan Anda di sini."
                        />

                        {/* Status Tabs */}
                        <OrderTabs
                            tabs={tabs}
                            activeTab={filters.statusOrder}
                            onChange={(value) => setFilters({ statusOrder: value })}
                        />

                        {/* Search & Date Filter Bar */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 mb-8">
                            <SearchInput
                                placeholder="Cari Order ID atau Nama Produk..."
                                value={filters.search}
                                onChange={(value) => setFilters({ search: value })}
                            />

                            <DateRangeFilter
                                dateRange={filters.dateRange}
                                onSelect={(range) => setFilters({ dateRange: range })}
                                presets={datePresets}
                            />
                        </div>

                        {/* Order Cards List Container */}
                        <OrderCardList
                            orders={orders}
                            isLoading={isLoading}
                            currentPage={currentPage}
                            totalItems={totalOrders}
                            itemsPerPage={limit}
                            onPageChange={setCurrentPage}
                            onEmptyActionClick={() => { }}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}