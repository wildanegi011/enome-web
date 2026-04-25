"use client";

import { ASSET_URL } from "@/config/config";
import { CreditCard, Landmark, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentSectionProps {
    remainingBill: number;
    useWallet: boolean;
    isLoadingPayments: boolean;
    paymentMethods: any[];
    paymentMethod: string;
    paymentMethodId: number | null;
    setPaymentMethod: (method: string) => void;
    setPaymentMethodId: (id: number | null) => void;
    hasError?: boolean;
    onFieldChange?: () => void;
}

export default function PaymentSection({
    remainingBill,
    useWallet,
    isLoadingPayments,
    paymentMethods,
    paymentMethod,
    paymentMethodId,
    setPaymentMethod,
    setPaymentMethodId,
    hasError,
    onFieldChange
}: PaymentSectionProps) {
    return (
        <section className={cn(
            "flex flex-col gap-3 bg-white/80 backdrop-blur-sm border border-neutral-base-100/50 p-4 md:p-5 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300",
            hasError ? "ring-2 ring-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.1)]" : ""
        )}>
            <div className="flex items-center justify-between border-b border-neutral-base-50 pb-2 md:pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center text-amber-800">
                        <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <h2 className="text-[14px] md:text-[15px] font-bold uppercase tracking-widest md:tracking-[0.15em] text-neutral-base-900">
                        Metode Pembayaran
                    </h2>
                </div>

            </div>

            {remainingBill === 0 && useWallet ? (
                <div className="bg-emerald-50/30 border border-emerald-100 p-6 md:p-8 rounded-xl md:rounded-[32px] flex flex-col items-center text-center gap-3 md:gap-4">
                    <div className="flex flex-col items-center justify-center py-10 md:py-16 gap-3">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-50 flex items-center justify-center">
                            <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" />
                        </div>
                        <h4 className="text-[15px] md:text-[17px] font-bold text-neutral-base-900">Pembayaran Tercover Wallet</h4>
                        <p className="text-[11px] md:text-[12px] font-bold text-neutral-base-500 mt-1 uppercase tracking-widest leading-loose">Automatis Lunas via Saldo Anda.</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 md:gap-5">
                    {isLoadingPayments ? (
                        <div className="flex flex-col items-center justify-center py-8 md:py-10 gap-3 md:gap-4">
                            <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-amber-800 animate-spin" />
                            <p className="text-[11px] md:text-[12px] font-bold text-neutral-base-400 uppercase tracking-widest">Memuat Metode Pembayaran...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {paymentMethods.map((method) => {
                                const isBcaMandiri = method.namaBank?.toUpperCase().includes("BCA") || method.namaBank?.toUpperCase().includes("MANDIRI");
                                const isUnderLimit = remainingBill < 10000;
                                const isBcaMandiriUnderLimit = isBcaMandiri && isUnderLimit;
                                const isDisabled = isBcaMandiriUnderLimit;

                                return (
                                    <button
                                        key={method.id}
                                        disabled={isDisabled}
                                        onClick={() => {
                                            setPaymentMethod(method.namaBank);
                                            setPaymentMethodId(method.id);
                                            onFieldChange?.();
                                        }}
                                        className={`bg-white/70 backdrop-blur-xs border p-3.5 md:p-4 rounded-[24px] md:rounded-[28px] flex items-center justify-between hover:shadow-xl hover:shadow-neutral-base-900/5 transition-all group relative overflow-hidden ${paymentMethodId === method.id ? "border-amber-800 bg-amber-50/30" : "border-neutral-base-100/50"} ${isDisabled ? "cursor-not-allowed" : ""}`}
                                    >
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-all font-bold text-[11px] ${paymentMethodId === method.id ? "bg-white text-amber-800" : "bg-neutral-base-50 text-neutral-base-400 group-hover:bg-amber-50 group-hover:text-amber-800"} ${isDisabled ? "opacity-40 grayscale" : ""}`}>
                                                {method.logoBank ? (
                                                    <img src={`${ASSET_URL}/img/rekening_pembayaran/${method.logoBank}`} alt={method.namaBank} className="w-6 h-6 md:w-8 md:h-8 object-contain" />
                                                ) : (
                                                    method.namaBank.substring(0, 3)
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0 items-start">
                                                <h4 className={cn(
                                                    "text-[13px] md:text-[14px] font-bold text-neutral-base-900 leading-tight",
                                                    isDisabled && "opacity-40"
                                                )}>
                                                    {method.namaBank}
                                                </h4>
                                                {isBcaMandiriUnderLimit ? (
                                                    <p className="text-[11px] md:text-[12px] font-bold text-red-500 uppercase tracking-widest mt-0.5 md:mt-1">Min. Transfer Rp 10.000</p>
                                                ) : (
                                                    <div className="flex flex-col items-start mt-0.5 md:mt-1">
                                                        <p className={cn(
                                                            "text-[11px] md:text-[12px] font-bold text-neutral-base-400 uppercase tracking-widest truncate max-w-[120px] md:max-w-none",
                                                            isDisabled && "opacity-40"
                                                        )}>{method.namaPemilik}</p>
                                                        {Number(method.isMaintenance) === 1 && (
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                                <p className="text-[9px] md:text-[9px] font-black text-amber-600 uppercase tracking-wider">Verifikasi Otomatis Terkendala</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "w-4 h-4 md:w-5 md:h-5 rounded-full border-2 transition-all flex items-center justify-center shrink-0",
                                            paymentMethodId === method.id ? "border-amber-800" : "border-neutral-base-200",
                                            isDisabled && "opacity-40"
                                        )}>
                                            {paymentMethodId === method.id && <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-amber-800" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
