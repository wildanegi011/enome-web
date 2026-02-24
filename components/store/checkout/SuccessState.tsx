"use client";

import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronRight, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { ASSET_URL } from "@/config/config";

interface SuccessStateProps {
    orderResult: { orderId: string, total: number };
    lastOrderedItems: any[];
    formatPrice: (price: number) => string;
}

export default function SuccessState({ orderResult, lastOrderedItems, formatPrice }: SuccessStateProps) {
    return (
        <div className="max-w-4xl mx-auto py-20 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-neutral-base-100 rounded-[48px] p-12 shadow-2xl shadow-neutral-base-900/5 text-center flex flex-col items-center gap-8"
            >
                <div className="w-24 h-24 rounded-[32px] bg-emerald-50 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>
                <div>
                    <h1 className="font-heading text-[42px] font-semibold text-neutral-base-900 tracking-tight leading-none mb-4">Pesanan Berhasil!</h1>
                    <p className="text-neutral-base-400 text-[18px] font-medium">Order ID: <span className="text-neutral-base-900 font-black">#{orderResult.orderId}</span></p>
                </div>

                <div className="w-full max-w-lg bg-neutral-base-50/50 rounded-[32px] p-8 border border-neutral-base-100/60 my-4">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between border-b border-neutral-base-100 pb-4">
                            <span className="text-[12px] font-black text-neutral-base-400 uppercase tracking-widest">Ringkasan Item</span>
                            <span className="text-[12px] font-black text-neutral-base-900">{lastOrderedItems.length} Produk</span>
                        </div>
                        <div className="flex flex-col gap-4">
                            {lastOrderedItems.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl overflow-hidden relative shrink-0 border border-neutral-base-100">
                                        <Image
                                            src={item.gambar ? `${ASSET_URL}/img/produk/${item.gambar}` : "/placeholder-product.jpg"}
                                            alt={item.namaProduk}
                                            fill
                                            className="object-cover"
                                            sizes="48px"
                                        />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-[14px] font-bold text-neutral-base-900 truncate max-w-[200px]">{item.namaProduk}</p>
                                        <p className="text-[10px] font-black text-neutral-base-400 uppercase tracking-widest">Qty: {item.qty} • Size {item.size}</p>
                                    </div>
                                    <span className="text-[14px] font-black text-neutral-base-900">{formatPrice(item.harga * item.qty)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-neutral-base-100 flex items-center justify-between">
                            <span className="text-[14px] font-black text-neutral-base-900 uppercase tracking-widest">Total Pembayaran</span>
                            <span className="text-[24px] font-black text-amber-800">{formatPrice(orderResult.total)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                    <Link
                        href={`/orders/${orderResult.orderId}`}
                        className="flex-1 bg-neutral-base-900 text-white h-16 rounded-2xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-base-800 transition-all shadow-xl shadow-neutral-base-900/10"
                    >
                        Detail Pesanan
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/products"
                        className="flex-1 bg-white border border-neutral-base-200 text-neutral-base-900 h-16 rounded-2xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-base-50 transition-all"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Belanja Lagi
                    </Link>
                </div>

                <p className="text-[11px] font-black text-neutral-base-300 uppercase tracking-widest mt-4">
                    Email konfirmasi telah dikirim ke alamat email Anda.
                </p>
            </motion.div>
        </div>
    );
}
