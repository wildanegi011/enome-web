"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Calendar, Copy, Check } from "lucide-react";
import FormattedDate from "@/components/store/shared/FormattedDate";

interface OrderHeaderProps {
    orderId: string;
    tglOrder: string;
    statusTagihan?: string;
}

export default function OrderHeader({ orderId, tglOrder, statusTagihan }: OrderHeaderProps) {
    const [copiedOrderId, setCopiedOrderId] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedOrderId(true);
        setTimeout(() => setCopiedOrderId(false), 2000);
    };

    return (
        <div className="flex flex-col gap-6 mb-10">
        <div className="flex items-start gap-4">
            <Link
                href="/account/orders"
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-neutral-base-100 flex items-center justify-center hover:bg-neutral-base-50 transition-all shrink-0 shadow-sm active:scale-95"
            >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-neutral-base-900" />
            </Link>
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h1 className="text-[20px] md:text-[32px] font-bold text-neutral-base-900 tracking-tight font-montserrat leading-tight">
                        Detail Pesanan
                    </h1>
                    {statusTagihan === 'KADALUARSA' && (
                        <div className="px-2.5 py-0.5 bg-rose-50 border border-rose-100 rounded-full">
                            <span className="text-[9px] md:text-[11px] font-black text-rose-600 uppercase tracking-widest font-montserrat">
                                Kadaluarsa
                            </span>
                        </div>
                    )}
                </div>
                <p className="text-[11px] md:text-[14px] text-neutral-base-400 font-medium font-montserrat leading-relaxed line-clamp-2 sm:line-clamp-none">
                    Informasi lengkap pesanan dan status perjalanan paket Anda.
                </p>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-y-4 gap-x-4 md:gap-x-8">
            {/* Order Date */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white border border-neutral-base-100 rounded-full shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-neutral-base-400" />
                <span className="text-[11px] md:text-[13px] font-bold text-neutral-base-600 font-montserrat">
                    <FormattedDate
                        date={tglOrder}
                        options={{ day: "numeric", month: "long", year: "numeric" }}
                    />
                </span>
            </div>

            {/* Order ID Pill */}
            <div className="flex items-center gap-3">
                <span className="text-[9px] md:text-[11px] font-black text-neutral-base-400 uppercase tracking-widest font-montserrat hidden sm:block">
                    ID Pesanan
                </span>
                <div
                    onClick={() => handleCopy(orderId)}
                    className="flex items-center gap-2.5 px-3 py-1.5 bg-neutral-base-900 border border-neutral-base-900 rounded-full group transition-all hover:bg-neutral-base-800 active:scale-95 cursor-pointer shadow-md shadow-neutral-base-900/10"
                >
                    <span className="text-[11px] md:text-[13px] font-black text-white tracking-widest font-mono">
                        {orderId}
                    </span>
                    <div className="w-px h-3 bg-white/20" />
                    {copiedOrderId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                        <Copy className="w-3 h-3 text-white/50 group-hover:text-white transition-colors" />
                    )}
                </div>
            </div>
        </div>
        </div>
    );
}
