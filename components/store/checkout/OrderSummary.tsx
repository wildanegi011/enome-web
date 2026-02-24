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
            <div className="bg-white border border-neutral-base-100 rounded-[32px] p-8 shadow-xl shadow-neutral-base-400/5">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-amber-800" />
                    </div>
                    <h3 className="font-heading text-[26px] font-semibold text-neutral-base-900 tracking-tight">Ringkasan</h3>
                </div>

                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex justify-between items-center text-[11px] font-black text-neutral-base-400 uppercase tracking-widest">
                        <span>Subtotal</span>
                        <span className="text-neutral-base-900">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-black text-neutral-base-400 uppercase tracking-widest">
                        <span>Pengiriman ({shippingForm.courier?.toUpperCase()}{shippingForm.service ? ` - ${shippingForm.service}` : ''})</span>
                        <span className="text-neutral-base-900 font-bold flex items-center gap-2">
                            {isLoadingShipping ? (
                                <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
                            ) : shippingForm.courier ? formatPrice(shippingPrice) : (
                                <span className="text-[10px] text-amber-800 font-black italic">Belum dipilih</span>
                            )}
                        </span>
                    </div>
                    {isVoucherApplied && (
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-neutral-base-400">Potongan Voucher</span>
                            <span className="text-rose-600">-{formatPrice(voucherDiscount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-[11px] font-black text-neutral-base-400 uppercase tracking-widest">
                        <span>Biaya Packing</span>
                        <span className="text-neutral-base-900">{formatPrice(packingFee)}</span>
                    </div>

                    <div className="h-px bg-neutral-base-50 my-2" />

                    {/* Wallet Section */}
                    <div className={`p-5 rounded-[24px] border transition-all duration-300 ${useWallet ? "bg-linear-to-br from-emerald-50 to-teal-50 border-emerald-100 shadow-sm" : "bg-neutral-base-50/50 border-neutral-base-100"}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${useWallet ? "bg-white text-emerald-600" : "bg-white text-neutral-base-300"}`}>
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${useWallet ? "text-emerald-800" : "text-neutral-base-400"}`}>Saldo Wallet</span>
                                    <span className={`text-[14px] font-black ${useWallet ? "text-emerald-700" : "text-neutral-base-900"}`}>{formatPrice(walletBalance)}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setUseWallet(!useWallet)}
                                disabled={walletBalance <= 0}
                                className={`w-12 h-6 rounded-full transition-all relative ${useWallet ? "bg-emerald-500" : "bg-neutral-base-200"}`}
                            >
                                <motion.div
                                    animate={{ x: useWallet ? 26 : 4 }}
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                                />
                            </button>
                        </div>

                        {useWallet && (
                            <div className="pt-4 border-t border-emerald-100/50 flex justify-between items-center">
                                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Dipotong</span>
                                <span className="text-[12px] font-black text-emerald-700">-{formatPrice(appliedWalletAmount)}</span>
                            </div>
                        )}
                    </div>

                    {/* Voucher Section */}
                    {isVoucherApplied ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-2 bg-white border border-neutral-base-100 rounded-2xl p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-neutral-base-50 flex items-center justify-center">
                                    <Tag className="w-5 h-5 text-neutral-base-900" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-neutral-base-400 uppercase tracking-widest">Voucher Aktif</span>
                                    <span className="text-[14px] font-black text-neutral-base-900">{voucherCode}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setIsVoucherApplied(false);
                                    setVoucherData(null);
                                    setVoucherCode("");
                                }}
                                className="w-8 h-8 rounded-lg hover:bg-rose-50 text-neutral-base-300 hover:text-rose-500 transition-all flex items-center justify-center"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ) : (
                        <div className="mt-2 bg-neutral-base-50/50 border border-neutral-base-100 rounded-[24px] p-4 flex flex-col gap-3">
                            <span className="text-[10px] font-black text-neutral-base-900 uppercase tracking-widest ml-1">Punya Kode Promo?</span>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={voucherCode}
                                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                    className="flex-1 h-12 bg-white border border-neutral-base-100 rounded-xl px-4 text-[12px] font-bold outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-50 transition-all placeholder:text-neutral-base-200 uppercase"
                                    placeholder="CONTOH: ENOME10"
                                />
                                <button
                                    onClick={applyVoucher}
                                    disabled={!voucherCode || isVoucherLoading}
                                    className="px-6 h-12 rounded-xl bg-neutral-base-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-neutral-base-800 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    {isVoucherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pakai"}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="h-px bg-neutral-base-50 my-2" />

                    <div className="flex justify-between items-center py-2">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-base-400">Total Tagihan</span>
                            {useWallet && appliedWalletAmount > 0 && (
                                <div className="flex items-center gap-1.5 ">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Sisa: {formatPrice(remainingBill)}</span>
                                </div>
                            )}
                        </div>
                        <span className="text-[28px] font-black text-neutral-base-900 tracking-tighter">
                            {formatPrice(remainingBill)}
                        </span>
                    </div>
                </div>

                <button
                    disabled={isSubmitting || cartItemsCount === 0}
                    onClick={submitOrder}
                    className="w-full bg-neutral-base-900 text-white h-18 rounded-[24px] text-[13px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-4 hover:bg-neutral-base-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-neutral-base-900/15 disabled:opacity-50 disabled:cursor-not-allowed group mb-8"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Bayar Sekarang
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </>
                    )}
                </button>

                <div className="flex flex-col gap-4 px-2">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-base-900">Pembayaran Aman</span>
                            <span className="text-[9px] text-neutral-base-400 font-bold leading-tight">Data transaksi Anda terenkripsi penuh.</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                            <Truck className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-base-900">Pengiriman Cepat</span>
                            <span className="text-[9px] text-neutral-base-400 font-bold leading-tight">Pesanan akan diproses dalam 1x24 jam.</span>
                        </div>
                    </div>
                </div>
            </div>

            <Link href="/products" className="flex items-center justify-center gap-2 mt-8 text-[11px] font-black uppercase tracking-widest text-neutral-base-400 hover:text-neutral-base-900 transition-all">
                <ArrowLeft className="w-3 h-3" />
                Kembali Belanja
            </Link>
        </aside>
    );
}
