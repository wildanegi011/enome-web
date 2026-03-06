"use client";

import Link from "next/link";
import FallbackImage from "@/components/store/shared/FallbackImage";
import { useState } from "react";
import { useSubscribeNewsletter } from "@/hooks/use-newsletter";
import { toast } from "sonner";

export default function Footer() {

    return (
        <footer className="bg-white border-t border-neutral-100 pt-16 pb-8">
            <div className="max-w-[1400px] mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
                    {/* Brand/Logo Section */}
                    <div className="md:col-span-4 flex flex-col items-center md:items-start space-y-4">
                        <Link href="/" className="relative block group">
                            <div className="relative w-32 h-20 transition-transform duration-500 group-hover:scale-105">
                                <FallbackImage
                                    src="/logo-enome.png"
                                    alt="ÉNOMÉ"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </Link>
                        <p className="text-[12px] md:text-[13px] text-slate-400 font-medium tracking-wide text-center md:text-left">
                            Batik ÉNOMÉ: Reimagining Heritage
                        </p>
                    </div>

                    {/* Bantuan Section */}
                    <div className="md:col-span-2">
                        <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-6">
                            Bantuan
                        </h4>
                        <ul className="space-y-4">
                            {[
                                { name: "Status Pesanan", href: "/account/orders" },
                                { name: "Pengiriman", href: "/shipping" },
                                { name: "Kontak Kami", href: "/contact" }
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors font-medium">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Informasi Section */}
                    <div className="md:col-span-2">
                        <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-6">
                            Informasi
                        </h4>
                        <ul className="space-y-4">
                            {[
                                { name: "Tentang ÉNOMÉ", href: "/about" }
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors font-medium">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter Section */}
                    <NewsletterSection />
                </div>

                {/* Copyright Section */}
                <div className="pt-8 border-t border-slate-50 text-center">
                    <p className="text-slate-400 text-[11px] font-medium tracking-wider">
                        Copyright © 2026 ENOME. All Rights Reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}

function NewsletterSection() {
    const [email, setEmail] = useState("");
    const subscribeMutation = useSubscribeNewsletter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error("Silakan masukkan email Anda terlebih dahulu");
            return;
        }
        subscribeMutation.mutate(email, {
            onSuccess: () => setEmail(""),
        });
    };

    return (
        <div className="md:col-span-4">
            <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-6">
                Newsletter
            </h4>
            <p className="text-[13px] text-slate-500 font-medium mb-6">
                Dapatkan update koleksi terbaru.
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    disabled={subscribeMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[8px] text-[13px] focus:outline-none focus:ring-1 focus:ring-slate-200 transition-all placeholder:text-slate-300 disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={subscribeMutation.isPending}
                    className="px-5 py-2.5 bg-[#0F172A] text-white text-[12px] font-black tracking-widest rounded-[8px] hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50 min-w-[60px] flex items-center justify-center"
                >
                    {subscribeMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        "OK"
                    )}
                </button>
            </form>
        </div>
    );
}
