"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Calendar, Copy, Check } from "lucide-react";

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                    <Link
                        href="/account/orders"
                        className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border border-neutral-base-100 flex items-center justify-center hover:bg-neutral-base-50 transition-all shrink-0"
                    >
                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-neutral-base-900" />
                    </Link>
                    <h1 className="text-[24px] md:text-[36px] font-semibold text-neutral-base-900 tracking-tighter">
                        Detail Pesanan
                    </h1>
                    {statusTagihan === 'KADALUARSA' && (
                        <div className="px-3 py-1 bg-rose-50 border border-rose-100 rounded-full h-fit mt-1 sm:mt-2">
                            <span className="text-[10px] md:text-[11px] font-black text-rose-600 uppercase tracking-wider">
                                Kadaluarsa
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-y-4 gap-x-6 ml-14 md:ml-0">
                {/* Order Date */}
                <div className="flex items-center gap-3 text-neutral-base-400">
                    <Calendar className="w-4 h-4 opacity-50" />
                    <span className="text-[13px] md:text-[14px] font-bold text-neutral-base-500">
                        {new Date(tglOrder).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </span>
                </div>

                {/* Order ID Pill */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 pl-0 sm:pl-6 border-l-0 sm:border-l border-neutral-base-100">
                    <span className="text-[11px] font-bold text-neutral-base-400 tracking-wider">
                        ID Pesanan
                    </span>
                    <div
                        onClick={() => handleCopy(orderId)}
                        className="flex items-center gap-2.5 px-3 py-1.5 bg-neutral-base-50 border border-neutral-base-100 rounded-xl group transition-all hover:bg-white hover:border-neutral-base-900 hover:shadow-md active:scale-95 cursor-pointer"
                    >
                        <span className="text-[11px] md:text-[12px] font-black text-neutral-base-900 tracking-wider font-mono">
                            {orderId}
                        </span>
                        <div className="w-px h-3 bg-neutral-base-200" />
                        {copiedOrderId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                            <Copy className="w-3.5 h-3.5 text-neutral-base-300 group-hover:text-neutral-base-900 transition-colors" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
