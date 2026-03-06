"use client";

import FallbackImage from "@/components/store/shared/FallbackImage";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useHighlights } from "@/hooks/use-products";
import { ASSET_URL } from "@/config/config";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function FeaturedBanner() {
    const ref = useRef(null);
    const { data: highlights, isLoading } = useHighlights();

    if (isLoading) {
        return (
            <section className="py-16 md:py-20 bg-white min-h-[550px] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-neutral-base-200 border-t-neutral-base-900 rounded-full animate-spin"></div>
                </div>
            </section>
        );
    }

    if (!highlights || highlights.length === 0) {
        return null;
    }

    // Ambil produk dengan highlight_order = 1
    const featuredProduct = highlights.find(p => p.highlightOrder === 1) || highlights[0];

    // Fallback image jika produk tidak ada gambar
    const imageUrl = featuredProduct.gambar
        ? `${ASSET_URL}/img/produk/${featuredProduct.gambar}`
        : "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=1200&q=80";

    const formatPriceRange = (min: any, max: any) => {
        const nMin = parseInt(min);
        const nMax = parseInt(max);
        if (!nMax || nMin === nMax) return formatCurrency(nMin);
        return `${formatCurrency(nMin)} - ${formatCurrency(nMax)}`;
    };

    const price = formatPriceRange(featuredProduct.finalMinPrice, featuredProduct.finalMaxPrice);

    return (
        <section ref={ref} className="py-16 md:py-20 bg-white">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                <div className="relative grid lg:grid-cols-2 bg-neutral-base-100/50 lg:bg-neutral-base-100 rounded-sm lg:overflow-hidden min-h-[550px] shadow-sm">
                    {/* Left Side - Image with Diagonal Split */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative h-[400px] lg:h-auto z-10"
                    >
                        {/* Desktop Clip Path Mask */}
                        <div
                            className="absolute inset-0 hidden lg:block"
                            style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 0% 100%)" }}
                        >
                            <FallbackImage
                                src={imageUrl}
                                alt={featuredProduct.namaProduk}
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />
                        </div>

                        {/* Mobile Image (No Clip Path) */}
                        <div className="absolute inset-0 lg:hidden">
                            <FallbackImage
                                src={imageUrl}
                                alt={featuredProduct.namaProduk}
                                fill
                                className="object-cover"
                                sizes="100vw"
                            />
                        </div>
                    </motion.div>

                    {/* Right Side - Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="flex flex-col justify-center p-8 md:p-12 lg:p-20 lg:-ml-20 z-0 bg-neutral-base-100 lg:bg-transparent"
                    >
                        <span className="text-neutral-base-400 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em]">
                            Limited Edition
                        </span>
                        <h2 className="font-serif text-[36px] md:text-[42px] lg:text-[60px] text-neutral-base-900 leading-[1.1] mt-2 md:mt-3 line-clamp-2">
                            {featuredProduct.namaProduk}
                        </h2>

                        <div className="mt-6 md:mt-8 border-l-2 border-neutral-base-900 pl-4 md:pl-6">
                            <span className="text-[10px] font-black text-neutral-base-900 uppercase tracking-[0.05em]">
                                PRODUCT DETAIL
                            </span>
                            {featuredProduct.deskripsi ?
                                <div
                                    className="text-neutral-base-500 mt-3 md:mt-4 leading-relaxed text-[14px] md:text-[15px] max-w-sm line-clamp-3 prose prose-sm prose-neutral"
                                    dangerouslySetInnerHTML={{ __html: featuredProduct.deskripsi }}
                                />
                                :
                                <p className="text-neutral-base-500 mt-3 md:mt-4 leading-relaxed text-[14px] md:text-[15px] max-w-sm line-clamp-3">
                                    This exquisite piece represents centuries of craftsmanship. Each motif is hand-drawn, telling a unique story of heritage and elegance.
                                </p>
                            }
                        </div>

                        <p className="text-2xl md:text-3xl font-black text-neutral-base-900 mt-8 md:mt-10">
                            {price}
                        </p>

                        <Link href={`/products/${featuredProduct.produkId}`} className="mt-8 md:mt-10 self-start w-full md:w-auto">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-neutral-base-900 text-white px-10 md:px-16 py-3.5 md:py-4 rounded-lg text-sm font-bold tracking-[0.2em] uppercase shadow-2xl shadow-black/20 transition-all w-full"
                            >
                                Shop Now
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
