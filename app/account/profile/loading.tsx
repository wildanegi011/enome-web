import Navbar from "@/components/store/layout/Navbar";
import UserSidebar from "@/components/store/layout/UserSidebar";
import { ProfileSkeleton } from "@/components/store/profile/ProfileClient";

export default function Loading() {
    return (
        <div className="min-h-screen bg-[#F9FAFB] font-montserrat text-neutral-base-900">
            <Navbar />

            <main className="max-w-[1340px] mx-auto px-4 md:px-8 py-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="hidden lg:block">
                        <UserSidebar />
                    </div>
                    <ProfileSkeleton />
                </div>
            </main>
        </div>
    );
}
