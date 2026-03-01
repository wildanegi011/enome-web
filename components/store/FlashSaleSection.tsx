"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/store/ProductCard";
import { ASSET_URL } from "@/config/config";

interface FlashSaleEvent {
    id: number;
    namaEvent: string;
    waktuSelesai: string;
}

export default function FlashSaleSection() {
    const [event, setEvent] = useState<FlashSaleEvent | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        const fetchFlashSale = async () => {
            try {
                const res = await fetch("/api/flash-sale");
                if (res.ok) {
                    const data = await res.json();
                    setEvent(data.event);
                    setProducts(data.products || []);
                }
            } catch (error) {
                console.error("Failed to fetch flash sale", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFlashSale();
    }, []);

    useEffect(() => {
        if (!event?.waktuSelesai) return;

        // Date is usually returned as an ISO string from Next.js API
        const endTimeStr = event.waktuSelesai.endsWith('Z')
            ? event.waktuSelesai
            : event.waktuSelesai.replace(' ', 'T') + (event.waktuSelesai.includes('T') ? '' : '+07:00');

        const endTime = new Date(endTimeStr).getTime();

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const difference = endTime - now;

            if (difference <= 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((difference % (1000 * 60)) / 1000),
            };
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [event?.waktuSelesai]);

    if (loading) return null; // or a skeleton loader
    if (!event || products.length === 0) return null;

    const formatTime = (time: number) => time.toString().padStart(2, '0');

    return (
        <section className="py-16 md:py-24 bg-linear-to-b from-red-50/50 to-white relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-200 via-red-500 to-red-200 opacity-50"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-white to-transparent pointer-events-none z-10"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-red-800 text-[10px] font-bold uppercase tracking-widest">
                            <Zap className="w-3.5 h-3.5 fill-red-600 text-red-600 animate-pulse" />
                            Penawaran Terbatas
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-neutral-base-900 tracking-tight">
                            {event.namaEvent || "Flash Sale"}
                        </h2>
                    </div>

                    {/* Countdown Timer */}
                    {timeLeft && (
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="flex flex-col items-center">
                                <p className="text-[10px] font-bold text-neutral-base-500 uppercase tracking-widest mb-1 mt-1 text-center border-b border-red-200 pb-1 w-full">Berakhir Dalam</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {timeLeft.days > 0 && (
                                        <>
                                            <div className="flex flex-col items-center justify-center w-12 h-14 bg-neutral-base-900 rounded-lg shadow-lg">
                                                <span className="text-2xl font-bold text-white tabular-nums leading-none mt-1.5">{formatTime(timeLeft.days)}</span>
                                                <span className="text-[8px] text-red-400 uppercase tracking-widest mt-1">Hari</span>
                                            </div>
                                            <span className="text-xl font-bold text-neutral-base-900 animate-pulse pb-4">:</span>
                                        </>
                                    )}
                                    <div className="flex flex-col items-center justify-center w-12 h-14 bg-neutral-base-900 rounded-lg shadow-lg">
                                        <span className="text-2xl font-bold text-white tabular-nums leading-none mt-1.5">{formatTime(timeLeft.hours)}</span>
                                        <span className="text-[8px] text-red-400 uppercase tracking-widest mt-1">Jam</span>
                                    </div>
                                    <span className="text-xl font-bold text-neutral-base-900 animate-pulse pb-4">:</span>
                                    <div className="flex flex-col items-center justify-center w-12 h-14 bg-neutral-base-900 rounded-lg shadow-lg">
                                        <span className="text-2xl font-bold text-white tabular-nums leading-none mt-1.5">{formatTime(timeLeft.minutes)}</span>
                                        <span className="text-[8px] text-red-400 uppercase tracking-widest mt-1">Mnt</span>
                                    </div>
                                    <span className="text-xl font-bold text-neutral-base-900 animate-pulse pb-4">:</span>
                                    <div className="flex flex-col items-center justify-center w-12 h-14 bg-red-600 rounded-lg shadow-lg relative overflow-hidden">
                                        <div className="absolute inset-0 bg-white/20"></div>
                                        <AnimatePresence mode="popLayout">
                                            <motion.span
                                                key={timeLeft.seconds}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -20, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="text-2xl font-bold text-white tabular-nums leading-none absolute top-2.5"
                                            >
                                                {formatTime(timeLeft.seconds)}
                                            </motion.span>
                                        </AnimatePresence>
                                        <span className="text-[8px] text-red-100 font-bold uppercase tracking-widest absolute bottom-1.5">Dtk</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 pb-8">
                    {products.map((product, index) => {
                        const formattedProduct = {
                            id: product.produkId,
                            name: product.namaProduk,
                            image: product.gambar ? `${ASSET_URL}/img/produk_utama_thumb/${product.gambar}` : '/img/company/noimage.jpg',
                            category: product.kategori,
                            colors: product.colors
                                ? product.colors.split(",").map((c: string) => {
                                    const [name, value] = c.split("|");
                                    return { name, value };
                                }).slice(0, 3)
                                : [],
                            price: `Rp ${(product.finalMinPrice || product.minPrice || 0).toLocaleString('id-ID')}`,
                            originalPrice: `Rp ${(product.baseMinPrice || 0).toLocaleString('id-ID')}`,
                            totalStock: product.totalStock,
                            isOnFlashSale: true,
                            discountPercentage: product.discountPercentage,
                        };
                        return (
                            <ProductCard key={product.produkId} product={formattedProduct as any} index={index} />
                        );
                    })}
                </div>

                <div className="mt-8 text-center md:hidden">
                    <Link href="/products" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-neutral-base-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-amber-900 transition-colors duration-300 w-full">
                        Lihat Semua Promo <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
