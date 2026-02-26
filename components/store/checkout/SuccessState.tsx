import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronRight, ShoppingBag, Copy, Info, Clock, ExternalLink, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ASSET_URL } from "@/config/config";
import { toast } from "sonner";

interface SuccessStateProps {
    orderResult: {
        orderId: string,
        total: number,
        paymentMethod?: string,
        uniqueCode?: number,
        bankAccount?: string,
        bankOwner?: string,
        bankName?: string,
        // Added breakdown fields
        subtotal?: number,
        shippingPrice?: number,
        packingFee?: number,
        voucherDiscount?: number,
        walletDeduction?: number
    };
    lastOrderedItems: any[];
    formatPrice: (price: number) => string;
}

export default function SuccessState({ orderResult, lastOrderedItems, formatPrice }: SuccessStateProps) {
    const isTransfer = orderResult.paymentMethod === "BCA";
    const [timeLeft, setTimeLeft] = useState(600);
    const [isCopied, setIsCopied] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        if (!isTransfer) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [isTransfer]);

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
        <div className="max-w-4xl mx-auto py-12 md:py-20 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
            >
                {/* Status Indicator */}
                <div className="mb-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100/50">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h1 className="text-[32px] md:text-[40px] font-bold text-neutral-base-900 tracking-tight leading-loose">
                        {isTransfer ? "Instruksi Pembayaran" : "Pesanan Selesai!"}
                    </h1>
                    <p className="text-neutral-base-400 font-medium">
                        Order <span className="text-neutral-base-900 font-bold">#{orderResult.orderId}</span> • {lastOrderedItems.length} Produk
                    </p>
                </div>

                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                    {/* Main Instructions */}
                    <div className="lg:col-span-7 space-y-6">

                        {isTransfer && (
                            <div className="bg-white border border-neutral-base-100 rounded-[40px] p-8 md:p-10 shadow-xl shadow-neutral-base-900/5 transition-all hover:shadow-2xl hover:shadow-neutral-base-900/10">

                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                            <CreditCard className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <span className="text-[12px] font-black uppercase tracking-widest text-neutral-base-900">Transfer Bank</span>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* Amount Highlight */}
                                    <div className="text-center md:text-left">
                                        <p className="text-[11px] font-black text-neutral-base-300 uppercase tracking-[0.2em] mb-3">Jumlah yang harus dibayar</p>
                                        <div className="flex flex-col md:flex-row items-baseline md:items-center justify-between gap-4">
                                            <div className="flex items-baseline font-black tracking-tighter cursor-default group" onClick={() => copyToClipboard(orderResult.total.toString(), "amt")}>
                                                <span className="text-[24px] md:text-[42px] text-neutral-base-900/40 mr-1">Rp</span>
                                                <span className="text-[38px] md:text-[56px] text-neutral-base-900">
                                                    {orderResult.total.toLocaleString('id-ID').slice(0, -3)}
                                                </span>
                                                <span className="text-[38px] md:text-[56px] text-amber-600 relative">
                                                    {orderResult.total.toLocaleString('id-ID').slice(-3)}
                                                    <span className="absolute -bottom-1 left-0 w-full h-1 bg-amber-200 rounded-full opacity-50"></span>
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(orderResult.total.toString(), "amt")}
                                                className={`flex items-center gap-2 px-6 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${isCopied["amt"] ? "bg-emerald-500 text-white" : "bg-neutral-base-900 text-white hover:bg-neutral-base-800 shadow-lg shadow-neutral-base-900/10"}`}
                                            >
                                                {isCopied["amt"] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                Salin Nominal
                                            </button>
                                        </div>
                                        <p className="mt-4 text-[13px] font-bold text-neutral-base-400 italic">
                                            ⚠️ <span className="text-neutral-base-900">Mohon transfer nominal tepat</span> agar sistem otomatis mendeteksi pesanan Anda.
                                        </p>
                                        <div className="mt-4 p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <p className="text-[12px] font-medium text-emerald-800">
                                                Pembayaran akan <span className="font-bold">diverifikasi secara otomatis</span> dalam <span className="font-bold">{formatTime(timeLeft)}</span> menit setelah transfer diterima.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="h-px bg-neutral-base-50" />

                                    {/* Bank Account */}
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-2xl bg-neutral-base-50 flex items-center justify-center p-3">
                                                <Image src="https://syllahijab.com/frontend/web/img/rekening_pembayaran/bca.png" alt="BCA" width={48} height={16} className="object-contain" />
                                            </div>
                                            <div>
                                                <p className="text-[18px] font-black text-neutral-base-900 tracking-tight leading-none mb-2">{orderResult.bankAccount}</p>
                                                <p className="text-[11px] font-black text-neutral-base-400 uppercase tracking-widest leading-none">a/n {orderResult.bankOwner}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(orderResult.bankAccount || "", "acc")}
                                            className={`p-4 rounded-2xl transition-all border ${isCopied["acc"] ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-white border-neutral-base-100 text-neutral-base-400 hover:bg-neutral-base-50"}`}
                                        >
                                            {isCopied["acc"] ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isTransfer && (
                            <div className="bg-white border border-neutral-base-100 rounded-[40px] p-10 shadow-xl shadow-neutral-base-900/5 text-center">
                                <div className="w-20 h-20 rounded-[32px] bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                                    <ShieldCheck className="w-10 h-10 text-emerald-600" />
                                </div>
                                <h3 className="text-[20px] font-bold text-neutral-base-900 mb-2">Terima kasih atas pesanan Anda!</h3>
                                <p className="text-neutral-base-400 font-medium">Pesanan Anda sedang kami siapkan untuk dikirim segera.</p>
                            </div>
                        )}

                        {/* Secondary Actions */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/products" className="flex-1 h-16 rounded-[24px] border border-neutral-base-100 flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-widest text-neutral-base-900 bg-white hover:bg-neutral-base-50 transition-all">
                                <ShoppingBag className="w-4 h-4" />
                                Kembali Belanja
                            </Link>
                            <Link href={`/account/orders/${orderResult.orderId}`} className="flex-[1.5] h-16 rounded-[24px] bg-neutral-base-900 flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-widest text-white hover:bg-neutral-base-800 transition-all shadow-xl shadow-neutral-base-900/10">
                                Detail Order
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Order Sidebar */}
                    <div className="lg:col-span-5 w-full flex flex-col gap-6">

                        {/* Summary List */}
                        <div className="bg-white border border-neutral-base-100 rounded-[40px] p-8 shadow-lg shadow-neutral-base-900/5">
                            <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-neutral-base-900 mb-6 flex items-center gap-2">
                                <div className="w-1 h-3 bg-amber-500 rounded-full" />
                                Pesanan Anda
                            </h4>
                            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                {lastOrderedItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="w-14 h-16 bg-neutral-base-50 rounded-xl overflow-hidden shrink-0 relative border border-neutral-base-100">
                                            <Image
                                                src={item.gambar ? `${ASSET_URL}/img/produk/${item.gambar}` : "/placeholder-product.jpg"}
                                                alt={item.namaProduk}
                                                fill
                                                className="object-cover"
                                                sizes="56px"
                                            />
                                        </div>
                                        <div className="flex-1 py-1 flex flex-col justify-between">
                                            <p className="text-[12px] font-bold text-neutral-base-900 line-clamp-1">{item.namaProduk}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-neutral-base-300 uppercase">Qty {item.qty} • {item.size}</span>
                                                <span className="text-[12px] font-bold text-neutral-base-900">{formatPrice(Number(item.harga) * Number(item.qty))}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Detailed Order Breakdown */}
                            <div className="mt-6 pt-6 border-t border-neutral-base-100 flex flex-col gap-3">
                                <div className="flex justify-between items-center text-[12px] font-medium text-neutral-base-500">
                                    <span>Subtotal Produk</span>
                                    <span className="text-neutral-base-900">{formatPrice(orderResult.subtotal || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[12px] font-medium text-neutral-base-500">
                                    <span>Biaya Pengiriman</span>
                                    <span className="text-neutral-base-900">{formatPrice(orderResult.shippingPrice || 0)}</span>
                                </div>
                                {(orderResult.packingFee || 0) > 0 && (
                                    <div className="flex justify-between items-center text-[12px] font-medium text-neutral-base-500">
                                        <span>Biaya Packing</span>
                                        <span className="text-neutral-base-900">{formatPrice(orderResult.packingFee || 0)}</span>
                                    </div>
                                )}
                                {(orderResult.voucherDiscount || 0) > 0 && (
                                    <div className="flex justify-between items-center text-[12px] font-medium text-emerald-600">
                                        <span>Diskon Voucher</span>
                                        <span>-{formatPrice(orderResult.voucherDiscount || 0)}</span>
                                    </div>
                                )}
                                {(orderResult.walletDeduction || 0) > 0 && (
                                    <div className="flex justify-between items-center text-[12px] font-medium text-amber-600">
                                        <span>Saldo Wallet Dipakai</span>
                                        <span>-{formatPrice(orderResult.walletDeduction || 0)}</span>
                                    </div>
                                )}
                                {orderResult.uniqueCode && orderResult.uniqueCode > 0 && (
                                    <div className="flex justify-between items-center text-[12px] font-medium text-amber-600">
                                        <span>Kode Unik Transfer</span>
                                        <span>+Rp {orderResult.uniqueCode}</span>
                                    </div>
                                )}
                                <div className="mt-2 pt-4 border-t border-dashed border-neutral-base-200 flex justify-between items-center">
                                    <span className="text-[14px] font-bold text-neutral-base-900">Total Pembayaran</span>
                                    <span className="text-[18px] font-black text-amber-600">
                                        {formatPrice(orderResult.total)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        {/* <div className="bg-neutral-base-50/50 rounded-[40px] p-8 border border-neutral-base-100">
                            <p className="text-[11px] font-black text-neutral-base-900/40 uppercase tracking-widest mb-1 text-center italic">
                                Konfirmasi pesanan telah dikirim ke Email Anda.
                            </p>
                        </div> */}
                    </div>

                </div>
            </motion.div>
        </div>
    );
}

// Custom Icons for better look
const CreditCard = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
);
