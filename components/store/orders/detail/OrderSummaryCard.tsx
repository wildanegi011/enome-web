"use client";

import { Tag, Receipt, Clock, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency, handleWhatsAppConfirm, cn } from "@/lib/utils";
import PaymentVerificationStatus from "@/components/store/shared/PaymentVerificationStatus";
import { useCallback } from "react";
import { usePaymentVerification } from "@/hooks/use-payment-verification";
import CONFIG from "@/lib/config";

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
    statusOrder?: string;
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
    statusOrder,
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
        onSuccess,
        { initialStatusOrder: statusOrder }
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



    return (
        <div className="bg-white border border-neutral-base-100 rounded-[32px] md:rounded-[40px] p-5 md:p-10 shadow-xl shadow-neutral-base-900/5 xl:sticky xl:top-24">
            <div className="flex items-center gap-4 md:gap-5 mb-10">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-[14px] md:rounded-[18px] bg-neutral-base-900 flex items-center justify-center shadow-lg shadow-neutral-base-900/10 shrink-0">
                    <Receipt className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-[16px] md:text-[18px] font-bold text-neutral-base-900 tracking-tight font-montserrat truncate mb-0.5">
                        Ringkasan
                    </h2>
                </div>
            </div>

            <div className="space-y-4 md:space-y-5 pb-6 md:pb-8 border-b border-neutral-base-50">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] md:text-[11px] font-black text-neutral-base-400 uppercase tracking-[0.12em] font-montserrat">Subtotal</span>
                    <span className="text-[13px] md:text-[14px] font-bold text-neutral-base-900 font-montserrat">
                        {formatCurrency(totalHarga)}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] md:text-[11px] font-black text-neutral-base-400 uppercase tracking-[0.12em] font-montserrat">Biaya pengiriman</span>
                    <span className="text-[13px] md:text-[14px] font-bold text-neutral-base-900 font-montserrat">{formatCurrency(ongkir)}</span>
                </div>
                {biayalain > 0 && (
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] md:text-[11px] font-black text-neutral-base-400 uppercase tracking-[0.12em] font-montserrat">Biaya Kemasan</span>
                        <span className="text-[13px] md:text-[14px] font-bold text-neutral-base-900 font-montserrat">
                            {formatCurrency(biayalain)}
                        </span>
                    </div>
                )}

                {voucherInfo && voucherInfo.nominal > 0 && (
                    <div className="flex items-center justify-between">
                        <span className="text-emerald-600 flex items-center gap-2 line-clamp-1 text-[10px] md:text-[11px] font-black uppercase tracking-[0.12em] font-montserrat">
                            <Tag className="w-3.5 h-3.5 shrink-0" />
                            Voucher ({voucherInfo.kode})
                        </span>
                        <span className="text-[13px] md:text-[14px] font-bold text-emerald-600 font-montserrat">
                            -{formatCurrency(voucherInfo.nominal)}
                        </span>
                    </div>
                )}

                {viaWallet > 0 && (
                    <div className="flex items-center justify-between">
                        <span className="text-emerald-600 text-[10px] md:text-[11px] font-black uppercase tracking-[0.12em] font-montserrat">Wallet Deduction</span>
                        <span className="text-emerald-600 text-[13px] md:text-[14px] font-bold font-montserrat">
                            -{formatCurrency(viaWallet)}
                        </span>
                    </div>
                )}

                {/* {uniqueCodeValue > 0 && (
                    <div className="flex items-center justify-between text-[13px]">
                        <span className="text-amber-600 font-medium">Kode Unik</span>
                        <span className="text-amber-600 font-medium">
                            +{formatCurrency(uniqueCodeValue)}
                        </span>
                    </div>
                )} */}
            </div>

            <div className="py-6 md:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span className="text-[11px] md:text-[12px] font-black text-neutral-base-400 uppercase tracking-[0.15em] font-montserrat">
                    Total tagihan
                </span>
                <span className="text-[18px] md:text-[22px] font-bold text-neutral-base-900 tracking-tight font-montserrat">
                    {formatCurrency(totalTagihan)}
                </span>
            </div>

            <div className="space-y-4 pt-6">
                {!isSuccess && sOrder === "OPEN" && (
                    <>
                        {/* Verification Info & Status Banner */}
                        <PaymentVerificationStatus
                            variant="compact"
                            timeLeft={timeLeft}
                            isVerifying={isVerifying}
                            isTimeout={isTimeout}
                            isSuccess={isSuccess}
                            statusOrder={currentStatusOrder}
                            statusTagihan={currentStatusTagihan || statusTagihan}
                            onStartVerification={handleStartVerification}
                            showAction={true}
                            onClickWA={() => handleWhatsAppConfirm(orderId, totalTagihan, metodebayar, whatsappAdmin || "")}
                        />
                    </>
                )}
            </div>
        </div >
    );
}
