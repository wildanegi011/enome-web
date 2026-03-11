import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    User as UserIcon,
    ShoppingBag,
    Heart,
    Bell,
    MapPin,
    LogOut,
    ChevronRight,
    Wallet,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

const menuItems = [
    {
        title: "Profil Saya",
        icon: UserIcon,
        href: "/account/profile",
    },
    {
        title: "Daftar Alamat",
        icon: MapPin,
        href: "/account/addresses",
    },
    {
        title: "Riwayat Transaksi",
        icon: ShoppingBag,
        href: "/account/orders",
    },
    {
        title: "Wishlist",
        icon: Heart,
        href: "/account/wishlist",
    },
    // {
    //     title: "Wallet",
    //     icon: Wallet,
    //     href: "/account/wallet",
    // },
];

export default function UserSidebar({ className, isSheet }: { className?: string, isSheet?: boolean }) {
    const pathname = usePathname();
    const { user, isLoading, logout, isLoggingOut, isAuthenticated } = useAuth();

    return (
        <aside className={cn("w-full md:w-[280px] shrink-0", className)}>
            <div className={cn(isSheet ? "space-y-6" : "sticky top-24 space-y-8")}>

                {/* User Profile Summary - Mockup Style */}
                <div className="flex items-center gap-4 px-4 py-2">
                    <div className="w-12 h-12 bg-neutral-base-900 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-neutral-base-900/10">
                        {isLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <UserIcon className="w-6 h-6" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        {isLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        ) : user ? (
                            <>
                                <h3 className="text-[14px] font-bold text-neutral-base-900 truncate">{user.name}</h3>
                                <p className="text-[12px] text-neutral-base-400 font-medium truncate">{user.email}</p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-[14px] font-bold text-neutral-base-900 truncate">Tamu</h3>
                                <p className="text-[12px] text-neutral-base-400 font-medium truncate">Silakan login</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link key={item.href} href={item.href} className="block relative group">
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-neutral-base-900 rounded-r-full" />
                                )}
                                <div
                                    className={cn(
                                        "flex items-center gap-4 px-6 py-3 rounded-[18px] transition-all duration-300",
                                        isActive
                                            ? "bg-neutral-base-50 text-neutral-base-900"
                                            : "text-neutral-base-400 hover:text-neutral-base-900 hover:bg-neutral-base-50/50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-6 h-6 flex items-center justify-center",
                                        isActive ? "text-neutral-base-900" : "text-neutral-base-300 group-hover:text-neutral-base-900"
                                    )}>
                                        <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                                    </div>

                                    <span className={cn(
                                        "text-[14px] font-bold",
                                        isActive ? "text-neutral-base-900" : "text-neutral-base-500"
                                    )}>
                                        {item.title}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {isAuthenticated && (
                    <div className="pt-6 mt-6 border-t border-neutral-base-100/50 pl-4">
                        <button
                            onClick={() => logout()}
                            disabled={isLoggingOut}
                            className="flex items-center gap-4 p-2 text-neutral-base-400 hover:text-red-500 transition-colors group disabled:opacity-50"
                        >
                            {isLoggingOut ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            )}
                            <span className="text-[13px] font-bold">Keluar</span>
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
