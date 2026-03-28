import React from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import Navbar from "@/components/store/layout/Navbar";
import UserSidebar from "@/components/store/layout/UserSidebar";
import AccountHeader from "@/components/store/layout/AccountHeader";
import Footer from "@/components/store/layout/Footer";
import WalletClient from "@/components/store/wallet/WalletClient";
import { queryKeys } from "@/lib/query-keys";
import { UserService } from "@/lib/services/user-service";
import { CustomerService } from "@/lib/services/customer-service";
import { getSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function WalletPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const session = await getSession();
    if (!session?.user?.id) {
        redirect("/auth/login?callbackUrl=/account/wallet");
    }

    const userId = session.user.id;
    const custId = await CustomerService.getCustId(userId);
    const page = typeof searchParams.page === "string" ? parseInt(searchParams.page) : 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const queryClient = new QueryClient();

    if (custId) {
        await Promise.all([
            queryClient.prefetchQuery({
                queryKey: queryKeys.user.wallet.balance,
                queryFn: () => UserService.getWalletBalance(custId),
            }),
            queryClient.prefetchQuery({
                queryKey: [...queryKeys.user.wallet.history, page, limit],
                queryFn: () => UserService.getWalletHistory(custId, limit, offset),
            }),
        ]);
    }

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

                        <HydrationBoundary state={dehydrate(queryClient)}>
                            <WalletClient />
                        </HydrationBoundary>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
