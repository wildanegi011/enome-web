"use client";

import React from "react";
import OrderCardList from "./OrderCardList";
import OrderTabs from "./OrderTabs";
import SearchInput from "../shared/SearchInput";
import DateRangeFilter from "../shared/DateRangeFilter";
import { useOrders } from "@/hooks/use-orders";

interface OrdersClientProps {
    initialLimit: number;
}

export default function OrdersClient({ initialLimit }: OrdersClientProps) {
    const {
        orders,
        total: totalOrders,
        tabs,
        isLoading,
        page: currentPage,
        setPage: setCurrentPage,
        filters,
        setFilters,
        trackableCouriers,
        datePresets
    } = useOrders(initialLimit);

    return (
        <>
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
                itemsPerPage={initialLimit}
                onPageChange={setCurrentPage}
                trackableCouriers={trackableCouriers}
                onEmptyActionClick={() => { }}
            />
        </>
    );
}
