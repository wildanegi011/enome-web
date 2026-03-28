import React from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import Navbar from "@/components/store/layout/Navbar";
import { queryKeys } from "@/lib/query-keys";
import { CartService } from "@/lib/services/cart-service";
import { getSession } from "@/lib/auth-utils";
import CartClient from "@/components/store/cart/CartClient";

export default async function CartPage() {
    const session = await getSession();
    const queryClient = new QueryClient();

    if (session?.user?.id) {
        await queryClient.prefetchQuery({
            queryKey: queryKeys.cart.all,
            queryFn: () => CartService.getCartItems(session.user.id),
        });
    }

    return (
        <div className="min-h-screen bg-white text-neutral-base-900 font-montserrat">
            <Navbar />
            <HydrationBoundary state={dehydrate(queryClient)}>
                <CartClient />
            </HydrationBoundary>
        </div>
    );
}
