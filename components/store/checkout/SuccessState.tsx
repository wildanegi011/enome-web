import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePaymentVerification } from "@/hooks/use-payment-verification";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronLeft, Copy, ShieldCheck, Clock, Truck, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { ASSET_URL } from "@/config/config";
import { toast } from "sonner";
import { cn, toTitleCase, handleWhatsAppConfirm } from "@/lib/utils";
import { CONFIG } from "@/lib/config";
import FallbackImage from "@/components/store/shared/FallbackImage";
import FormattedDate from "@/components/store/shared/FormattedDate";
import PaymentVerificationStatus from "@/components/store/shared/PaymentVerificationStatus";

interface SuccessStateProps {
    orderResult: {
        orderId: string,
        total: number,
        paymentMethod?: string,
        uniqueCode?: number,
        bankAccount?: string,
        bankOwner?: string,
        bankName?: string,
        subtotal?: number,
        shippingPrice?: number,
        packingFee?: number,
        voucherDiscount?: number,
        walletDeduction?: number,
        customerName?: string,
        customerPhone?: string,
        fullAddress?: string,
        courierName?: string,
        courierService?: string,
        bankLogo?: string,
        expiredTime?: string | number | null,
        roundingAmount?: number,
        whatsappAdmin?: string,
        statusOrder?: string,
        paymentVerificationTimeout?: number,
    };
    lastOrderedItems: any[];
    formatPrice: (price: number) => string;
}

export default function SuccessState({ orderResult, lastOrderedItems, formatPrice }: SuccessStateProps) {
    const router = useRouter();

    console.log("orderResultxxx", orderResult);

    const isTransfer = !!orderResult.bankAccount;
    const [isCopied, setIsCopied] = useState<{ [key: string]: boolean }>({});

    const {
        timeLeft,
        isVerifying,
        isTimeout,
        isSuccess,
        startVerification,
        statusOrder: currentStatusOrder,
        statusTagihan: currentStatusTagihan
    } = usePaymentVerification(
        orderResult.orderId,
        orderResult.bankAccount ? "BELUM BAYAR" : "PAID",
        () => {
            // onSuccess - do nothing, keep user on page per request
        },
        { 
            initialStatusOrder: orderResult.statusOrder,
            timeoutMins: orderResult.paymentVerificationTimeout
        }
    );

    const handleStartVerification = () => {
        startVerification();
    };

    // Granular status logic for real-time feel
    const sTagihan = currentStatusTagihan || (orderResult.bankAccount ? "BELUM BAYAR" : "PAID");
    const sOrder = currentStatusOrder || "OPEN";

    const isPaymentDiterima = sTagihan !== "BELUM BAYAR" && sTagihan !== "UNPAID";
    const isDataMatched = sTagihan === "BAYAR" || sTagihan === "SUDAH BAYAR";
    const isOrderProcessed = sOrder !== "OPEN";

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setIsCopied({ ...isCopied, [id]: true });
        toast.success("Berhasil disalin ke clipboard");
        setTimeout(() => setIsCopied({ ...isCopied, [id]: false }), 2000);
    };

    return (
        <div className="max-w-5xl mx-auto py-6 md:py-16 px-4 md:px-8">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col"
            >
                {/* ===== HEADER ===== */}
                <div className="text-center mb-6 md:mb-12">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 md:mb-5 border-2 border-emerald-100"
                    >
                        <CheckCircle2 className="w-7 h-7 md:w-10 md:h-10" />
                    </motion.div>
                    <h1 className="text-[22px] md:text-[36px] font-bold text-neutral-base-900 tracking-tight leading-snug">
                        {isTransfer && sOrder === "OPEN" ? "Instruksi Pembayaran" : "Pesanan Berhasil!"}
                    </h1>
                    <p className="text-[12px] md:text-[15px] text-neutral-base-400 font-medium mt-1.5 md:mt-2">
                        Order <span className="text-neutral-base-900 font-bold">{orderResult.orderId}</span> — {lastOrderedItems.length} Produk
                    </p>
                </div>

                {/* ===== MAIN CONTENT ===== */}
                <div className="flex flex-col lg:flex-row gap-5 md:gap-8 items-start">

                    {/* LEFT COLUMN — Payment Instructions */}
                    <div className="flex-1 w-full flex flex-col gap-5 md:gap-6 min-w-0">

                        {isTransfer && sOrder === "OPEN" && (
                            <div className="bg-white border border-neutral-base-100 rounded-2xl md:rounded-[32px] overflow-hidden shadow-lg shadow-neutral-base-900/5">
                                {/* Transfer header bar */}
                                <div className="bg-neutral-base-900 px-5 md:px-8 py-4 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
                                    <div className="flex items-center gap-2.5">
                                        <CreditCard className="w-4 h-4 text-white/60" />
                                        <span className="text-[11px] md:text-[12px] font-bold uppercase tracking-widest text-white">Transfer Bank</span>
                                    </div>
                                    {orderResult.expiredTime && (
                                        <div className="flex flex-col items-start sm:items-end md:items-end">
                                            <p className="text-[9px] md:text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1.5 md:mb-1">Batas Waktu Pembayaran</p>
                                            <p className="text-[11px] md:text-[12px] font-bold text-white leading-none">
                                                <FormattedDate date={orderResult.expiredTime} />
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 md:p-8 flex flex-col gap-5 md:gap-7">
                                    {/* Amount to pay */}
                                    <div>
                                        <p className="text-[10px] md:text-[11px] font-bold text-neutral-base-400 uppercase tracking-widest mb-2 md:mb-3">Jumlah Transfer</p>
                                        <div className="flex items-end md:items-center justify-between gap-3 flex-wrap">
                                            <div
                                                className="flex items-baseline font-bold tracking-tighter cursor-pointer select-none"
                                                onClick={() => copyToClipboard(orderResult.total.toString(), "amt")}
                                            >
                                                <span className="text-[24px] md:text-[48px] text-neutral-base-900 leading-none">
                                                    {formatPrice(orderResult.total).slice(0, -3)}
                                                </span>
                                                <span className="text-[24px] md:text-[48px] text-amber-600 leading-none relative">
                                                    {formatPrice(orderResult.total).slice(-3)}
                                                    <span className="absolute -bottom-0.5 left-0 w-full h-[2px] md:h-[3px] bg-amber-300 rounded-full opacity-60" />
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(orderResult.total.toString(), "amt")}
                                                className={`flex items-center gap-2 px-4 md:px-5 h-10 md:h-11 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shrink-0 ${isCopied["amt"] ? "bg-emerald-500 text-white" : "bg-neutral-base-900 text-white hover:bg-neutral-base-800"}`}
                                            >
                                                {isCopied["amt"] ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                Salin
                                            </button>
                                        </div>
                                        <p className="mt-2.5 md:mt-3 text-[11px] md:text-[12px] font-medium text-neutral-base-400 leading-relaxed">
                                            ⚠️ Transfer <span className="text-neutral-base-900 font-bold">nominal tepat hingga 3 digit terakhir</span> agar terdeteksi otomatis.
                                        </p>
                                    </div>

                                    <div className="h-px bg-neutral-base-100" />

                                    {/* Bank Account */}
                                    <div>
                                        <p className="text-[10px] md:text-[11px] font-bold text-neutral-base-400 uppercase tracking-widest mb-3">Rekening Tujuan</p>
                                        <div className="bg-neutral-base-50 rounded-xl md:rounded-2xl p-4 md:p-5 flex items-center justify-between gap-3 flex-wrap md:flex-nowrap">
                                            <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                                {orderResult.bankLogo && (
                                                    <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl bg-white flex items-center justify-center p-2 md:p-2.5 shrink-0 border border-neutral-base-100 shadow-sm relative overflow-hidden">
                                                        <Image
                                                            src={orderResult.bankLogo}
                                                            alt={orderResult.bankName || "Bank"}
                                                            fill
                                                            className="object-contain p-1.5"
                                                            sizes="48px"
                                                        />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-[15px] md:text-[20px] font-bold text-neutral-base-900 tracking-tight leading-none mb-1 md:mb-1.5">{orderResult.bankAccount}</p>
                                                    <p className="text-[9px] md:text-[11px] font-bold text-neutral-base-400 uppercase tracking-widest leading-none truncate">a/n {orderResult.bankOwner}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(orderResult.bankAccount || "", "acc")}
                                                className={`shrink-0 flex items-center gap-1.5 px-3.5 md:px-4 h-10 md:h-11 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 border ${isCopied["acc"] ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-white border-neutral-base-200 text-neutral-base-600 hover:bg-neutral-base-50 hover:border-neutral-base-300"}`}
                                            >
                                                {isCopied["acc"] ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                Salin
                                            </button>
                                        </div>
                                    </div>

                                    {/* Auto verification info & status */}
                                    {/* Auto verification info & status */}
                                    {!isSuccess && sOrder === "OPEN" && (
                                        <PaymentVerificationStatus
                                            variant="full"
                                            timeLeft={timeLeft}
                                            isVerifying={isVerifying}
                                            isTimeout={isTimeout}
                                            isSuccess={isSuccess}
                                            statusOrder={currentStatusOrder}
                                            statusTagihan={currentStatusTagihan || (orderResult.bankAccount ? "BELUM BAYAR" : "PAID")}
                                            onStartVerification={handleStartVerification}
                                            showAction={!isSuccess}
                                            onClickWA={() => handleWhatsAppConfirm(
                                                orderResult.orderId,
                                                orderResult.total,
                                                orderResult.paymentMethod || "Transfer",
                                                orderResult.whatsappAdmin || ""
                                            )}
                                            timeoutMins={orderResult.paymentVerificationTimeout}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {(!isTransfer || (isTransfer && sOrder !== "OPEN")) && (
                            <div className="bg-white border border-neutral-base-100 rounded-2xl md:rounded-[32px] p-8 md:p-12 shadow-lg shadow-neutral-base-900/5 text-center">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-5 md:mb-6">
                                    <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" />
                                </div>
                                <h3 className="text-[18px] md:text-[22px] font-bold text-neutral-base-900 mb-2">Terima kasih atas pesanan Anda!</h3>
                                <p className="text-[13px] md:text-[15px] text-neutral-base-400 font-medium leading-relaxed">Pesanan sedang kami siapkan untuk dikirim.</p>
                            </div>
                        )}

                        {/* Back to Order List */}
                        <div className="mt-2">
                            <Link
                                href={`/account/orders/${encodeURIComponent(orderResult.orderId)}`}
                                className="flex items-center justify-center gap-2 w-full h-11 md:h-12 rounded-xl border border-neutral-base-200 text-[11px] md:text-[12px] font-bold uppercase tracking-widest text-neutral-base-500 bg-neutral-base-50/50 hover:bg-neutral-base-50 transition-all active:scale-[0.99]"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Lihat Detail Pesanan
                            </Link>
                        </div>
                    </div>

                    {/* RIGHT COLUMN — Order Summary */}
                    <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0">
                        <div className="bg-white border border-neutral-base-100 rounded-2xl md:rounded-[32px] p-5 md:p-7 shadow-lg shadow-neutral-base-900/5">
                            <h4 className="text-[11px] md:text-[12px] font-bold uppercase tracking-widest text-neutral-base-900 mb-4 md:mb-5 flex items-center gap-2.5">
                                <div className="w-1 h-3.5 bg-amber-500 rounded-full" />
                                Pesanan Anda
                            </h4>

                            {/* Product Items */}
                            <div className="space-y-3.5 md:space-y-4 max-h-[300px] md:max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                                {lastOrderedItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-3 md:gap-4">
                                        <div className="w-12 h-[58px] md:w-14 md:h-[66px] bg-neutral-base-50 rounded-xl overflow-hidden shrink-0 relative border border-neutral-base-100">
                                            <FallbackImage
                                                src={item.gambar ? `${ASSET_URL}/img/${item.gambar}` : "/placeholder-product.jpg"}
                                                alt={item.namaProduk}
                                                fill
                                                className="object-cover"
                                                sizes="56px"
                                            />

                                        </div>
                                        <div className="flex-1 py-0.5 flex flex-col justify-between min-w-0">
                                            <p className="text-[12px] md:text-[13px] font-semibold text-neutral-base-900 line-clamp-2 leading-snug">{item.namaProduk}</p>
                                            <div className="flex items-center justify-between gap-2 mt-1">
                                                <span className="text-[10px] md:text-[11px] font-bold text-neutral-base-400">Qty {item.qty} · {item.size}{item.variant ? ` · ${item.variant}` : ""}</span>
                                                <span className="text-[12px] md:text-[13px] font-bold text-neutral-base-900 tabular-nums shrink-0">{formatPrice(Number(item.harga) * Number(item.qty))}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Breakdown */}
                            <div className="mt-4 md:mt-5 pt-4 md:pt-5 border-t border-neutral-base-100 flex flex-col gap-4">
                                {/* Recipient Info */}
                                <div className="space-y-2">
                                    <p className="text-[10px] md:text-[11px] font-bold text-neutral-base-400 uppercase tracking-widest">Penerima</p>
                                    <div className="text-[12px] md:text-[13px] text-neutral-base-900 font-bold leading-tight">
                                        {toTitleCase(orderResult.customerName || "")}
                                        <p className="text-[11px] md:text-[12px] text-neutral-base-500 font-medium mt-0.5">{orderResult.customerPhone}</p>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="space-y-2">
                                    <p className="text-[10px] md:text-[11px] font-bold text-neutral-base-400 uppercase tracking-widest">Alamat Pengiriman</p>
                                    <p className="text-[11px] md:text-[12px] text-neutral-base-600 font-medium leading-relaxed italic">
                                        {toTitleCase(orderResult.fullAddress || "")}
                                    </p>
                                </div>

                                {/* Courier Info */}
                                <div className="space-y-2">
                                    <p className="text-[10px] md:text-[11px] font-bold text-neutral-base-400 uppercase tracking-widest">Ekspedisi</p>
                                    <div className="flex items-center gap-2">
                                        <Truck className="w-3.5 h-3.5 text-neutral-base-400" />
                                        <span className="text-[11px] md:text-[12px] text-neutral-base-900 font-bold uppercase">{toTitleCase(orderResult.courierName || "")}</span>
                                        <span className="text-[10px] md:text-[11px] text-neutral-base-400 font-medium">— {toTitleCase(orderResult.courierService || "")}</span>
                                    </div>
                                </div>

                                <div className="h-px bg-neutral-base-100/50" />

                                <div className="flex justify-between text-[11px] md:text-[12px] text-neutral-base-500">
                                    <span>Subtotal</span>
                                    <span className="text-neutral-base-900 font-medium tabular-nums">{formatPrice(orderResult.subtotal || 0)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] md:text-[12px] text-neutral-base-500">
                                    <span>Pengiriman</span>
                                    <span className="text-neutral-base-900 font-medium tabular-nums">
                                        {(orderResult.shippingPrice || 0) > 0 ? formatPrice(orderResult.shippingPrice || 0) : formatPrice(0)}
                                    </span>
                                </div>
                                {(orderResult.packingFee || 0) > 0 && (
                                    <div className="flex justify-between text-[11px] md:text-[12px] text-neutral-base-500">
                                        <span>Packing</span>
                                        <span className="text-neutral-base-900 font-medium tabular-nums">{formatPrice(orderResult.packingFee || 0)}</span>
                                    </div>
                                )}
                                {(orderResult.voucherDiscount || 0) > 0 && (
                                    <div className="flex justify-between text-[11px] md:text-[12px] text-emerald-600">
                                        <span>Diskon Voucher</span>
                                        <span className="font-medium tabular-nums">-{formatPrice(orderResult.voucherDiscount || 0)}</span>
                                    </div>
                                )}
                                {(orderResult.walletDeduction || 0) > 0 && (
                                    <div className="flex justify-between text-[11px] md:text-[12px] text-amber-600">
                                        <span>Saldo Wallet</span>
                                        <span className="font-medium tabular-nums">-{formatPrice(orderResult.walletDeduction || 0)}</span>
                                    </div>
                                )}
                                {/* {orderResult.uniqueCode && orderResult.uniqueCode > 0 && (
                                    <div className="flex justify-between text-[11px] md:text-[12px] text-amber-600">
                                        <span>Kode Unik</span>
                                        <span className="font-medium tabular-nums">+{formatPrice(orderResult.uniqueCode)}</span>
                                    </div>
                                )} */}

                                {/* Total */}
                                <div className="mt-2 pt-3.5 md:pt-4 border-t border-dashed border-neutral-base-200 flex justify-between items-center">
                                    <span className="text-[13px] md:text-[14px] font-bold text-neutral-base-900">Total</span>
                                    <div className="flex items-baseline font-bold tracking-tighter">
                                        <span className="text-[18px] md:text-[22px] text-neutral-base-900 leading-none">
                                            {formatPrice(orderResult.total).slice(0, -3)}
                                        </span>
                                        <span className="text-[18px] md:text-[22px] text-amber-600 leading-none relative">
                                            {formatPrice(orderResult.total).slice(-3)}
                                            <span className="absolute -bottom-0.5 left-0 w-full h-[1.5px] md:h-[2px] bg-amber-300 rounded-full opacity-60" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}

// Custom CreditCard icon
const CreditCard = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
);
