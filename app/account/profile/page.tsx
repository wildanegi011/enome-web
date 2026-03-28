import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getSession } from "@/lib/auth-utils";
import { queryKeys } from "@/lib/query-keys";
import { UserService } from "@/lib/services/user-service";
import Navbar from "@/components/store/layout/Navbar";
import UserSidebar from "@/components/store/layout/UserSidebar";
import ProfileClient from "@/components/store/profile/ProfileClient";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const session = await getSession();
    if (!session) {
        redirect("/login?callbackUrl=/account/profile");
    }

    const queryClient = new QueryClient();
    const userData = await UserService.getFullProfile(session.user.id);
    
    if (userData) {
        await queryClient.prefetchQuery({
            queryKey: queryKeys.user.profile,
            queryFn: () => userData
        });
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-montserrat text-neutral-base-900">
            <Navbar />

            <main className="max-w-[1340px] mx-auto px-4 md:px-8 py-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="hidden lg:block">
                        <UserSidebar />
                    </div>
                    <HydrationBoundary state={dehydrate(queryClient)}>
                        <ProfileClient />
                    </HydrationBoundary>
                </div>
            </main>
        </div>
    );
}
