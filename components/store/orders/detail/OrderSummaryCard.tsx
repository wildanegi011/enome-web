"use client";

import { Tag, Receipt, Clock, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency, handleWhatsAppConfirm, cn } from "@/lib/utils";
import { useCallback } from "react";
import { usePaymentVerification } from "@/hooks/use-payment-verification";

interface OrderSummaryCardProps {
    orderId: string;
    totalHarga: number;
    ongkir: number;
    biayalain: number;
    totalTagihan: number;
    metodebayar: string;
    statusTagihan: string;
    viaWallet: number;
    uniqueCodeValue: number;
    voucherInfo?: {
        kode: string;
        nominal: number;
    } | null;
    whatsappAdmin?: string;
    onSuccess?: () => void;
}

export default function OrderSummaryCard({
    orderId,
    totalHarga,
    ongkir,
    biayalain,
    totalTagihan,
    metodebayar,
    statusTagihan,
    viaWallet,
    uniqueCodeValue,
    voucherInfo,
    whatsappAdmin,
    onSuccess,
}: OrderSummaryCardProps) {
    const {
        timeLeft,
        isVerifying,
        isTimeout,
        isSuccess,
        startVerification,
        statusOrder: currentStatusOrder,
        statusTagihan: currentStatusTagihan
    } = usePaymentVerification(
        orderId,
        statusTagihan,
        onSuccess
    );

    const handleStartVerification = () => {
        startVerification();
    };

    // Granular status logic for real-time feel
    const sTagihan = currentStatusTagihan || statusTagihan;
    const sOrder = currentStatusOrder || "OPEN";

    const isPaymentDiterima = sTagihan !== "BELUM BAYAR" && sTagihan !== "UNPAID";
    const isDataMatched = sTagihan === "BAYAR" || sTagihan === "SUDAH BAYAR";
    const isOrderProcessed = sOrder !== "OPEN";

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };



    return (
        <div className="bg-white border border-neutral-base-100 rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-xl shadow-neutral-base-900/5 xl:sticky xl:top-24">
            <div className="flex items-center gap-4 mb-8 md:mb-10">
                <div className="w-10 h-10 rounded-xl bg-neutral-base-900 flex items-center justify-center shadow-lg shadow-neutral-base-900/10">
                    <Receipt className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-[18px] font-bold text-neutral-base-900">
                    Ringkasan Pembayaran
                </h2>
            </div>

            <div className="space-y-4 md:space-y-5 pb-6 md:pb-8 border-b border-neutral-base-50">
                <div className="flex items-center justify-between text-[14px]">
                    <span className="text-neutral-base-400 font-bold">Subtotal</span>
                    <span className="text-neutral-base-900 font-bold">
                        {formatCurrency(totalHarga)}
                    </span>
                </div>
                <div className="flex items-center justify-between text-[14px]">
                    <span className="text-neutral-base-400 font-bold">Biaya Pengiriman</span>
                    <span className="text-neutral-base-900 font-bold">{formatCurrency(ongkir)}</span>
                </div>
                {biayalain > 0 && (
                    <div className="flex items-center justify-between text-[13px]">
                        <span className="text-neutral-base-400 font-medium">Biaya Kemasan</span>
                        <span className="text-neutral-base-900 font-medium">
                            {formatCurrency(biayalain)}
                        </span>
                    </div>
                )}

                {voucherInfo && voucherInfo.nominal > 0 && (
                    <div className="flex items-center justify-between text-[13px]">
                        <span className="text-emerald-600 flex items-center gap-1.5 line-clamp-1 font-medium">
                            <Tag className="w-3.5 h-3.5 shrink-0" />
                            Voucher ({voucherInfo.kode})
                        </span>
                        <span className="text-emerald-600 font-medium">
                            -{formatCurrency(voucherInfo.nominal)}
                        </span>
                    </div>
                )}

                {viaWallet > 0 && (
                    <div className="flex items-center justify-between text-[13px]">
                        <span className="text-emerald-600 font-medium">Wallet Deduction</span>
                        <span className="text-emerald-600 font-medium">
                            -{formatCurrency(viaWallet)}
                        </span>
                    </div>
                )}

                {uniqueCodeValue > 0 && (
                    <div className="flex items-center justify-between text-[13px]">
                        <span className="text-amber-600 font-medium">Kode Unik</span>
                        <span className="text-amber-600 font-medium">
                            +{formatCurrency(uniqueCodeValue)}
                        </span>
                    </div>
                )}
            </div>

            <div className="py-6 md:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[12px] font-bold uppercase tracking-widest text-neutral-base-400">
                    Total Tagihan
                </span>
                <span className="text-[20px] md:text-[24px] font-medium text-neutral-base-900 tracking-tight">
                    {formatCurrency(totalTagihan)}
                </span>
            </div>

            <div className="space-y-4 pt-6">
                {statusTagihan === "BELUM BAYAR" && (
                    <>
                        {/* Verification Info & Status Banner */}
                        <div className={cn(
                            "overflow-hidden border rounded-2xl transition-all duration-500 mb-2",
                            isSuccess
                                ? "bg-emerald-50 border-emerald-200 shadow-md scale-[1.01]"
                                : isVerifying
                                    ? (isTimeout ? "bg-rose-50 border-rose-200" : "bg-amber-50/50 border-amber-200 shadow-sm")
                                    : "bg-emerald-50/60 border-emerald-100"
                        )}>
                            <div className={cn(
                                "p-4 flex items-start gap-3",
                                (isVerifying || isSuccess) && (isTimeout ? "border-b border-rose-200/50" : (isSuccess ? "border-b border-emerald-200/50" : "border-b border-amber-200/50"))
                            )}>
                                {isSuccess ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                                ) : isVerifying ? (
                                    isTimeout ? (
                                        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5" />
                                    ) : (
                                        <Clock className="w-4 h-4 text-amber-600 animate-pulse mt-0.5" />
                                    )
                                ) : (
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p className={cn(
                                        "text-[11px] font-bold leading-relaxed mb-0.5",
                                        isSuccess
                                            ? "text-emerald-900"
                                            : isVerifying
                                                ? (isTimeout ? "text-rose-900" : "text-amber-900")
                                                : "text-emerald-900"
                                    )}>
                                        {isSuccess
                                            ? "Pembayaran Terdeteksi!"
                                            : isVerifying ? (
                                                isTimeout ? "Gagal Verifikasi Otomatis" : <>Verifikasi: <span className="text-amber-900">{formatTime(timeLeft || 0)}</span></>
                                            ) : (
                                                "Verifikasi Otomatis"
                                            )}
                                    </p>
                                    <p className={cn(
                                        "text-[10px] font-medium leading-relaxed opacity-80",
                                        isSuccess
                                            ? "text-emerald-800"
                                            : isVerifying
                                                ? (isTimeout ? "text-rose-800" : "text-amber-800")
                                                : "text-emerald-800"
                                    )}>
                                        {isSuccess
                                            ? "Dana diterima! Pesanan diproses."
                                            : isVerifying
                                                ? (isTimeout ? "Mohon konfirmasi manual." : "Mencocokkan data transaksi...")
                                                : "Berdasarkan nominal & kode unik Anda."}
                                    </p>
                                </div>
                            </div>

                            {/* Verification Steps - Shown when verifying OR Success */}
                            {(isVerifying || isSuccess) && !isTimeout && (
                                <div className="px-5 py-4 bg-white/50 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                                            isPaymentDiterima ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                                        )}>
                                            {isPaymentDiterima ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> : <div className="w-1 h-1 rounded-full bg-white" />}
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold",
                                            isPaymentDiterima ? "text-neutral-base-700" : "text-neutral-base-900"
                                        )}>Menunggu Pembayaran</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                                            isDataMatched ? "bg-emerald-500" : (isPaymentDiterima ? "bg-amber-500 animate-pulse" : "bg-neutral-base-200 opacity-40")
                                        )}>
                                            {isDataMatched ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> : <div className="w-1 h-1 rounded-full bg-white" />}
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold",
                                            isDataMatched ? "text-neutral-base-700" : (isPaymentDiterima ? "text-neutral-base-900" : "text-neutral-base-600 opacity-40")
                                        )}>Data Transaksi Cocok</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                                            isOrderProcessed ? "bg-emerald-500" : (isDataMatched ? "bg-amber-500 animate-pulse" : "bg-neutral-base-200 opacity-40")
                                        )}>
                                            {isOrderProcessed ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> : <div className="w-1 h-1 rounded-full bg-white" />}
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold",
                                            isOrderProcessed ? "text-neutral-base-700" : (isDataMatched ? "text-neutral-base-900" : "text-neutral-base-600 opacity-40")
                                        )}>Pesanan Diproses</span>
                                    </div>
                                    {!isSuccess && (
                                        <p className="text-[9px] text-amber-700/70 italic leading-tight pt-1 border-t border-amber-100/50">
                                            *Jika dalam 15 menit belum terverifikasi, silakan hubungi WhatsApp Admin.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Timeout Info */}
                            {isVerifying && isTimeout && (
                                <div className="px-4 py-3 bg-rose-50/50">
                                    <p className="text-[10px] text-rose-700/80 font-bold italic leading-snug">
                                        *Sistem belum mendeteksi pembayaran. Hubungi CS via WhatsApp.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 gap-3">
                            {isSuccess ? (
                                <div className="flex items-center justify-center gap-2.5 h-12 rounded-xl bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg animate-pulse">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Berhasil Dikonfirmasi
                                </div>
                            ) : isVerifying && !isTimeout ? (
                                <div className="flex items-center justify-center gap-2.5 h-12 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                                    <Clock className="w-3.5 h-3.5 animate-spin-slow" />
                                    Mengecek Status...
                                </div>
                            ) : !isVerifying && !isTimeout ? (
                                <button
                                    onClick={handleStartVerification}
                                    className="flex items-center justify-center gap-2.5 h-12 rounded-xl bg-neutral-base-900 text-white hover:bg-neutral-base-800 transition-all shadow-md active:scale-[0.98] text-[11px] font-bold uppercase tracking-wider"
                                >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Saya Sudah Bayar
                                </button>
                            ) : null}

                            <button
                                onClick={() => handleWhatsAppConfirm(orderId, totalTagihan, metodebayar, whatsappAdmin || "")}
                                className={cn(
                                    "flex items-center justify-center gap-2.5 h-12 rounded-xl border transition-all active:scale-[0.98] text-[11px] font-bold uppercase tracking-wider",
                                    isTimeout
                                        ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-lg"
                                        : "border-emerald-500 text-emerald-600 bg-white hover:bg-emerald-50"
                                )}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                WA Konfirmasi
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
