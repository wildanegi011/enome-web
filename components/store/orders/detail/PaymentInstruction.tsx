"use client";

import React, { useState } from "react";
import { AlertCircle, Copy, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentInstructionProps {
    statusTagihan: string;
    totalTagihan: number;
    paymentInfo?: {
        namaBank: string;
        noRekening: string;
        namaPemilik: string;
    };
    uniqueCodeValue?: number;
}

export default function PaymentInstruction({
    statusTagihan,
    totalTagihan,
    paymentInfo,
    uniqueCodeValue = 0,
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
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-amber-100 shadow-sm">
                    <AlertCircle className="w-4 h-4 text-amber-800" />
                </div>
                <p className="text-[13px] font-bold text-amber-900">Instruksi Pembayaran</p>
            </div>

            <div className="space-y-5">
                <div>
                    <p className="text-[11px] font-black text-amber-800/60 uppercase tracking-widest mb-2">
                        Transfer Ke Rekening {paymentInfo.namaBank}
                    </p>
                    <div className="flex items-center gap-3">
                        <h4 className="text-[20px] font-black text-neutral-base-900 tracking-tight">
                            {paymentInfo.noRekening}
                        </h4>
                        <button
                            onClick={() => handleCopy(paymentInfo.noRekening)}
                            className="p-2 rounded-xl border border-amber-200 bg-white hover:bg-amber-100/50 transition-colors shadow-sm"
                        >
                            {copiedRekening ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                                <Copy className="w-4 h-4 text-amber-700" />
                            )}
                        </button>
                    </div>
                    <p className="text-[12px] font-bold text-neutral-base-500 mt-1">
                        a.n {paymentInfo.namaPemilik}
                    </p>
                </div>

                {uniqueCodeValue > 0 && (
                    <div className="pt-5 border-t border-amber-200/50">
                        <p className="text-[11px] font-black text-amber-800/60 uppercase tracking-widest mb-2">
                            PENTING: Transfer Tepat Hingga 3 Digit Terakhir
                        </p>
                        <p className="text-[14px] font-medium text-rose-900/80 leading-relaxed">
                            Pastikan Anda mentransfer tepat sejumlah tagihan yakni{" "}
                            <b className="text-neutral-base-900 text-[16px]">
                                {formatCurrency(totalTagihan)}
                            </b>
                            . Perhatikan kode unik (
                            <b className="text-rose-600 font-black bg-white px-2.5 py-1 rounded-lg border border-rose-200 ml-1 text-[16px] shadow-sm">
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
