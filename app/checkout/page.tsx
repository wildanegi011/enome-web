import React, { Suspense } from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import Navbar from "@/components/store/layout/Navbar";
import { Loader2 } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { CartService } from "@/lib/services/cart-service";
import { UserService } from "@/lib/services/user-service";
import { getSession } from "@/lib/auth-utils";
import CheckoutClient from "@/components/store/checkout/CheckoutClient";
import { CheckoutService } from "@/lib/services/checkout-service";

export default async function CheckoutPage() {
    const session = await getSession();
    const queryClient = new QueryClient();

    if (session?.user?.id) {
        const userId = session.user.id;
        const custId = await UserService.getCustId(userId);

        if (custId) {
            // Parallel pre-fetching
            await Promise.all([
                queryClient.prefetchQuery({
                    queryKey: queryKeys.cart.all,
                    queryFn: () => CartService.getCartItems(userId),
                }),
                queryClient.prefetchQuery({
                    queryKey: queryKeys.user.addresses,
                    queryFn: () => UserService.getAddresses(custId),
                }),
                queryClient.prefetchQuery({
                    queryKey: queryKeys.user.wallet.balance,
                    queryFn: () => UserService.getWalletBalance(custId),
                }),
                queryClient.prefetchQuery({
                    queryKey: queryKeys.shipping.couriers,
                    queryFn: () => CheckoutService.getCouriers(),
                }),
                queryClient.prefetchQuery({
                    queryKey: queryKeys.payments.methods,
                    queryFn: () => CheckoutService.getPaymentMethods(userId),
                })
            ]);
        }
    }

    return (
        <div className="min-h-screen bg-neutral-base-50">
            <Navbar />
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-800/20" />
                </div>
            }>
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <CheckoutClient />
                </HydrationBoundary>
            </Suspense>
        </div>
    );
}
