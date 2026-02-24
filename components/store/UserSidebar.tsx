"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    User,
    ShoppingBag,
    Wallet,
    History,
    MapPin,
    LogOut,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    {
        title: "Profil & Alamat",
        icon: User,
        href: "/account/profile",
        description: "Kelola informasi pribadi"
    },
    {
        title: "Daftar Alamat",
        icon: MapPin,
        href: "/account/addresses",
        description: "Atur alamat pengiriman"
    },
    {
        title: "Riwayat Pesanan",
        icon: ShoppingBag,
        href: "/account/orders",
        description: "Cek status pesanan kamu"
    },
    {
        title: "Dompet Saya",
        icon: Wallet,
        href: "/account/wallet",
        description: "Saldo & pembayaran"
    },
    {
        title: "Riwayat Topup",
        icon: History,
        href: "/account/topup-history",
        description: "Catatan pengisian saldo"
    },
];

export default function UserSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-full md:w-[320px] shrink-0">
            <div className="sticky top-24 space-y-6">
                {/* User Profile Summary */}
                <div className="bg-white rounded-[32px] p-8 border border-neutral-base-100/60 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-100/50 transition-colors duration-700" />

                    <div className="relative flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-neutral-base-900 rounded-[24px] flex items-center justify-center text-white mb-4 shadow-xl shadow-neutral-base-900/10 group-hover:scale-105 transition-transform duration-500">
                            <User className="w-10 h-10" />
                        </div>
                        <h3 className="text-[18px] font-heading font-bold text-neutral-base-900">Wildan Pratama</h3>
                        <p className="text-[12px] text-neutral-base-400 font-bold uppercase tracking-widest mt-1">End User</p>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="bg-white rounded-[32px] p-4 border border-neutral-base-100/60 shadow-sm">
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link key={item.href} href={item.href} className="block">
                                    <div
                                        className={cn(
                                            "group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 relative overflow-hidden",
                                            isActive
                                                ? "bg-neutral-base-900 text-white shadow-lg shadow-neutral-base-900/10"
                                                : "hover:bg-neutral-base-50 text-neutral-base-500 hover:text-neutral-base-900"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-300",
                                            isActive ? "bg-white/10" : "bg-neutral-base-50 group-hover:bg-white shadow-sm"
                                        )}>
                                            <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-neutral-base-400 group-hover:text-amber-800")} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-bold leading-none">{item.title}</p>
                                            <p className={cn(
                                                "text-[10px] font-medium mt-1 truncate transition-colors",
                                                isActive ? "text-white/60" : "text-neutral-base-300"
                                            )}>
                                                {item.description}
                                            </p>
                                        </div>

                                        <ChevronRight className={cn(
                                            "w-4 h-4 transition-transform duration-300",
                                            isActive ? "text-white" : "text-neutral-base-200 group-hover:translate-x-1"
                                        )} />

                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-neutral-base-900 -z-10"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </div>
                                </Link>
                            );
                        })}

                        <div className="pt-2 mt-2 border-t border-neutral-base-100/60">
                            <button className="w-full group flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 text-neutral-base-500 hover:text-red-700 transition-all duration-300">
                                <div className="w-11 h-11 rounded-xl bg-neutral-base-50 group-hover:bg-white flex items-center justify-center shadow-sm transition-colors">
                                    <LogOut className="w-5 h-5 text-neutral-base-400 group-hover:text-red-600" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[13px] font-bold">Keluar</p>
                                    <p className="text-[10px] font-medium text-neutral-base-300 group-hover:text-red-400 mt-1">Selesaikan sesi</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </nav>
            </div>
        </aside>
    );
}
