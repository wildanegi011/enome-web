"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useOrderDetail } from "@/hooks/use-order-detail";
import SuccessState from "@/components/store/checkout/SuccessState";
import { formatCurrency } from "@/lib/utils";
import Navbar from "@/components/store/layout/Navbar";
import { Loader2, Home, ArrowLeft, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ASSET_URL } from "@/config/config";

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("orderId");

    const { data: detail, isLoading, isError } = useOrderDetail(orderId || "");

    if (!orderId) {
        router.push("/");
        return null;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-base-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-amber-800/40" strokeWidth={1.5} />
                    <div className="space-y-1">
                        <p className="text-[14px] font-bold text-neutral-base-900 uppercase tracking-[0.3em]">Memuat Detail Pesanan</p>
                        <p className="text-[11px] text-neutral-base-400 font-medium tracking-widest uppercase italic">Mohon tunggu sebentar...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !detail) {
        return (
            <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FAF9F6] px-4 text-center dark:bg-[#0C0A09]">
                {/* Background Decorative Batik Patterns */}
                <div className="absolute inset-0 z-0 overflow-hidden opacity-10 dark:opacity-5">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute -top-1/4 -left-1/4 rotate-12 transform scale-150">
                        <defs>
                            <pattern id="batik-pattern-err" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                                <path d="M100 0 L200 100 L100 200 L0 100 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                <circle cx="100" cy="100" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
                                <path d="M50 50 L150 150 M150 50 L50 150" stroke="currentColor" strokeWidth="0.5" />
                                <circle cx="50" cy="50" r="5" fill="currentColor" />
                                <circle cx="150" cy="50" r="5" fill="currentColor" />
                                <circle cx="50" cy="150" r="5" fill="currentColor" />
                                <circle cx="150" cy="150" r="5" fill="currentColor" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#batik-pattern-err)" />
                    </svg>
                </div>

                {/* Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-200/50 blur-[120px] dark:bg-white/5 opacity-50"></div>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 flex flex-col items-center"
                >
                    <div className="relative">
                        <motion.h1
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="font-heading text-[6rem] font-bold leading-none tracking-tighter text-neutral-base-900 dark:text-neutral-base-100 sm:text-[14rem]"
                        >
                            404
                        </motion.h1>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="absolute -bottom-2 left-0 h-1 bg-linear-to-r from-transparent via-neutral-base-900/20 to-transparent dark:via-neutral-base-100/20"
                        />
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 1 }}
                        className="mt-12 flex flex-col items-center gap-6 w-full max-w-lg"
                    >
                        <div className="space-y-3 px-4">
                            <h2 className="font-heading text-xl font-semibold text-neutral-base-800 dark:text-neutral-base-200 sm:text-5xl uppercase tracking-tight">
                                Pesanan Tidak Ditemukan
                            </h2>
                            <p className="mx-auto text-base text-neutral-base-600 dark:text-neutral-base-400 sm:text-lg">
                                Maaf, kami tidak dapat menemukan detail pesanan dengan ID <span className="font-bold text-neutral-base-900">#{orderId}</span>. ID mungkin tidak valid atau sudah kedaluwarsa.
                            </p>
                        </div>

                        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row w-full px-4 sm:px-0 sm:justify-center">
                            <Button
                                asChild
                                variant="default"
                                size="lg"
                                className="group relative h-14 w-full sm:w-auto gap-3 overflow-hidden rounded-full bg-neutral-base-900 px-10 text-lg text-white transition-all hover:scale-105 hover:bg-neutral-base-800 active:scale-95 dark:bg-neutral-base-100 dark:text-neutral-base-950 dark:hover:bg-white"
                            >
                                <Link href="/">
                                    <Home className="size-5 transition-transform group-hover:-translate-y-0.5" />
                                    <span>Beranda</span>
                                </Link>
                            </Button>

                            <Button
                                onClick={() => router.back()}
                                variant="ghost"
                                size="lg"
                                className="group h-14 w-full sm:w-auto gap-3 rounded-full text-neutral-base-600 hover:bg-neutral-base-200/50 dark:text-neutral-base-400 dark:hover:bg-white/5"
                            >
                                <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1" />
                                <span>Kembali</span>
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Floating Decorative Orbs */}
                <motion.div
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-20 right-[10%] size-32 rounded-full bg-neutral-base-300/30 blur-3xl dark:bg-white/5"
                />
                <motion.div
                    animate={{
                        y: [0, 20, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-40 left-[15%] size-40 rounded-full bg-neutral-base-300/20 blur-3xl dark:bg-white/5"
                />

                {/* Footer Signature */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ delay: 1.2, duration: 2 }}
                    className="absolute bottom-12 text-xs font-light tracking-[0.3em] uppercase text-neutral-base-500 dark:text-neutral-base-600"
                >
                    The Art of ÉNOMÉ &copy; 2026
                </motion.div>
            </div>
        );
    }

    // Map OrderDetail to SuccessState props format
    const orderResult = {
        orderId: detail.order.orderId,
        total: detail.order.totalTagihan,
        paymentMethod: detail.order.metodebayar,
        uniqueCode: detail.uniqueCode,
        bankAccount: detail.paymentInfo?.noRekening,
        bankOwner: detail.paymentInfo?.namaPemilik,
        bankName: detail.paymentInfo?.namaBank,
        bankLogo: detail.paymentInfo ? `${ASSET_URL}/img/rekening_pembayaran/${detail.paymentInfo.namaBank.toLowerCase().split(' ')[0]}.png` : undefined,
        subtotal: detail.order.totalHarga,
        shippingPrice: detail.order.ongkir,
        packingFee: detail.order.biayalain,
        voucherDiscount: detail.voucherInfo?.nominal,
        walletDeduction: detail.order.viaWallet,
        customerName: detail.order.namaPenerima,
        customerPhone: detail.order.teleponPenerima,
        fullAddress: detail.order.alamatKirim,
        courierName: detail.order.ekspedisi,
        courierService: detail.order.service,
        expiredTime: detail.expiredTime,
        whatsappAdmin: detail.whatsappAdmin,
        statusOrder: detail.order.statusOrder,
        paymentVerificationTimeout: detail.paymentVerificationTimeout,
    };

    return (
        <div className="min-h-screen bg-neutral-base-50">
            <Navbar />
            <SuccessState
                orderResult={orderResult}
                lastOrderedItems={detail.items}
                formatPrice={formatCurrency}
            />
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-neutral-base-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-800/20" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
