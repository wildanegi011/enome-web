"use client";

import React from "react";
import { Clock, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONFIG } from "@/lib/config";

interface PaymentVerificationStatusProps {
    variant?: "full" | "compact";
    timeLeft: number | null;
    isVerifying: boolean;
    isTimeout: boolean;
    isSuccess: boolean;
    statusOrder: string | null;
    statusTagihan: string | null;
    onStartVerification: () => void;
    showAction?: boolean;
    // For WA button
    onClickWA?: () => void;
}

export default function PaymentVerificationStatus({
    variant = "full",
    timeLeft,
    isVerifying,
    isTimeout,
    isSuccess,
    statusOrder,
    statusTagihan,
    onStartVerification,
    showAction = false,
    onClickWA
}: PaymentVerificationStatusProps) {
    const isFull = variant === "full";
    
    // Granular status logic
    const isPaymentDiterima = statusTagihan !== "BELUM BAYAR" && statusTagihan !== "UNPAID";
    const isDataMatched = statusTagihan === "BAYAR" || statusTagihan === "SUDAH BAYAR";
    const isOrderProcessed = statusOrder !== "OPEN" && statusOrder !== null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex flex-col gap-4">
            <div className={cn(
                "overflow-hidden border rounded-2xl transition-all duration-500",
                isSuccess
                    ? "bg-emerald-50 border-emerald-200 shadow-md scale-[1.01]"
                    : isVerifying
                        ? (isTimeout ? "bg-rose-50 border-rose-200" : "bg-amber-50/50 border-amber-200 shadow-sm")
                        : "bg-emerald-50/60 border-emerald-100"
            )}>
                {/* Header Info */}
                <div className={cn(
                    isFull ? "p-4 md:p-5 flex items-start gap-3.5" : "p-4 flex items-start gap-3",
                    (isVerifying || isSuccess) && (
                        isSuccess
                            ? "border-b border-emerald-200/50"
                            : isTimeout ? "border-b border-rose-200/50" : "border-b border-amber-200/50"
                    )
                )}>
                    <div className={cn(
                        isFull 
                            ? "w-9 h-9 rounded-full flex items-center justify-center shadow-sm shrink-0 mt-0.5"
                            : "shrink-0 mt-0.5",
                        isFull && (
                            isSuccess
                                ? "bg-emerald-100"
                                : isVerifying
                                    ? (isTimeout ? "bg-rose-100" : "bg-amber-100")
                                    : "bg-emerald-100"
                        )
                    )}>
                        {isSuccess ? (
                            <CheckCircle2 className={cn("text-emerald-600", isFull ? "w-5 h-5" : "w-4 h-4")} />
                        ) : isVerifying ? (
                            isTimeout ? (
                                <AlertCircle className={cn("text-rose-600", isFull ? "w-4.5 h-4.5" : "w-4 h-4")} />
                            ) : (
                                <Clock className={cn("text-amber-600 animate-pulse", isFull ? "w-4.5 h-4.5" : "w-4 h-4")} />
                            )
                        ) : (
                            <ShieldCheck className={cn("text-emerald-600", isFull ? "w-5 h-5" : "w-4 h-4")} />
                        )}
                    </div>
                    <div className="flex-1">
                        <p className={cn(
                            "font-bold mb-1 leading-relaxed",
                            isFull ? "text-[13px] md:text-[14px]" : "text-[12px] mb-0.5",
                            isSuccess
                                ? "text-emerald-900"
                                : isVerifying
                                    ? (isTimeout ? "text-rose-900" : "text-amber-900")
                                    : "text-emerald-900"
                        )}>
                            {isSuccess
                                ? "Pembayaran Terdeteksi!"
                                : isVerifying
                                    ? (isTimeout 
                                        ? (isFull ? "Verifikasi Melewati Batas Waktu" : "Gagal Verifikasi Otomatis")
                                        : (isFull ? "Verifikasi Sedang Berjalan" : <>Verifikasi: <span className="text-amber-900">{formatTime(timeLeft || 0)}</span></>)
                                      )
                                    : "Verifikasi Otomatis Tersedia"}
                        </p>
                        <div className={cn(
                            "font-medium leading-relaxed opacity-80",
                            isFull ? "text-[12px] md:text-[13px]" : "text-[12px]",
                            isSuccess
                                ? "text-emerald-800"
                                : isVerifying
                                    ? (isTimeout ? "text-rose-800" : "text-amber-800")
                                    : "text-emerald-800"
                        )}>
                            {isSuccess ? (
                                isFull ? "Pembayaran Anda berhasil diverifikasi! Menyiapkan detail pesanan..." : "Dana diterima! Pesanan diproses."
                            ) : isVerifying ? (
                                isTimeout ? (
                                    isFull 
                                        ? <>Sistem belum dapat mendeteksi pembayaran Anda. Mohon <span className="font-bold underline">Konfirmasi Manual via WhatsApp</span> di bawah.</>
                                        : "Mohon konfirmasi manual."
                                ) : (
                                    isFull 
                                        ? <>Estimasi selesai dalam <span className="font-bold text-amber-900">{formatTime(timeLeft || 0)}</span>. Jangan khawatir, pesanan akan otomatis terproses.</>
                                        : "Mencocokkan data transaksi..."
                                )
                            ) : (
                                isFull 
                                    ? <>Sistem kami akan mencocokkan mutasi bank secara otomatis berdasarkan <span className="font-bold underline">nominal transfer & kode unik</span> Anda.</>
                                    : "Berdasarkan nominal & kode unik Anda."
                            )}
                        </div>
                    </div>
                </div>

                {/* Verification Steps - Shown when verifying OR Success */}
                {(isVerifying || isSuccess) && !isTimeout && (
                    <div className={cn("bg-white/50 space-y-3.5", isFull ? "px-5 py-4" : "px-5 py-4 space-y-3")}>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "rounded-full flex items-center justify-center shrink-0",
                                isFull ? "w-5 h-5" : "w-4 h-4",
                                isPaymentDiterima ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                            )}>
                                {isPaymentDiterima ? <CheckCircle2 className={cn("text-white", isFull ? "w-3 h-3" : "w-2.5 h-2.5")} /> : <div className={isFull ? "w-1.5 h-1.5 rounded-full bg-white" : "w-1 h-1 rounded-full bg-white"} />}
                            </div>
                            <span className={cn(
                                "font-bold",
                                isFull ? "text-[12px]" : "text-[12px]",
                                isPaymentDiterima ? "text-neutral-base-700" : "text-neutral-base-900"
                            )}>Menunggu Pembayaran</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "rounded-full flex items-center justify-center shrink-0",
                                isFull ? "w-5 h-5" : "w-4 h-4",
                                isDataMatched ? "bg-emerald-500" : (isPaymentDiterima ? "bg-amber-500 animate-pulse" : "bg-neutral-base-200 opacity-40")
                            )}>
                                {isDataMatched ? <CheckCircle2 className={cn("text-white", isFull ? "w-3 h-3" : "w-2.5 h-2.5")} /> : <div className={isFull ? "w-1.5 h-1.5 rounded-full bg-white" : "w-1 h-1 rounded-full bg-white"} />}
                            </div>
                            <span className={cn(
                                "font-bold",
                                isFull ? "text-[12px]" : "text-[12px]",
                                isDataMatched ? "text-neutral-base-700" : (isPaymentDiterima ? "text-neutral-base-900" : "text-neutral-base-600 opacity-40")
                            )}>Data Transaksi Cocok</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "rounded-full flex items-center justify-center shrink-0",
                                isFull ? "w-5 h-5" : "w-4 h-4",
                                isOrderProcessed ? "bg-emerald-500" : (isDataMatched ? "bg-amber-500 animate-pulse" : "bg-neutral-base-200 opacity-40")
                            )}>
                                {isOrderProcessed ? <CheckCircle2 className={cn("text-white", isFull ? "w-3 h-3" : "w-2.5 h-2.5")} /> : <div className={isFull ? "w-1.5 h-1.5 rounded-full bg-white" : "w-1 h-1 rounded-full bg-white"} />}
                            </div>
                            <span className={cn(
                                "font-bold",
                                isFull ? "text-[12px]" : "text-[12px]",
                                isOrderProcessed ? "text-neutral-base-700" : (isDataMatched ? "text-neutral-base-900" : "text-neutral-base-600 opacity-40")
                            )}>Pesanan Diproses</span>
                        </div>

                        {!isSuccess && (
                            <div className={cn("pt-2 border-t border-amber-100/50 mt-1", !isFull && "pt-1")}>
                                <p className={cn("text-amber-700/70 italic leading-relaxed", isFull ? "text-[11px]" : "text-[11px] leading-tight")}>
                                    *Jika dalam {CONFIG.PAYMENT_VERIFICATION_TIMEOUT_MINS} menit belum terverifikasi, silakan hubungi WhatsApp Admin.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Timeout Info (Compact) */}
                {!isFull && isVerifying && isTimeout && (
                    <div className="px-4 py-3 bg-rose-50/50">
                        <p className="text-[12px] text-rose-700/80 font-bold italic leading-snug">
                            *Sistem belum mendeteksi pembayaran. Hubungi CS via WhatsApp.
                        </p>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            {showAction && (
                <div className={cn(
                    "grid gap-3",
                    isFull ? "grid-cols-1 md:grid-cols-2 mt-2 md:gap-4" : "grid-cols-1"
                )}>
                    {isSuccess ? (
                        <div className={cn(
                            "flex items-center justify-center gap-2.5 h-12 rounded-xl text-white font-bold uppercase tracking-wider shadow-lg animate-pulse",
                            isFull ? "bg-emerald-600 md:h-14 text-[13px] md:text-[14px] md:rounded-2xl" : "bg-emerald-600 text-[12px]"
                        )}>
                            <CheckCircle2 className={isFull ? "w-4 h-4 md:w-5 md:h-5" : "w-3.5 h-3.5"} />
                            {isFull ? "Pembayaran Sukses!" : "Dikonfirmasi"}
                        </div>
                    ) : isVerifying && !isTimeout ? (
                        <div className={cn(
                            "flex items-center justify-center gap-2.5 h-12 rounded-xl bg-amber-50 border border-amber-200 font-bold uppercase tracking-wider text-amber-700",
                            isFull ? "md:h-14 text-[13px] md:text-[14px] md:rounded-2xl" : "text-[12px]"
                        )}>
                            <Clock className={cn("animate-spin-slow", isFull ? "w-4 h-4 md:w-5 md:h-5" : "w-3.5 h-3.5")} />
                            Mengecek Status...
                        </div>
                    ) : !isTimeout ? (
                        <button
                            onClick={onStartVerification}
                            className={cn(
                                "flex items-center justify-center gap-2.5 rounded-xl bg-neutral-base-900 text-white hover:bg-neutral-base-800 transition-all shadow-md active:scale-[0.98] font-bold uppercase tracking-wider",
                                isFull ? "h-12 md:h-14 text-[13px] md:text-[14px] md:rounded-2xl" : "h-12 text-[12px]"
                            )}
                        >
                            <ShieldCheck className={isFull ? "w-4 h-4 md:w-5 md:h-5" : "w-3.5 h-3.5"} />
                            Saya Sudah Bayar
                        </button>
                    ) : null}

                    {onClickWA && !isSuccess && (
                        <button
                            onClick={onClickWA}
                            className={cn(
                                "flex items-center justify-center gap-2.5 h-12 rounded-xl border transition-all active:scale-[0.98] font-bold uppercase tracking-wider",
                                isFull ? "md:h-14 text-[13px] md:text-[14px] md:rounded-2xl" : "text-[12px]",
                                isTimeout
                                    ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-lg col-span-full"
                                    : "border-emerald-500 text-emerald-600 bg-white hover:bg-emerald-50"
                            )}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className={isFull ? "w-4.5 h-4.5" : "w-4 h-4"}>
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            WA Konfirmasi {isTimeout && "Manual"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
