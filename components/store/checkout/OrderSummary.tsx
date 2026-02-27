"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, CreditCard, Loader2, ShieldCheck, ShoppingBag, Tag, Truck, X } from "lucide-react";
import { motion } from "framer-motion";

interface OrderSummaryProps {
    totalAmount: number;
    shippingForm: any;
    isLoadingShipping: boolean;
    shippingPrice: number;
    isVoucherApplied: boolean;
    voucherDiscount: number;
    packingFee: number;
    useWallet: boolean;
    setUseWallet: (use: boolean) => void;
    walletBalance: number;
    appliedWalletAmount: number;
    voucherCode: string;
    setVoucherCode: (code: string) => void;
    setIsVoucherApplied: (applied: boolean) => void;
    setVoucherData: (data: any) => void;
    applyVoucher: () => Promise<void>;
    isVoucherLoading: boolean;
    remainingBill: number;
    isSubmitting: boolean;
    cartItemsCount: number;
    submitOrder: () => Promise<void>;
    formatPrice: (price: number) => string;
}

export default function OrderSummary({
    totalAmount,
    shippingForm,
    isLoadingShipping,
    shippingPrice,
    isVoucherApplied,
    voucherDiscount,
    packingFee,
    useWallet,
    setUseWallet,
    walletBalance,
    appliedWalletAmount,
    voucherCode,
    setVoucherCode,
    setIsVoucherApplied,
    setVoucherData,
    applyVoucher,
    isVoucherLoading,
    remainingBill,
    isSubmitting,
    cartItemsCount,
    submitOrder,
    formatPrice
}: OrderSummaryProps) {
    return (
        <aside className="w-full lg:w-[400px] lg:sticky lg:top-28 shrink-0">
            <div className="bg-white border border-neutral-base-100 rounded-xl md:rounded-[32px] p-5 md:p-8 shadow-xl shadow-neutral-base-400/5">
                <div className="flex items-center gap-3 mb-5 md:mb-8">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-amber-50 flex items-center justify-center">
                        <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-800" />
                    </div>
                    <h3 className="font-heading text-[20px] md:text-[26px] font-semibold text-neutral-base-900 tracking-tight">Ringkasan</h3>
                </div>

                <div className="flex flex-col gap-3 md:gap-4 mb-5 md:mb-8">
                    <div className="flex justify-between items-center text-[10px] md:text-[11px] font-black text-neutral-base-400 uppercase tracking-widest">
                        <span>Subtotal</span>
                        <span className="text-neutral-base-900 tabular-nums">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] md:text-[11px] font-black text-neutral-base-400 uppercase tracking-widest">
                        <span className="truncate mr-2">Pengiriman ({shippingForm.courier?.toUpperCase()})</span>
                        <span className="text-neutral-base-900 font-bold flex items-center gap-2 shrink-0">
                            {isLoadingShipping ? (
                                <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
                            ) : shippingForm.courier ? formatPrice(shippingPrice) : (
                                <span className="text-[9px] md:text-[10px] text-amber-800 font-black italic">Belum dipilih</span>
                            )}
                        </span>
                    </div>
                    {isVoucherApplied && (
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-neutral-base-400">Potongan Voucher</span>
                            <span className="text-rose-600">-{formatPrice(voucherDiscount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] md:text-[11px] font-black text-neutral-base-400 uppercase tracking-widest">
                        <span>Biaya Packing</span>
                        <span className="text-neutral-base-900 tabular-nums">{formatPrice(packingFee)}</span>
                    </div>

                    <div className="h-px bg-neutral-base-50 my-1 md:my-2" />

                    {/* Voucher Section */}
                    {isVoucherApplied ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white border border-neutral-base-100 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-neutral-base-50 flex items-center justify-center shrink-0">
                                    <Tag className="w-4 h-4 md:w-5 md:h-5 text-neutral-base-900" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] md:text-[10px] font-black text-neutral-base-400 uppercase tracking-widest">Voucher Aktif</span>
                                    <span className="text-[12px] md:text-[14px] font-black text-neutral-base-900 truncate">{voucherCode}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsVoucherApplied(false);
                                    setVoucherData(null);
                                    setVoucherCode("");
                                }}
                                className="w-7 h-7 md:w-8 md:h-8 rounded-lg hover:bg-rose-50 text-neutral-base-300 hover:text-rose-500 transition-all flex items-center justify-center shrink-0"
                            >
                                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                        </motion.div>
                    ) : (
                        <div className={`border border-neutral-base-100 rounded-xl md:rounded-[24px] p-3 md:p-4 flex flex-col gap-2 md:gap-3 transition-all duration-300 ${remainingBill === 0 ? "bg-neutral-base-50/30 opacity-60 grayscale" : "bg-neutral-base-50/50"}`}>
                            <span className="text-[9px] md:text-[10px] font-black text-neutral-base-900 uppercase tracking-widest ml-1">
                                {remainingBill === 0 ? "Promo Code Tidak Tersedia" : "Punya Kode Promo?"}
                            </span>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={voucherCode}
                                    disabled={remainingBill === 0}
                                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                    className="flex-1 h-10 md:h-12 bg-white border border-neutral-base-100 rounded-lg md:rounded-xl px-3 md:px-4 text-[11px] md:text-[12px] font-bold outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-50 transition-all placeholder:text-neutral-base-200 uppercase disabled:bg-neutral-base-50 disabled:cursor-not-allowed min-w-0"
                                    placeholder={remainingBill === 0 ? "---" : "ENOME10"}
                                />
                                <button
                                    onClick={applyVoucher}
                                    disabled={!voucherCode || isVoucherLoading || remainingBill === 0}
                                    className="px-4 md:px-6 h-10 md:h-12 rounded-lg md:rounded-xl bg-neutral-base-900 text-white text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-neutral-base-800 disabled:opacity-50 transition-all active:scale-95 disabled:cursor-not-allowed shrink-0"
                                >
                                    {isVoucherLoading ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : "Pakai"}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="h-px bg-neutral-base-50 my-1 md:my-2" />

                    <div className="flex justify-between items-center py-1 md:py-2">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-neutral-base-400">Total Tagihan</span>
                            <span className="text-[8px] md:text-[9px] font-black text-neutral-base-900 uppercase tracking-widest">Grand Total</span>
                        </div>
                        <span className="text-[22px] md:text-[28px] font-black text-neutral-base-900 tracking-tighter tabular-nums">
                            {formatPrice(totalAmount + shippingPrice + packingFee - voucherDiscount)}
                        </span>
                    </div>

                    {useWallet && appliedWalletAmount > 0 && (
                        <div className="flex justify-between items-center py-2 md:py-3 px-3 md:px-4 bg-emerald-50 rounded-xl md:rounded-2xl border border-emerald-100">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[8px] md:text-[9px] font-bold text-emerald-800 uppercase tracking-widest">Sisa Pembayaran</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[7px] md:text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                                        {remainingBill === 0 ? "Sudah Tercover Wallet" : "Bayar via Rekening"}
                                    </span>
                                </div>
                            </div>
                            <span className="text-[16px] md:text-[18px] font-black text-emerald-700 tracking-tight tabular-nums">
                                {formatPrice(remainingBill)}
                            </span>
                        </div>
                    )}
                </div>

                <button
                    disabled={isSubmitting || cartItemsCount === 0}
                    onClick={submitOrder}
                    className="w-full bg-neutral-base-900 text-white h-14 md:h-18 rounded-xl md:rounded-[24px] text-[11px] md:text-[13px] font-black uppercase tracking-[0.15em] md:tracking-[0.25em] flex items-center justify-center gap-3 md:gap-4 hover:bg-neutral-base-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-neutral-base-900/15 disabled:opacity-50 disabled:cursor-not-allowed group mb-5 md:mb-8"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    ) : (
                        <>
                            Bayar Sekarang
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </div>
                        </>
                    )}
                </button>

                <div className="flex flex-col gap-3 md:gap-4 px-1 md:px-2">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-neutral-base-900">Pembayaran Aman</span>
                            <span className="text-[8px] md:text-[9px] text-neutral-base-400 font-bold leading-tight">Data transaksi Anda terenkripsi penuh.</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                            <Truck className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-neutral-base-900">Pengiriman Cepat</span>
                            <span className="text-[8px] md:text-[9px] text-neutral-base-400 font-bold leading-tight">Pesanan diproses dalam 1x24 jam.</span>
                        </div>
                    </div>
                </div>
            </div>

            <Link href="/products" className="flex items-center justify-center gap-2 mt-5 md:mt-8 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-neutral-base-400 hover:text-neutral-base-900 transition-all">
                <ArrowLeft className="w-3 h-3" />
                Kembali Belanja
            </Link>
        </aside>
    );
}
