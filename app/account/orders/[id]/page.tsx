"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
    ShoppingBag, Calendar, CreditCard, ChevronLeft,
    Loader2, Package, CheckCircle2, MapPin,
    Truck, Mail, Phone, ExternalLink,
    AlertCircle, Copy, Check, Tag
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/store/Navbar";
import UserSidebar from "@/components/store/UserSidebar";
import AccountSidebarMobile from "@/components/store/AccountSidebarMobile";
import { ASSET_URL } from "@/config/config";
import { CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const OrderDetailSkeleton = () => (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-neutral-base-900">
        <Navbar />
        <main className="max-w-[1340px] mx-auto px-4 md:px-8 py-10">
            <div className="flex flex-col lg:flex-row gap-12">
                <div className="hidden lg:block">
                    <UserSidebar />
                </div>
                <div className="flex-1 min-w-0">
                    {/* Header Skeleton */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 md:mb-8">
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                            <Skeleton className="w-48 md:w-64 h-7 md:h-8" />
                        </div>
                        <div className="flex items-center gap-2 ml-14 md:ml-0">
                            <Skeleton className="w-24 md:w-32 h-6 md:h-8" />
                            <Skeleton className="w-16 h-6 rounded-lg" />
                        </div>
                    </div>

                    {/* Timeline Skeleton */}
                    <div className="bg-white border border-neutral-base-100 rounded-[28px] md:rounded-[32px] p-6 md:p-10 mb-8 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between gap-6 overflow-x-auto pb-2 scrollbar-hide">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex flex-col items-center min-w-[80px]">
                                    <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl" />
                                    <Skeleton className="w-16 h-3 mt-3" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-2 space-y-8">
                            {/* Items Skeleton */}
                            <div className="bg-white border border-neutral-base-100 rounded-[28px] md:rounded-[32px] overflow-hidden shadow-sm">
                                <div className="px-6 md:px-8 py-5 md:py-6 border-b border-neutral-base-50 flex items-center justify-between">
                                    <Skeleton className="w-32 h-5" />
                                    <Skeleton className="w-20 h-4" />
                                </div>
                                <div className="divide-y divide-neutral-base-50">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="p-6 md:p-8 flex items-start md:items-center gap-4 md:gap-6">
                                            <Skeleton className="w-20 h-24 md:w-24 md:h-32 rounded-xl md:rounded-2xl shrink-0" />
                                            <div className="flex-1 space-y-3">
                                                <Skeleton className="w-3/4 h-5" />
                                                <Skeleton className="w-1/2 h-4" />
                                                <Skeleton className="w-24 h-6 mt-2 md:mt-4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Info Skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[1, 2].map((i) => (
                                    <div key={i} className="bg-white border border-neutral-base-100 rounded-[28px] md:rounded-[32px] p-6 md:p-8 shadow-sm">
                                        <div className="flex items-center gap-4 mb-6">
                                            <Skeleton className="w-10 h-10 rounded-xl" />
                                            <Skeleton className="w-32 h-5" />
                                        </div>
                                        <div className="space-y-4">
                                            <Skeleton className="w-full h-4" />
                                            <Skeleton className="w-5/6 h-4" />
                                            <Skeleton className="w-1/2 h-4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Skeleton */}
                        <div className="space-y-8">
                            <div className="bg-white border border-neutral-base-100 rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-xl shadow-neutral-base-900/5 xl:sticky xl:top-24">
                                <Skeleton className="w-40 h-6 mb-8" />
                                <div className="space-y-6 pb-8 border-b border-neutral-base-50">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex justify-between">
                                            <Skeleton className="w-24 h-4" />
                                            <Skeleton className="w-20 h-4" />
                                        </div>
                                    ))}
                                </div>
                                <div className="py-8 flex justify-between">
                                    <Skeleton className="w-24 h-3" />
                                    <Skeleton className="w-32 h-8" />
                                </div>
                                <Skeleton className="w-full h-12 md:h-14 rounded-2xl mt-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
);

interface OrderDetail {
    order: {
        orderId: string;
        tglOrder: string;
        statusOrder: string;
        statusTagihan: string;
        totalTagihan: number;
        totalHarga: number;
        ongkir: number;
        biayalain: number;
        totalBerat: number;
        metodebayar: string;
        keterangan: string;
        namaPenerima: string;
        teleponPenerima: string;
        alamatKirim: string;
        provinsiKirim: string;
        kotaKirim: string;
        distrikKirim: string;
        noResi: string;
        ekspedisi: string;
        service: string;
        viaWallet: number;
        viaBank: number;
    };
    items: any[];
    paymentInfo?: any;
    voucherInfo?: {
        kode: string;
        nominal: number;
    } | null;
}

const statusSteps = [
    { label: "Belum Bayar", status: "OPEN" },
    { label: "Dikemas", status: "PROSES PACKING" },
    { label: "Dikirim", status: "PESANAN DIKIRIM" },
    { label: "Selesai", status: "CLOSE" },
];

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedResi, setCopiedResi] = useState(false);
    const [copiedRekening, setCopiedRekening] = useState(false);
    const [copiedOrderId, setCopiedOrderId] = useState(false);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                let orderIdParam = Array.isArray(params.id) ? params.id[0] : (params.id || "");
                if (typeof window !== 'undefined' && window.location.hash) {
                    orderIdParam += window.location.hash;
                }
                const response = await fetch(`/api/user/orders/${encodeURIComponent(orderIdParam)}`);
                if (!response.ok) {
                    if (response.status === 404) router.push("/account/orders");
                    throw new Error("Failed to fetch");
                }
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrderDetail();
    }, [params.id]);

    const handleCopy = (text: string, type: 'resi' | 'rekening' | 'order') => {
        navigator.clipboard.writeText(text);
        if (type === 'resi') {
            setCopiedResi(true);
            setTimeout(() => setCopiedResi(false), 2000);
        } else if (type === 'rekening') {
            setCopiedRekening(true);
            setTimeout(() => setCopiedRekening(false), 2000);
        } else {
            setCopiedOrderId(true);
            setTimeout(() => setCopiedOrderId(false), 2000);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    if (isLoading) {
        return <OrderDetailSkeleton />;
    }

    if (!data) return null;

    const { order, items, paymentInfo, voucherInfo, uniqueCode: uniqueCodeValue } = data as any;
    const currentStatusIndex = statusSteps.findIndex(s => s.status === order.statusOrder);

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans text-neutral-base-900">
            <Navbar />

            <main className="max-w-[1340px] mx-auto px-3 sm:px-4 md:px-8 py-6 md:py-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="hidden lg:block">
                        <UserSidebar />
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Header & Back Button */}
                        <div className="flex flex-col gap-6 mb-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <Link href="/account/orders" className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border border-neutral-base-100 flex items-center justify-center hover:bg-neutral-base-50 transition-all shrink-0">
                                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-neutral-base-900" />
                                    </Link>
                                    <h1 className="text-[24px] md:text-[36px] font-black text-neutral-base-900 tracking-tighter">
                                        Detail Pesanan
                                    </h1>
                                </div>
                                <div className="flex items-center gap-3 self-end sm:self-auto">
                                    <AccountSidebarMobile />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-y-4 gap-x-6 ml-14 md:ml-0">
                                {/* Order Date */}
                                <div className="flex items-center gap-3 text-neutral-base-400">
                                    <Calendar className="w-4 h-4 opacity-50" />
                                    <span className="text-[13px] md:text-[14px] font-bold text-neutral-base-500">
                                        {new Date(order.tglOrder).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>

                                {/* Order ID Pill */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 pl-0 sm:pl-6 border-l-0 sm:border-l border-neutral-base-100">
                                    <span className="text-[10px] font-black text-neutral-base-300 uppercase tracking-widest">ID Pesanan</span>
                                    <div
                                        onClick={() => handleCopy(order.orderId, 'order')}
                                        className="flex items-center gap-2.5 px-3 py-1.5 bg-neutral-base-50 border border-neutral-base-100 rounded-xl group transition-all hover:bg-white hover:border-neutral-base-900 hover:shadow-md active:scale-95 cursor-pointer"
                                    >
                                        <span className="text-[11px] md:text-[12px] font-black text-neutral-base-900 tracking-wider font-mono">
                                            {order.orderId}
                                        </span>
                                        <div className="w-px h-3 bg-neutral-base-200" />
                                        {copiedOrderId ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5 text-neutral-base-300 group-hover:text-neutral-base-900 transition-colors" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Timeline Card */}
                        <div className="bg-white border border-neutral-base-100 rounded-[28px] md:rounded-[32px] p-6 md:p-10 mb-8 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between gap-4 relative overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide">
                                {statusSteps.map((step, idx) => {
                                    const isCompleted = idx <= currentStatusIndex || order.statusOrder === "SELESAI";

                                    return (
                                        <div key={step.label} className="flex flex-col items-center relative z-10 min-w-[80px] md:flex-1">
                                            <div className={cn(
                                                "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500",
                                                isCompleted ? "bg-neutral-base-900 text-white shadow-xl shadow-neutral-base-900/20" : "bg-neutral-base-50 text-neutral-base-200"
                                            )}>
                                                {isCompleted ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <Package className="w-5 h-5 md:w-6 md:h-6" />}
                                            </div>
                                            <span className={cn(
                                                "text-[10px] md:text-[12px] font-bold mt-3 md:mt-4 tracking-tight text-center",
                                                isCompleted ? "text-neutral-base-900" : "text-neutral-base-300"
                                            )}>{step.label}</span>

                                            {/* Connector line for desktop */}
                                            {idx < statusSteps.length - 1 && (
                                                <div className="hidden md:block absolute left-1/2 top-6 w-full h-[2px] bg-neutral-base-50 -translate-y-1/2 ml-6 pr-12">
                                                    <div className={cn(
                                                        "h-full bg-neutral-base-900 transition-all duration-700",
                                                        idx < currentStatusIndex ? "w-full" : "w-0"
                                                    )} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Additional info for bank transfer if any */}
                        {order.statusTagihan === "BELUM BAYAR" && paymentInfo && (
                            <div className="mt-8 mb-5 p-6 bg-amber-50 rounded-3xl border border-amber-200/50">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-amber-100 shadow-sm">
                                        <AlertCircle className="w-4 h-4 text-amber-800" />
                                    </div>
                                    <p className="text-[13px] font-bold text-amber-900">Instruksi Pembayaran</p>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <p className="text-[11px] font-black text-amber-800/60 uppercase tracking-widest mb-2">Transfer Ke Rekening {paymentInfo.namaBank}</p>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-[20px] font-black text-neutral-base-900 tracking-tight">{paymentInfo.noRekening}</h4>
                                            <button onClick={() => handleCopy(paymentInfo.noRekening, 'rekening')} className="p-2 rounded-xl border border-amber-200 bg-white hover:bg-amber-100/50 transition-colors shadow-sm">
                                                {copiedRekening ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-700" />}
                                            </button>
                                        </div>
                                        <p className="text-[12px] font-bold text-neutral-base-500 mt-1">a.n {paymentInfo.namaPemilik}</p>
                                    </div>

                                    {uniqueCodeValue > 0 && (
                                        <div className="pt-5 border-t border-amber-200/50">
                                            <p className="text-[11px] font-black text-amber-800/60 uppercase tracking-widest mb-2">PENTING: Transfer Tepat Hingga 3 Digit Terakhir</p>
                                            <p className="text-[14px] font-medium text-rose-900/80 leading-relaxed">
                                                Pastikan Anda mentransfer tepat sejumlah tagihan yakni <b className="text-neutral-base-900 text-[16px]">{formatPrice(order.totalTagihan)}</b>.
                                                Perhatikan kode unik (<b className="text-rose-600 font-black bg-white px-2.5 py-1 rounded-lg border border-rose-200 ml-1 text-[16px] shadow-sm">{uniqueCodeValue}</b>) agar sistem dapat memverifikasi pembayaran Anda secara otomatis.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                            <div className="xl:col-span-2 space-y-8">
                                {/* Ordered Items */}
                                <div className="bg-white border border-neutral-base-100 rounded-[28px] md:rounded-[32px] overflow-hidden shadow-sm">
                                    <div className="px-6 md:px-8 py-5 md:py-6 border-b border-neutral-base-50 flex items-center justify-between">
                                        <h2 className="text-[14px] md:text-[16px] font-bold text-neutral-base-900">Rincian Barang</h2>
                                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-neutral-base-400">{items.length} Barang</span>
                                    </div>
                                    <div className="divide-y divide-neutral-base-50">
                                        {items.map((item: any) => (
                                            <div key={item.id} className="p-6 md:p-8 flex items-start md:items-center gap-4 md:gap-6 group">
                                                <div className="w-20 h-24 md:w-24 md:h-32 bg-neutral-base-50 rounded-xl md:rounded-2xl overflow-hidden relative border border-neutral-base-50 shrink-0">
                                                    <Image
                                                        src={item.gambar ? `${ASSET_URL}/img/produk/${item.gambar}` : "/placeholder-product.jpg"}
                                                        alt={item.namaProduk}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-[14px] md:text-[16px] font-bold text-neutral-base-900 mb-1 md:mb-2 truncate">{item.namaProduk}</h3>
                                                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[11px] md:text-[13px] font-medium text-neutral-base-400">
                                                        {item.ukuran && <span>Ukuran: <b className="text-neutral-base-900">{item.ukuran}</b></span>}
                                                        {item.warna && <span>Warna: <b className="text-neutral-base-900">{item.warna}</b></span>}
                                                        <span>Qty: <b className="text-neutral-base-900">{item.qty}</b></span>
                                                    </div>
                                                    <p className="text-[14px] md:text-[16px] font-bold text-neutral-base-900 mt-2 md:mt-4">{formatPrice(item.harga)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Shipping & Address Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white border border-neutral-base-100 rounded-[32px] p-8 shadow-sm">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-base-50 flex items-center justify-center">
                                                <Truck className="w-5 h-5 text-neutral-base-900" />
                                            </div>
                                            <h2 className="text-[16px] font-bold text-neutral-base-900">Info Pengiriman</h2>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-widest text-neutral-base-300 mb-1">Kurir</p>
                                                <p className="text-[14px] font-bold text-neutral-base-900 uppercase">{order.ekspedisi} - {order.service}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-widest text-neutral-base-300 mb-1">No. Resi</p>
                                                <div className="flex items-center gap-2 group">
                                                    <p className="text-[14px] font-bold text-neutral-base-900">{order.noResi || "Menunggu Update Resi"}</p>
                                                    {order.noResi && (
                                                        <button onClick={() => handleCopy(order.noResi, 'resi')} className="p-1.5 rounded-lg hover:bg-neutral-base-50 transition-colors">
                                                            {copiedResi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-base-300" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-neutral-base-100 rounded-[32px] p-8 shadow-sm">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-base-50 flex items-center justify-center">
                                                <MapPin className="w-5 h-5 text-neutral-base-900" />
                                            </div>
                                            <h2 className="text-[16px] font-bold text-neutral-base-900">Alamat Pengiriman</h2>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[14px] font-bold text-neutral-base-900 uppercase tracking-tight">{order.namaPenerima}</p>
                                            <p className="text-[13px] font-medium text-neutral-base-400 leading-relaxed">
                                                {order.alamatKirim}, {order.distrikKirim}, {order.kotaKirim}, {order.provinsiKirim}
                                            </p>
                                            <div className="flex items-center gap-2 text-[13px] font-bold text-neutral-base-500 pt-2 border-t border-neutral-base-50">
                                                <Phone className="w-3.5 h-3.5" />
                                                {order.teleponPenerima}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Breakdown Card */}
                            <div className="space-y-8">
                                <div className="bg-white border border-neutral-base-100 rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-xl shadow-neutral-base-900/5 xl:sticky xl:top-24">
                                    <h2 className="text-[16px] md:text-[18px] font-bold text-neutral-base-900 mb-6 md:mb-8">Ringkasan Pembayaran</h2>

                                    <div className="space-y-4 md:space-y-6 pb-6 md:pb-8 border-b border-neutral-base-50">
                                        <div className="flex items-center justify-between text-[13px] md:text-[14px] font-medium">
                                            <span className="text-neutral-base-400">Subtotal</span>
                                            <span className="text-neutral-base-900 font-bold">{formatPrice(order.totalHarga)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[13px] md:text-[14px] font-medium">
                                            <span className="text-neutral-base-400">Biaya Pengiriman</span>
                                            <span className="text-neutral-base-900 font-bold">{formatPrice(order.ongkir)}</span>
                                        </div>
                                        {order.biayalain > 0 && (
                                            <div className="flex items-center justify-between text-[13px] md:text-[14px] font-medium">
                                                <span className="text-neutral-base-400">Biaya Kemasan</span>
                                                <span className="text-neutral-base-900 font-bold">{formatPrice(order.biayalain)}</span>
                                            </div>
                                        )}

                                        {voucherInfo && voucherInfo.nominal > 0 && (
                                            <div className="flex items-center justify-between text-[13px] md:text-[14px] font-medium">
                                                <span className="text-emerald-600 flex items-center gap-1.5 line-clamp-1">
                                                    <Tag className="w-3.5 h-3.5 shrink-0" />
                                                    Voucher ({voucherInfo.kode})
                                                </span>
                                                <span className="text-emerald-600 font-bold">-{formatPrice(voucherInfo.nominal)}</span>
                                            </div>
                                        )}

                                        {order.viaWallet > 0 && (
                                            <div className="flex items-center justify-between text-[13px] md:text-[14px] font-medium">
                                                <span className="text-emerald-600">Wallet Deduction</span>
                                                <span className="text-emerald-600 font-bold">-{formatPrice(order.viaWallet)}</span>
                                            </div>
                                        )}

                                        {uniqueCodeValue > 0 && (
                                            <div className="flex items-center justify-between text-[13px] md:text-[14px] font-medium">
                                                <span className="text-amber-600">Kode Unik</span>
                                                <span className="text-amber-600 font-bold">+{formatPrice(uniqueCodeValue)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="py-6 md:py-8 flex items-center justify-between">
                                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-neutral-base-400">Total Tagihan</span>
                                        <span className="text-[20px] md:text-[24px] font-black text-neutral-base-900 tracking-tight">{formatPrice(order.totalTagihan)}</span>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <div className="p-4 bg-neutral-base-50 rounded-2xl flex items-center justify-between border border-neutral-base-100">
                                            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-neutral-base-400">Metode Bayar</span>
                                            <span className="text-[11px] md:text-[12px] font-bold text-neutral-base-900 uppercase bg-white px-3 py-1 rounded-lg border border-neutral-base-100">{order.metodebayar}</span>
                                        </div>

                                        {order.statusTagihan === "BELUM BAYAR" && (
                                            <Button className="w-full h-12 md:h-14 bg-neutral-base-900 text-white rounded-2xl text-[11px] md:text-[12px] font-black uppercase tracking-widest hover:bg-neutral-base-800 transition-all shadow-xl shadow-neutral-base-900/10 active:scale-95 gap-3">
                                                Bayar Sekarang
                                                <CreditCard className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
