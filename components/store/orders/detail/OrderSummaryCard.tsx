"use client";

import React from "react";
import { Tag, CreditCard, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

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
    whatsappAdmin = "628997179308",
}: OrderSummaryCardProps) {

    const handleWhatsAppConfirm = () => {
        const message = `Halo Admin Enome,\n\nSaya ingin konfirmasi pembayaran untuk pesanan:\n\nOrder ID: ${orderId}\nTotal Tagihan: ${formatCurrency(totalTagihan)}\nMetode Pembayaran: ${metodebayar}\n\nBerikut bukti pembayarannya:`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappAdmin}?text=${encodedMessage}`;
        window.open(whatsappUrl, "_blank");
    };

    return (
        <div className="bg-white border border-neutral-base-100 rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-xl shadow-neutral-base-900/5 xl:sticky xl:top-24">
            <div className="flex items-center gap-4 mb-8 md:mb-10">
                <div className="w-10 h-10 rounded-xl bg-neutral-base-900 flex items-center justify-center shadow-lg shadow-neutral-base-900/10">
                    <Receipt className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-[16px] md:text-[18px] font-bold text-neutral-base-900">
                    Ringkasan Pembayaran
                </h2>
            </div>

            <div className="space-y-4 md:space-y-5 pb-6 md:pb-8 border-b border-neutral-base-50">
                <div className="flex items-center justify-between text-[13px] md:text-[14px]">
                    <span className="text-neutral-base-400 font-medium">Subtotal</span>
                    <span className="text-neutral-base-900 font-medium">
                        {formatCurrency(totalHarga)}
                    </span>
                </div>
                <div className="flex items-center justify-between text-[13px] md:text-[14px]">
                    <span className="text-neutral-base-400 font-medium">Biaya Pengiriman</span>
                    <span className="text-neutral-base-900 font-medium">{formatCurrency(ongkir)}</span>
                </div>
                {biayalain > 0 && (
                    <div className="flex items-center justify-between text-[13px] md:text-[14px]">
                        <span className="text-neutral-base-400 font-medium">Biaya Kemasan</span>
                        <span className="text-neutral-base-900 font-medium">
                            {formatCurrency(biayalain)}
                        </span>
                    </div>
                )}

                {voucherInfo && voucherInfo.nominal > 0 && (
                    <div className="flex items-center justify-between text-[13px] md:text-[14px]">
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
                    <div className="flex items-center justify-between text-[13px] md:text-[14px]">
                        <span className="text-emerald-600 font-medium">Wallet Deduction</span>
                        <span className="text-emerald-600 font-medium">
                            -{formatCurrency(viaWallet)}
                        </span>
                    </div>
                )}

                {uniqueCodeValue > 0 && (
                    <div className="flex items-center justify-between text-[13px] md:text-[14px]">
                        <span className="text-amber-600 font-medium">Kode Unik</span>
                        <span className="text-amber-600 font-medium">
                            +{formatCurrency(uniqueCodeValue)}
                        </span>
                    </div>
                )}
            </div>

            <div className="py-6 md:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-neutral-base-400">
                    Total Tagihan
                </span>
                <span className="text-[20px] md:text-[24px] font-medium text-neutral-base-900 tracking-tight">
                    {formatCurrency(totalTagihan)}
                </span>
            </div>

            <div className="space-y-4 pt-4">
                <div className="p-4 bg-neutral-base-50 rounded-2xl flex items-center justify-between border border-neutral-base-100 gap-4">
                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-neutral-base-400 shrink-0">
                        Metode Bayar
                    </span>
                    <span className="text-[11px] md:text-[12px] font-bold text-neutral-base-900 uppercase bg-white px-3 py-1 rounded-lg border border-neutral-base-100 truncate">
                        {metodebayar}
                    </span>
                </div>

                {statusTagihan === "BELUM BAYAR" && (
                    <Button
                        onClick={handleWhatsAppConfirm}
                        className="w-full h-12 md:h-14 bg-neutral-base-900 text-white rounded-2xl text-[11px] md:text-[12px] font-black uppercase tracking-widest hover:bg-neutral-base-800 transition-all shadow-xl shadow-neutral-base-900/10 active:scale-95 gap-3"
                    >
                        Konfirmasi Pembayaran
                        <CreditCard className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
