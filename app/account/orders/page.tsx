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
        <div className="min-h-screen bg-neutral-base-50/30 font-montserrat text-neutral-base-900">
            <Navbar />

            <main className="max-w-[1340px] mx-auto px-3 sm:px-4 md:px-8 pb-6 md:pb-10">
                <div className="flex flex-col lg:flex-row gap-12 items-start pt-6 md:pt-10">
                    {/* Sticky Sidebar Container */}
                    <div className="hidden lg:block sticky top-[100px] shrink-0 w-[240px] z-10">
                        <UserSidebar />
                    </div>

                    <div className="flex-1 min-w-0">
                        <AccountHeader
                            title="Riwayat Pesanan"
                            description="Lacak dan kelola semua pesanan Anda di sini."
                        />

                        {/* Sticky Control Filters */}
                        <div className="sticky top-[80px] z-30 -mx-3 sm:-mx-4 md:-mx-8 px-3 sm:px-4 md:px-8 py-2 md:py-6 bg-[#F9FAFB] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] rounded-b-[24px] md:rounded-b-[32px] mb-4 md:mb-8">
                            <div className="space-y-6">
                                {/* Status Tabs */}
                                <OrderTabs
                                    tabs={tabs}
                                    activeTab={filters.statusOrder}
                                    onChange={(value) => setFilters({ statusOrder: value })}
                                />

                                {/* Search & Date Filter Bar */}
                                <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
                                    <div className="w-full sm:flex-1">
                                        <SearchInput
                                            placeholder="Cari Order ID..."
                                            value={filters.search}
                                            onChange={(value) => setFilters({ search: value })}
                                        />
                                    </div>

                                    <div className="w-full sm:w-auto">
                                        <DateRangeFilter
                                            dateRange={filters.dateRange}
                                            onSelect={(range) => setFilters({ dateRange: range })}
                                            presets={datePresets}
                                        />
                                    </div>
                                </div>
                            </div>
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