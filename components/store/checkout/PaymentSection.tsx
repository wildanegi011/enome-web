"use client";

import { Landmark, Loader2, ShieldCheck } from "lucide-react";

interface PaymentSectionProps {
    remainingBill: number;
    useWallet: boolean;
    isLoadingPayments: boolean;
    paymentMethods: any[];
    paymentMethod: string;
    setPaymentMethod: (method: string) => void;
    hasError?: boolean;
    onFieldChange?: () => void;
}

export default function PaymentSection({
    remainingBill,
    useWallet,
    isLoadingPayments,
    paymentMethods,
    paymentMethod,
    setPaymentMethod,
    hasError,
    onFieldChange
}: PaymentSectionProps) {
    return (
        <section className="flex flex-col gap-4 md:gap-6 bg-white/80 backdrop-blur-sm border border-neutral-base-100/50 p-4 md:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className={`p-1 rounded-[32px] transition-all duration-300 ${hasError ? "ring-2 ring-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.1)]" : ""}`}>
                <div className="flex flex-col gap-5 md:gap-8 bg-neutral-base-50/20 p-5 md:p-8 rounded-[30px] border border-neutral-base-100/40">
                    <div className="flex items-center justify-between border-b border-neutral-base-50 pb-4 md:pb-6">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center font-black text-amber-800 text-[14px] md:text-[18px]">4</div>
                            <h2 className="text-[14px] md:text-[16px] font-black uppercase tracking-widest md:tracking-[0.15em] text-neutral-base-900">
                                Metode Pembayaran
                            </h2>
                        </div>
                        {remainingBill === 0 && useWallet && (
                            <span className="text-[10px] md:text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 md:px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                                Lunas via Wallet
                            </span>
                        )}
                    </div>

                    {remainingBill === 0 && useWallet ? (
                        <div className="bg-emerald-50/30 border border-emerald-100 p-6 md:p-8 rounded-xl md:rounded-[32px] flex flex-col items-center text-center gap-3 md:gap-4">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="text-[14px] md:text-[16px] font-black text-neutral-base-900">Pembayaran Tercover Wallet</h4>
                                <p className="text-[11px] md:text-[12px] font-bold text-neutral-base-500 mt-1 uppercase tracking-widest leading-loose">Automatis Lunas via Saldo Anda.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 md:gap-6">
                            {isLoadingPayments ? (
                                <div className="flex flex-col items-center justify-center py-8 md:py-10 gap-3 md:gap-4">
                                    <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-amber-800 animate-spin" />
                                    <p className="text-[12px] md:text-[13px] font-bold text-neutral-base-400 uppercase tracking-widest">Memuat Metode Pembayaran...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
                                    {paymentMethods.map((method) => {
                                        const isBcaMandiri = method.namaBank?.toUpperCase().includes("BCA") || method.namaBank?.toUpperCase().includes("MANDIRI");
                                        const isUnderLimit = remainingBill < 10000;
                                        const isDisabled = isBcaMandiri && isUnderLimit;

                                        return (
                                            <button
                                                key={method.id}
                                                disabled={isDisabled}
                                                onClick={() => {
                                                    setPaymentMethod(method.namaBank);
                                                    onFieldChange?.();
                                                }}
                                                className={`bg-white/70 backdrop-blur-xs border p-3.5 md:p-6 rounded-[24px] md:rounded-[28px] flex items-center justify-between hover:shadow-xl hover:shadow-neutral-base-900/5 transition-all group relative overflow-hidden ${paymentMethod === method.namaBank ? "border-amber-800 bg-amber-50/30" : "border-neutral-base-100/50"} ${isDisabled ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
                                            >
                                                <div className="flex items-center gap-3 md:gap-4">
                                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-all font-black text-[10px] ${paymentMethod === method.namaBank ? "bg-white text-amber-800" : "bg-neutral-base-50 text-neutral-base-400 group-hover:bg-amber-50 group-hover:text-amber-800"}`}>
                                                        {method.logoBank ? (
                                                            <img src={`https://syllahijab.com/frontend/web/img/rekening_pembayaran/${method.logoBank}`} alt={method.namaBank} className="w-6 h-6 md:w-8 md:h-8 object-contain" />
                                                        ) : (
                                                            <Landmark className="w-3.5 h-3.5 md:w-5 md:h-5 opacity-50" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-start text-left">
                                                        <h4 className="text-[12px] md:text-[13px] font-black text-neutral-base-900 leading-tight">
                                                            {method.namaBank}
                                                        </h4>
                                                        {isDisabled ? (
                                                            <p className="text-[9px] md:text-[11px] font-black text-red-500 uppercase tracking-widest mt-0.5 md:mt-1">Min. Transfer Rp 10.000</p>
                                                        ) : (
                                                            <p className="text-[9px] md:text-[11px] font-black text-neutral-base-400 uppercase tracking-widest mt-0.5 md:mt-1 truncate max-w-[120px] md:max-w-none">{method.namaPemilik}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 transition-all flex items-center justify-center shrink-0 ${paymentMethod === method.namaBank ? "border-amber-800" : "border-neutral-base-200"}`}>
                                                    {paymentMethod === method.namaBank && <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-amber-800" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
