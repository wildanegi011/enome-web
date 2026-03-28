import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getSession } from "@/lib/auth-utils";
import { queryKeys } from "@/lib/query-keys";
import { CustomerService } from "@/lib/services/customer-service";
import { UserService } from "@/lib/services/user-service";
import Navbar from "@/components/store/layout/Navbar";
import UserSidebar from "@/components/store/layout/UserSidebar";
import AddressesClient from "@/components/store/address/AddressesClient";
import { Skeleton } from "@/components/ui/skeleton";
import { redirect } from "next/navigation";

export default async function AddressesPage() {
    const session = await getSession();
    if (!session) {
        redirect("/login?callbackUrl=/account/addresses");
    }

    const queryClient = new QueryClient();
    
    // Pre-fetch addresses on the server
    const userId = session.user.id;
    const custId = await CustomerService.getCustId(userId);
    
    if (custId) {
        await queryClient.prefetchQuery({
            queryKey: queryKeys.user.addresses,
            queryFn: () => UserService.getAddresses(custId)
        });
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-montserrat text-neutral-base-900">
            <Navbar />

            <main className="max-w-[1340px] mx-auto px-3 sm:px-4 md:px-8 py-6 md:py-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="hidden lg:block">
                        <UserSidebar />
                    </div>

                    <HydrationBoundary state={dehydrate(queryClient)}>
                        <AddressesClient />
                    </HydrationBoundary>
                </div>
            </main>
        </div>
    );
}
