"use client";

import { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/store/layout/Navbar";
import Footer from "@/components/store/layout/Footer";
import ProductGallery from "@/components/store/product/ProductGallery";
import ProductInfo from "@/components/store/product/ProductInfo";
import ProductCard from "@/components/store/product/ProductCard";
import { ASSET_URL } from "@/config/config";
import { ShoppingCart } from "lucide-react";
import Breadcrumb from "@/components/store/shared/Breadcrumb";
import Link from "next/link";
import FallbackImage from "@/components/store/shared/FallbackImage";
import { m, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

export function ProductDetailSkeleton() {
    return (
        <TooltipProvider>
            <main className="min-h-screen bg-white overflow-x-hidden">
                <Navbar />

                <div className="sticky top-[70px] md:top-[80px] z-30 bg-white/95 backdrop-blur-md border-b border-neutral-base-100">
                    <div className="w-full max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12 py-3 md:py-3.5">
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>

                <section className="py-6 md:py-12 lg:py-16">
                    <div className="w-full max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12 lg:gap-16 items-start">
                            <div className="lg:col-span-6">
                                <Skeleton className="aspect-square w-full rounded-2xl" />
                                <div className="grid grid-cols-4 gap-4 mt-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <Skeleton key={i} className="aspect-square w-full rounded-lg" />
                                    ))}
                                </div>
                            </div>

                            <div className="lg:col-span-6 space-y-8">
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-3/4" />
                                    <Skeleton className="h-8 w-1/4" />
                                </div>
                                <div className="space-y-6">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="space-y-3">
                                            <Skeleton className="h-4 w-24" />
                                            <div className="flex gap-3">
                                                {[1, 2, 3, 4].map((j) => (
                                                    <Skeleton key={j} className="h-12 w-12 rounded-full" />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Skeleton className="h-14 w-full rounded-xl" />
                            </div>
                        </div>
                    </div>
                </section>
                <Footer />
            </main>
        </TooltipProvider>
    );
}

export default function ProductDetailClient({ productData }: { productData: any }) {
    const { product, stats, variants, images, additionalImages, relatedProducts } = productData;

    const [selectedVariant, setSelectedVariant] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [showSticky, setShowSticky] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 600) {
                setShowSticky(true);
            } else {
                setShowSticky(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const formatPriceRange = (min: any, max: any) => {
        const nMin = parseInt(min);
        const nMax = parseInt(max);
        if (!nMax || nMin === nMax) return formatCurrency(nMin);
        return `${formatCurrency(nMin)} - ${formatCurrency(nMax)}`;
    };

    let mainGalleryImages: string[] = [];
    let bottomImages: string[] = [];

    if (selectedColor === "") {
        mainGalleryImages = [`${ASSET_URL}/img/produk_utama/${product.gambar}`];
        bottomImages = additionalImages?.map((img: any) => `${ASSET_URL}/img/produk/${img.gambar}`) || [];
    } else {
        const selectedColorObj = variants.colors.find((c: any) => c.id === selectedColor);
        const colorName = selectedColorObj?.name || "";

        bottomImages = additionalImages
            ?.filter((img: any) => String(img.warna).toLowerCase() === colorName.toLowerCase())
            ?.map((img: any) => `${ASSET_URL}/img/produk/${img.gambar}`) || [];

        if (bottomImages.length > 0) {
            mainGalleryImages = [bottomImages[0]];
        } else {
            mainGalleryImages = [`${ASSET_URL}/img/produk_utama/${product.gambar}`];
        }
    }

    const infoProduct = {
        name: product.namaProduk,
        price: formatPriceRange(stats.finalMinPrice, stats.finalMaxPrice),
        originalPrice: (stats.finalMinPrice !== stats.baseMinPrice || stats.finalMaxPrice !== stats.baseMaxPrice)
            ? formatPriceRange(stats.baseMinPrice, stats.baseMaxPrice)
            : undefined,
        discountPercentage: stats.discountPercentage,
        description: product.deskripsi || "No description available.",
        colors: variants.colors,
        sizes: variants.sizes,
        types: variants.types,
        collection: product.kategori,
        detail: product.detail,
        totalStock: stats.totalStock,
        matrix: variants.matrix,
        commission: stats.hasCommission ? formatPriceRange(stats.commissionMin, stats.commissionMax) : undefined,
        hasCommission: stats.hasCommission,
        isOnFlashSale: stats.isOnFlashSale,
        isOnPreOrder: stats.isOnPreOrder || product.produkPreorder === 1,
        flashSaleEndTime: stats.flashSaleEndTime,
        jenisProduk: product.jenisProduk,
        jenisBahan: product.jenisBahan,
        isFuring: product.isFuring,
        berat: variants.berat,
        isHighlighted: product.isHighlighted,
    };

    return (
        <TooltipProvider>
            <main className="min-h-screen bg-white overflow-x-hidden">
                <Navbar />

                <div className="sticky top-[70px] md:top-[80px] z-30 bg-white/95 backdrop-blur-md border-b border-neutral-base-100">
                    <div className="w-full max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12 py-3 md:py-3.5 overflow-x-auto scrollbar-hide">
                        <Breadcrumb
                            items={[
                                { label: "Beranda", href: "/" },
                                { label: "Produk", href: "/products" },
                                { label: product.namaProduk }
                            ]}
                        />
                    </div>
                </div>

                <section className="py-6 md:py-12 lg:py-16">
                    <div className="w-full max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12 lg:gap-16 items-start">
                            <div className="lg:col-span-6 min-w-0">
                                <ProductGallery
                                    images={mainGalleryImages}
                                    isSoldOut={parseInt(stats.totalStock) === 0}
                                    isOnFlashSale={stats.isOnFlashSale}
                                    isOnPreOrder={stats.isOnPreOrder}
                                />
                            </div>

                            <div className="lg:col-span-6 min-w-0 lg:sticky lg:top-36">
                                <ProductInfo
                                    product={{ ...infoProduct, id: product.produkId } as any}
                                    selectedVariant={selectedVariant}
                                    setSelectedVariant={setSelectedVariant}
                                    selectedColor={selectedColor}
                                    setSelectedColor={setSelectedColor}
                                    activeImage={mainGalleryImages[0]}
                                />
                            </div>
                        </div>

                        <div className="mt-8 md:mt-16 lg:mt-20">
                            <m.div
                                layout
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, margin: "-100px" }}
                                variants={{
                                    hidden: { opacity: 0 },
                                    show: {
                                        opacity: 1,
                                        transition: {
                                            staggerChildren: 0.1
                                        }
                                    }
                                }}
                                className="columns-1 md:columns-2 gap-8 space-y-8 min-h-[50vh]"
                            >
                                <AnimatePresence mode="popLayout">
                                    {bottomImages.map((img: string, idx: number) => {
                                        const ratios = ["aspect-square", "aspect-[3/4]", "aspect-[2/3]", "aspect-[3/5]", "aspect-[4/5]"];
                                        const ratioClass = ratios[idx % ratios.length];

                                        return (
                                            <m.div
                                                key={img}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                className={`relative bg-neutral-base-50 overflow-hidden break-inside-avoid group shadow-md hover:shadow-xl transition-all duration-700 rounded-xl ${ratioClass}`}
                                            >
                                                <FallbackImage
                                                    src={img}
                                                    alt={`Product detail image ${idx + 1}`}
                                                    fill
                                                    quality={80}
                                                    loading="lazy"
                                                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                                    sizes="(max-width: 768px) 50vw, 33vw"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                                            </m.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </m.div>
                        </div>
                    </div>
                </section>

                {relatedProducts.length > 0 && (
                    <section className="py-8 md:py-20 border-t border-neutral-base-100">
                        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12">
                            <div className="mb-6 md:mb-12 font-montserrat text-center md:text-left">
                                <h2 className="text-[20px] md:text-[32px] text-neutral-base-900 font-bold tracking-tight">Rekomendasi Untuk Anda</h2>
                                <p className="text-neutral-base-500 mt-1 md:mt-2 text-[12px] md:text-base leading-relaxed">Koleksi lainnya dari kategori {product.kategori}.</p>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
                                {relatedProducts.map((p: any, idx: number) => {
                                    const relColorArray = p.colors
                                        ? p.colors.split(",").map((c: string) => {
                                            const [name, value] = c.split("|");
                                            return { name, value };
                                        })
                                        : [];

                                    const mappedRelProduct = {
                                        id: p.produkId,
                                        name: p.namaProduk,
                                        image: p.gambar ? `${ASSET_URL}/img/produk_utama/${p.gambar}` : "/placeholder.jpg",
                                        colors: relColorArray,
                                        price: formatPriceRange(p.finalMinPrice, p.finalMaxPrice),
                                        originalPrice: (p.finalMinPrice !== p.baseMinPrice || p.finalMaxPrice !== p.baseMaxPrice)
                                            ? formatPriceRange(p.baseMinPrice, p.baseMaxPrice)
                                            : undefined,
                                        isOnFlashSale: p.isOnFlashSale,
                                        discountPercentage: p.discountPercentage,
                                        designer: "Handmade Batik by Énome",
                                        totalStock: p.totalStock
                                    };
                                    return <ProductCard key={p.produkId} product={mappedRelProduct as any} index={idx} />;
                                })}
                            </div>
                        </div>
                    </section>
                )}

                <Footer />

                <AnimatePresence>
                    {showSticky && (
                        <m.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="fixed top-0 left-0 right-0 z-50 hidden lg:block bg-white/95 backdrop-blur-md border-b border-neutral-base-100 shadow-sm"
                        >
                            <div className="w-full max-w-[1400px] mx-auto px-8 lg:px-12 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-neutral-base-100 shrink-0">
                                        <FallbackImage
                                            src={mainGalleryImages[0]}
                                            alt={product.namaProduk}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <h3 className="text-[14px] font-bold text-neutral-base-900 truncate">{product.namaProduk}</h3>
                                        <div className="flex items-center gap-2 text-[12px] text-neutral-base-500 font-medium">
                                            <span>{infoProduct.price}</span>
                                            {selectedColor && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-neutral-base-300" />
                                                    <span>{variants.colors.find((c: any) => c.id === selectedColor)?.name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => {
                                            const el = document.getElementById("add-to-cart-button");
                                            el?.click();
                                        }}
                                        className="flex items-center gap-2 bg-neutral-base-900 text-white px-8 py-3 rounded-lg text-[12px] font-bold uppercase tracking-widest hover:bg-neutral-base-800 transition-all shadow-lg active:scale-95"
                                    >
                                        <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" /> Tambah ke Keranjang
                                    </button>
                                </div>
                            </div>
                        </m.div>
                    )}
                </AnimatePresence>
            </main>
        </TooltipProvider>
    );
}
