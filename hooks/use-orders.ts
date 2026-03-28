"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";
import { userApi } from "@/lib/api/user-api";
import { queryKeys } from "@/lib/query-keys";
import { startOfDay, endOfDay, subDays, subMonths } from "date-fns";
import { CONFIG } from "@/lib/config";
import { getJakartaDate } from "@/lib/date-utils";

export interface OrderFilters {
    search: string;
    dateRange: DateRange | undefined;
    statusOrder: string;
}

export function useOrders(initialLimit: number = 10) {
    const datePresets = [
        { id: "today", label: CONFIG.ORDER_HISTORY.DATE_PRESETS[0].label, getRange: () => ({ from: startOfDay(getJakartaDate()), to: endOfDay(getJakartaDate()) }) },
        { id: "yesterday", label: CONFIG.ORDER_HISTORY.DATE_PRESETS[1].label, getRange: () => ({ from: startOfDay(subDays(getJakartaDate(), 1)), to: endOfDay(subDays(getJakartaDate(), 1)) }) },
        { id: "7days", label: CONFIG.ORDER_HISTORY.DATE_PRESETS[2].label, getRange: () => ({ from: subDays(getJakartaDate(), 7), to: getJakartaDate() }) },
        { id: "3months", label: CONFIG.ORDER_HISTORY.DATE_PRESETS[3].label, getRange: () => ({ from: subMonths(getJakartaDate(), 3), to: getJakartaDate() }) },
    ];

    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<OrderFilters>({
        search: "",
        dateRange: datePresets[3].getRange(),
        statusOrder: "ALL",
    });

    const ordersQuery = useQuery({
        queryKey: [...queryKeys.user.orders, page, initialLimit, filters],
        queryFn: () => userApi.getOrders({
            page,
            limit: initialLimit,
            search: filters.search,
            dateRange: filters.dateRange,
            statusOrder: filters.statusOrder,
        }),
    });

    const handleFilterChange = (newFilters: Partial<OrderFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPage(1);
    };

    return {
        orders: ordersQuery.data?.orders || [],
        total: ordersQuery.data?.total || 0,
        tabs: ordersQuery.data?.tabs || [{ label: "Semua", value: "ALL" }],
        trackableCouriers: ordersQuery.data?.trackableCouriers || [],
        isLoading: ordersQuery.isLoading,
        isError: ordersQuery.isError,
        page,
        setPage,
        filters,
        setFilters: handleFilterChange,
        datePresets,
        refetch: ordersQuery.refetch,
    };
}
