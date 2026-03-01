"use client";

import { use } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import ProductGallery from "@/components/store/ProductGallery";
import ProductInfo from "@/components/store/ProductInfo";
import ProductCard from "@/components/store/ProductCard";
import { useProduct } from "@/hooks/use-products";
import { ASSET_URL } from "@/config/config";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const { data: productData, isLoading, error } = useProduct(params.id);

    if (isLoading) {
        return <ProductDetailSkeleton />;
    }

    if (error || !productData) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-serif italic text-neutral-base-900">Product Not Found</h2>
                <p className="text-neutral-base-500">The product you are looking for might have been moved or deleted.</p>
            </div>
        );
    }

    const { product, stats, variants, images, relatedProducts } = productData as any;

    // Map images to full URLs
    const galleryImages = images.map((img: string) => `${ASSET_URL}/img/produk/${img}`);

    const formatPriceRange = (min: any, max: any) => {
        const nMin = parseInt(min);
        const nMax = parseInt(max);
        if (!nMax || nMin === nMax) return `Rp ${nMin.toLocaleString()}`;
        return `Rp ${nMin.toLocaleString()} - Rp ${nMax.toLocaleString()}`;
    };

    // Map product for ProductInfo
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
        collection: product.kategori,
        detail: product.detail,
        totalStock: stats.totalStock,
        matrix: variants.matrix,
        commission: stats.hasCommission ? formatPriceRange(stats.commissionMin, stats.commissionMax) : undefined,
        hasCommission: stats.hasCommission,
        isOnFlashSale: stats.isOnFlashSale,
        flashSaleEndTime: stats.flashSaleEndTime
    };

    return (
        <TooltipProvider>
            <main className="min-h-screen bg-white overflow-x-hidden">
                <Navbar />

                {/* Breadcrumbs */}
                <div className="border-b border-neutral-base-100 bg-neutral-base-50/50">
                    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-4 overflow-x-auto scrollbar-hide">
                        <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-neutral-base-400 font-sans">
                            Home <span className="mx-2">/</span> Products <span className="mx-2">/</span> <span className="text-neutral-base-900">{product.namaProduk}</span>
                        </p>
                    </div>
                </div>

                <section className="py-8 md:py-16 lg:py-20">
                    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 lg:gap-16 items-start">

                            {/* Left Side - Image Gallery */}
                            <div className="lg:col-span-7 min-w-0">
                                <ProductGallery
                                    images={galleryImages}
                                    isSoldOut={parseInt(stats.totalStock) === 0}
                                    isOnFlashSale={stats.isOnFlashSale}
                                    flashSaleEndTime={stats.flashSaleEndTime}
                                />
                            </div>

                            {/* Right Side - Product Info */}
                            <div className="lg:col-span-5 min-w-0">
                                <ProductInfo product={{ ...infoProduct, id: product.produkId } as any} />
                            </div>

                        </div>
                    </div>
                </section>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <section className="py-10 md:py-20 border-t border-neutral-base-100">
                        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                            <div className="mb-6 md:mb-12">
                                <h2 className="font-heading text-[22px] md:text-[32px] text-neutral-base-900">Rekomendasi Untuk Anda</h2>
                                <p className="text-neutral-base-500 mt-1 md:mt-2 text-[13px] md:text-base">Koleksi lainnya dari kategori {product.kategori}.</p>
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
                                        image: p.gambar ? `${ASSET_URL}/img/produk/${p.gambar}` : "/placeholder.jpg",
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
                            <div className="mt-8 md:mt-12 text-center">
                                <Link
                                    href={`/products?category=${encodeURIComponent(product.kategori)}`}
                                    className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.15em] uppercase text-neutral-base-900 border border-neutral-base-200 px-8 py-3 rounded-lg hover:bg-neutral-base-900 hover:text-white transition-all duration-300"
                                >
                                    Lihat Semua
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </section>
                )}

                <Footer />
            </main>
        </TooltipProvider>
    );
}
function ProductDetailSkeleton() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            <div className="border-b border-neutral-base-100 bg-neutral-base-50/50 py-4">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
            <section className="py-12 md:py-20 lg:py-24">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                        <div className="lg:col-span-7">
                            <Skeleton className="aspect-4/5 w-full rounded-3xl" />
                        </div>
                        <div className="lg:col-span-5 space-y-8">
                            <div className="space-y-4">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-8 w-48" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-6 w-24" />
                                <div className="flex gap-3">
                                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-12 rounded-full" />)}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-6 w-24" />
                                <div className="flex gap-3">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-20 rounded-xl" />)}
                                </div>
                            </div>
                            <Skeleton className="h-16 w-full rounded-2xl" />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
