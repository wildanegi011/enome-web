import React from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import Navbar from "@/components/store/layout/Navbar";
import UserSidebar from "@/components/store/layout/UserSidebar";
import AccountHeader from "@/components/store/layout/AccountHeader";
import { CONFIG } from "@/lib/config";
import { queryKeys } from "@/lib/query-keys";
import { UserService } from "@/lib/services/user-service";
import { CustomerService } from "@/lib/services/customer-service";
import { getSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { subMonths } from "date-fns";
import { getJakartaDate, formatJakarta } from "@/lib/date-utils";
import OrdersClient from "@/components/store/orders/OrdersClient";

export default async function OrderHistoryPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const session = await getSession();
    if (!session?.user?.id) {
        redirect("/auth/login?callbackUrl=/account/orders");
    }

    const userId = session.user.id;
    const custId = await CustomerService.getCustId(userId);
    const limit = CONFIG.ORDER_HISTORY.PAGINATION_LIMIT;

    const queryClient = new QueryClient();

    // Default filters
    const page = typeof searchParams.page === "string" ? parseInt(searchParams.page) : 1;
    const search = typeof searchParams.search === "string" ? searchParams.search : "";
    const statusOrder = typeof searchParams.status === "string" ? searchParams.status : "ALL";

    // Date range handling (similar to hook logic)
    const now = getJakartaDate();
    let startDate = (typeof searchParams.startDate === "string" ? searchParams.startDate : undefined) ?? formatJakarta(subMonths(now, 3), "date");
    let endDate = (typeof searchParams.endDate === "string" ? searchParams.endDate : undefined) ?? formatJakarta(now, "date");

    const filters = {
        search,
        statusOrder,
        dateRange: {
            from: startDate,
            to: endDate
        }
    };

    await queryClient.prefetchQuery({
        queryKey: [...queryKeys.user.orders, page, limit, filters],
        queryFn: () => UserService.getOrders(userId, {
            page,
            limit,
            search,
            statusOrder,
            startDate,
            endDate,
            custId: custId ?? undefined
        }),
    });

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

                        <HydrationBoundary state={dehydrate(queryClient)}>
                            <OrdersClient initialLimit={limit} />
                        </HydrationBoundary>
                    </div>
                </div>
            </main>
        </div>
    );
}