"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Mail, Phone, Lock, Save,
    Home, Camera, Shield, ChevronRight,
    Loader2, CheckCircle2, Hash, Store,
    Award, Ticket, Info, AlertCircle
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/store/Navbar";
import UserSidebar from "@/components/store/UserSidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface ProfileData {
    id: number;
    username: string;
    email: string;
    nama: string;
    kodeCustomer: string;
    namaTipeCustomer: string;
    namaToko: string;
    noHandphone: string;
    vouchers: any[];
}

export default function ProfilePage() {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const { data: profile, isLoading } = useQuery<ProfileData>({
        queryKey: ["user-profile"],
        queryFn: async () => {
            const res = await fetch("/api/user/profile");
            if (!res.ok) throw new Error("Failed to fetch profile");
            return res.json();
        }
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSaving(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-base-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-amber-800 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-base-50 font-sans text-neutral-base-900 selection:bg-amber-100 selection:text-amber-900">
            <Navbar />

            <main className="max-w-[1240px] mx-auto px-6 py-12 md:py-16">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                    <UserSidebar />

                    <div className="flex-1 min-w-0">
                        {/* Breadcrumbs */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink asChild>
                                            <Link href="/" className="flex items-center gap-1.5 transition-colors hover:text-amber-800">
                                                <Home className="w-3.5 h-3.5" />
                                                <span>Home</span>
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="text-[11px] font-bold uppercase tracking-widest text-neutral-base-900">
                                            Profil & Alamat
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-10"
                        >
                            <h1 className="text-[32px] md:text-[42px] font-heading font-bold text-neutral-base-900 tracking-tight leading-tight mb-3">Profil <span className="text-amber-800">Saya</span></h1>
                            <p className="text-[14px] md:text-[16px] text-neutral-base-400 font-bold max-w-[600px] leading-relaxed">Informasi lengkap akun kamu untuk pengalaman belanja yang lebih personal.</p>
                        </motion.div>

                        <div className="space-y-8">
                            {/* Membership & Identity Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-neutral-base-900 rounded-[32px] p-6 text-white relative overflow-hidden group shadow-xl shadow-neutral-base-900/10"
                                >
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-8">
                                            <Hash className="w-8 h-8 text-neutral-base-400" />
                                            <span className="text-[10px] font-black tracking-widest uppercase bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">Cust Code</span>
                                        </div>
                                        <p className="text-[11px] font-black uppercase tracking-widest text-neutral-base-400 mb-1">ID Pelanggan</p>
                                        <h3 className="text-2xl font-bold tracking-tight">{profile?.kodeCustomer || "BELUM ADA"}</h3>
                                    </div>
                                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors duration-500" />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-white rounded-[32px] p-6 border border-neutral-base-100 shadow-sm relative overflow-hidden group"
                                >
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-8">
                                            <Award className="w-8 h-8 text-amber-800" />
                                            <span className="text-[10px] font-black tracking-widest uppercase bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200/50">Member</span>
                                        </div>
                                        <p className="text-[11px] font-black uppercase tracking-widest text-neutral-base-400 mb-1">Tipe Member</p>
                                        <h3 className="text-2xl font-bold text-neutral-base-900 tracking-tight uppercase">{profile?.namaTipeCustomer || "GUEST"}</h3>
                                    </div>
                                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-50 rounded-full blur-2xl group-hover:bg-amber-100 transition-colors duration-500" />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-white rounded-[32px] p-6 border border-neutral-base-100 shadow-sm relative overflow-hidden group"
                                >
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-8">
                                            <Ticket className="w-8 h-8 text-emerald-600" />
                                            <span className="text-[10px] font-black tracking-widest uppercase bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200/50">Promo</span>
                                        </div>
                                        <p className="text-[11px] font-black uppercase tracking-widest text-neutral-base-400 mb-1">Voucher Aktif</p>
                                        <h3 className="text-2xl font-bold text-neutral-base-900 tracking-tight">{profile?.vouchers.length || 0} <span className="text-sm text-neutral-base-400">Voucher</span></h3>
                                    </div>
                                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors duration-500" />
                                </motion.div>
                            </div>

                            {/* Form Sections */}
                            <div className="grid grid-cols-1 gap-8">
                                {/* Personal Info */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-white rounded-[32px] p-8 border border-neutral-base-100/60 shadow-sm"
                                >
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                                            <User className="w-5 h-5 text-amber-800" />
                                        </div>
                                        <h2 className="text-lg font-bold text-neutral-base-900">Informasi Pribadi</h2>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[12px] font-black uppercase tracking-widest text-neutral-base-400 ml-1">Username</label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300" />
                                                    <Input
                                                        defaultValue={profile?.username || ""}
                                                        disabled
                                                        className="h-14 bg-neutral-base-50/50 border-neutral-base-100/60 rounded-2xl pl-12 font-bold opacity-60 cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[12px] font-black uppercase tracking-widest text-neutral-base-400 ml-1">Email</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300" />
                                                    <Input
                                                        defaultValue={profile?.email || ""}
                                                        disabled
                                                        className="h-14 bg-neutral-base-50/50 border-neutral-base-100/60 rounded-2xl pl-12 font-bold opacity-60 cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[12px] font-black uppercase tracking-widest text-neutral-base-400 ml-1">Nama Lengkap Pelanggan</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300" />
                                                <Input
                                                    defaultValue={profile?.nama || ""}
                                                    disabled
                                                    className="h-14 bg-neutral-base-50/50 border-neutral-base-100/60 rounded-2xl pl-12 font-bold opacity-60 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[12px] font-black uppercase tracking-widest text-neutral-base-400 ml-1">Nama Toko</label>
                                            <div className="relative">
                                                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300" />
                                                <Input
                                                    defaultValue={profile?.namaToko || ""}
                                                    disabled
                                                    className="h-14 bg-neutral-base-50/50 border-neutral-base-100/60 rounded-2xl pl-12 font-bold opacity-60 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[12px] font-black uppercase tracking-widest text-neutral-base-400 ml-1">No. Handphone Pelanggan</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300" />
                                                <Input
                                                    defaultValue={profile?.noHandphone || ""}
                                                    disabled
                                                    className="h-14 bg-neutral-base-50/50 border-neutral-base-100/60 rounded-2xl pl-12 font-bold opacity-60 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={cn("text-[10px] font-black uppercase tracking-widest border rounded-full px-2 py-0.5", className)}>
            {children}
        </span>
    );
}
