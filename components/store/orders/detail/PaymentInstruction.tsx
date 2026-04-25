"use client";

import React, { useState } from "react";
import { AlertCircle, Copy, Check, CreditCard } from "lucide-react";
import { formatCurrency, toTitleCase } from "@/lib/utils";
import FormattedDate from "@/components/store/shared/FormattedDate";

interface PaymentInstructionProps {
    statusTagihan: string;
    totalTagihan: number;
    paymentInfo?: {
        namaBank: string;
        noRekening: string;
        namaPemilik: string;
        isMaintenance?: boolean;
    };
    uniqueCodeValue?: number;
    expiredTime?: string | number | null;
    isMaintenance?: boolean;
}

export default function PaymentInstruction({
    statusTagihan,
    totalTagihan,
    paymentInfo,
    uniqueCodeValue = 0,
    expiredTime,
    isMaintenance,
}: PaymentInstructionProps) {
    const [copiedRekening, setCopiedRekening] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedRekening(true);
        setTimeout(() => setCopiedRekening(false), 2000);
    };

    if (statusTagihan !== "BELUM BAYAR" || !paymentInfo) return null;

    return (
        <div className="mt-8 mb-5 p-6 bg-amber-50 rounded-3xl border border-amber-200/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200 shadow-sm shrink-0">
                        <CreditCard className="w-5 h-5 text-amber-900" />
                    </div>
                    <p className="text-[16px] md:text-[18px] font-bold text-amber-900 tracking-tight font-montserrat">Instruksi Pembayaran</p>
                </div>
                {expiredTime && (
                    <div className="flex flex-col items-start sm:items-end pl-[56px] sm:pl-0">
                        <p className="text-[10px] md:text-[11px] font-black text-amber-800/60 uppercase tracking-[0.12em] font-montserrat mb-1.5">Batas Waktu Pembayaran</p>
                        <p className="text-[13px] md:text-[14px] font-bold text-amber-900 font-montserrat tracking-tight">
                            <FormattedDate date={expiredTime} />
                        </p>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div>
                    <p className="text-[10px] md:text-[11px] font-black text-amber-800/60 uppercase tracking-[0.12em] font-montserrat mb-3">
                        Transfer Ke Rekening {toTitleCase(paymentInfo.namaBank || "")}
                    </p>
                    <div className="flex items-center gap-3">
                        <h4 className="text-[18px] md:text-[20px] font-black text-neutral-base-900 tracking-widest font-mono">
                            {paymentInfo.noRekening}
                        </h4>
                        <button
                            onClick={() => handleCopy(paymentInfo.noRekening)}
                            className="p-1.5 md:p-2 rounded-xl border border-amber-200 bg-white hover:bg-amber-100/50 transition-colors shadow-sm active:scale-95"
                        >
                            {copiedRekening ? (
                                <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" />
                            ) : (
                                <Copy className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-700" />
                            )}
                        </button>
                    </div>
                    <p className="text-[13px] md:text-[14px] font-bold text-neutral-base-500 mt-2 font-montserrat tracking-tight">
                        a.n {toTitleCase(paymentInfo.namaPemilik || "")}
                    </p>
                </div>



                {uniqueCodeValue > 0 && (
                    <div className="pt-6 border-t border-amber-200/50">
                        <p className="text-[10px] md:text-[11px] font-black text-amber-800/60 uppercase tracking-[0.12em] font-montserrat mb-3.5">
                            PENTING: Transfer Tepat Hingga 3 Digit Terakhir
                        </p>
                        <p className="text-[13px] md:text-[14px] font-medium text-rose-800/80 leading-relaxed font-montserrat">
                            Pastikan Anda mentransfer tepat sejumlah tagihan yakni{" "}
                            <b className="text-neutral-base-900 text-[14px] md:text-[16px] font-bold tracking-tight">
                                {formatCurrency(totalTagihan)}
                            </b>
                            . Perhatikan kode unik (
                            <b className="text-rose-600 font-bold bg-white px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg border border-rose-200 ml-1 text-[14px] md:text-[16px] shadow-sm tracking-tight">
                                {uniqueCodeValue}
                            </b>
                            ) agar sistem dapat memverifikasi pembayaran Anda secara otomatis.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
