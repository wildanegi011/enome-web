"use client";

import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, ChevronRight, ShieldCheck, Truck } from "lucide-react";

interface CartSummaryProps {
    selectedCount: number;
    totalAmount: number;
    onCheckout: () => void;
    isMobileFooter?: boolean;
}

export default function CartSummary({
    selectedCount,
    totalAmount,
    onCheckout,
    isMobileFooter = false
}: CartSummaryProps) {
    if (isMobileFooter) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-neutral-base-100 p-4 pb-safe-offset-4 lg:hidden">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-neutral-base-400 uppercase tracking-widest leading-none mb-1">Total ({selectedCount} item)</span>
                        <span className="text-[18px] font-black text-neutral-base-900 tracking-tighter leading-none">
                            {formatCurrency(totalAmount)}
                        </span>
                    </div>
                    <button
                        onClick={onCheckout}
                        disabled={selectedCount === 0}
                        className="bg-neutral-base-900 text-white px-6 h-12 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-neutral-base-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group whitespace-nowrap"
                    >
                        Checkout
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <aside className="w-full lg:w-[380px] lg:sticky lg:top-28 shrink-0">
            <div className="bg-white border border-neutral-base-100 rounded-2xl md:rounded-[32px] p-5 md:p-6 shadow-xl shadow-neutral-base-400/5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-amber-800" />
                    </div>
                    <h3 className="font-heading text-[20px] md:text-[22px] font-bold text-neutral-base-900 tracking-tight">Ringkasan</h3>
                </div>

                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-neutral-base-400 uppercase tracking-[0.15em]">Subtotal ({selectedCount} item)</span>
                        <span className="text-[13px] font-black text-neutral-base-900 tabular-nums">
                            {formatCurrency(totalAmount)}
                        </span>
                    </div>
                    <div className="h-px bg-neutral-base-50" />
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-end">
                            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-neutral-base-900">Total Tagihan</span>
                            <span className="text-[24px] md:text-[26px] font-black text-neutral-base-900 tracking-tighter leading-none tabular-nums">
                                {formatCurrency(totalAmount)}
                            </span>
                        </div>
                        <p className="text-[9px] text-neutral-base-400 font-bold italic text-right">*Belum termasuk ongkir</p>
                    </div>
                </div>

                <button
                    onClick={onCheckout}
                    disabled={selectedCount === 0}
                    className="w-full bg-neutral-base-900 text-white h-14 md:h-16 rounded-xl md:rounded-[20px] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-neutral-base-800 transition-all shadow-xl shadow-neutral-base-900/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    Checkout Sekarang
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="mt-6 pt-5 border-t border-neutral-base-50 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-base-400">Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-amber-600" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-base-400">Fast Delivery</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
