"use client";

import { use, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/store/layout/Navbar";
import Footer from "@/components/store/layout/Footer";
import ProductGallery from "@/components/store/product/ProductGallery";
import ProductInfo from "@/components/store/product/ProductInfo";
import ProductCard from "@/components/store/product/ProductCard";
import { useProduct } from "@/hooks/use-products";
import { ASSET_URL } from "@/config/config";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Breadcrumb from "@/components/store/shared/Breadcrumb";
import Link from "next/link";
import FallbackImage from "@/components/store/shared/FallbackImage";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { notFound } from "next/navigation";

export default function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const { data: productData, isLoading, error } = useProduct(params.id);

    if (isLoading) {
        return <ProductDetailSkeleton />;
    }

    if (error || !productData) {
        notFound();
    }

    return <ProductDetailContent productData={productData} />;
}

function ProductDetailContent({ productData }: { productData: any }) {
    const { product, stats, variants, images, relatedProducts } = productData;

    // Deferred Initial Selection: Start with no color selected
    const [selectedColor, setSelectedColor] = useState("");

    const formatPriceRange = (min: any, max: any) => {
        const nMin = parseInt(min);
        const nMax = parseInt(max);
        if (!nMax || nMin === nMax) return formatCurrency(nMin);
        return `${formatCurrency(nMin)} - ${formatCurrency(nMax)}`;
    };

    // Map images to full URLs
    let galleryImages: string[] = [];

    if (selectedColor === "") {
        // Initial state: Top image from produk_utama, others from produk
        galleryImages = [
            `${ASSET_URL}/img/produk_utama/${images[0]}`,
            ...images.slice(1).map((img: string) => `${ASSET_URL}/img/produk/${img}`)
        ];
    } else {
        // Color selected: Everything from produk, with color-specific image prioritized
        const colorObj = variants.colors.find((c: any) => c.name === selectedColor);
        const colorImage = colorObj?.image;

        let processedImages = [...images];
        if (colorImage && processedImages.includes(colorImage)) {
            processedImages = [colorImage, ...processedImages.filter(img => img !== colorImage)];
        }
        galleryImages = processedImages.map((img: string) => `${ASSET_URL}/img/produk/${img}`);
    }

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
        types: variants.types, // <-- Added variant types
        collection: product.kategori,
        detail: product.detail,
        totalStock: stats.totalStock,
        matrix: variants.matrix,
        commission: stats.hasCommission ? formatPriceRange(stats.commissionMin, stats.commissionMax) : undefined,
        hasCommission: stats.hasCommission,
        isOnFlashSale: stats.isOnFlashSale,
        flashSaleEndTime: stats.flashSaleEndTime,
        jenisProduk: product.jenisProduk,
        jenisBahan: product.jenisBahan,
        isFuring: product.isFuring,
        berat: variants.berat,
    };

    return (
        <TooltipProvider>
            <main className="min-h-screen bg-white overflow-x-hidden">
                <Navbar />

                {/* Sticky Breadcrumbs Section */}
                <div className="sticky top-[70px] md:top-[80px] z-30 bg-white/95 backdrop-blur-md border-b border-neutral-base-100">
                    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-4 overflow-x-auto scrollbar-hide">
                        <Breadcrumb
                            items={[
                                { label: "Beranda", href: "/" },
                                { label: "Product", href: "/products" },
                                { label: product.namaProduk }
                            ]}
                        />
                    </div>
                </div>

                <section className="py-8 md:py-16">
                    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12 lg:gap-16 items-start">

                            {/* Left Side - Image Gallery (Top Image) */}
                            <div className="lg:col-span-7 min-w-0">
                                <ProductGallery
                                    images={galleryImages.slice(0, 1)}
                                    isSoldOut={parseInt(stats.totalStock) === 0}
                                    isOnFlashSale={stats.isOnFlashSale}
                                />
                            </div>

                            {/* Right Side - Product Info */}
                            <div className="lg:col-span-5 min-w-0 lg:sticky lg:top-36">
                                <ProductInfo
                                    product={{ ...infoProduct, id: product.produkId } as any}
                                    selectedColor={selectedColor}
                                    setSelectedColor={setSelectedColor}
                                />
                            </div>

                        </div>

                        {/* Remaining Images Section - Dynamic Masonry Grid */}
                        {galleryImages.length > 1 && (
                            <div className="mt-8 md:mt-16">
                                <motion.div
                                    initial="hidden"
                                    whileInView="show"
                                    viewport={{ once: true, margin: "-100px" }}
                                    variants={{
                                        hidden: { opacity: 0 },
                                        show: {
                                            opacity: 1,
                                            transition: {
                                                staggerChildren: 0.15
                                            }
                                        }
                                    }}
                                    className="columns-1 md:columns-2 gap-4 md:gap-8 space-y-4 md:space-y-8"
                                >
                                    {galleryImages.slice(1).map((img: string, idx: number) => {
                                        // Varied heights/ratios for a true dynamic masonry look
                                        const ratios = ["aspect-[4/5]", "aspect-[3/4]", "aspect-[2/3]", "aspect-[3/5]"];
                                        const ratioClass = ratios[idx % ratios.length];

                                        return (
                                            <motion.div
                                                key={idx}
                                                variants={{
                                                    hidden: { opacity: 0, y: 30 },
                                                    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
                                                }}
                                                className={`relative bg-neutral-base-50 overflow-hidden break-inside-avoid group shadow-sm hover:shadow-2xl transition-all duration-700 rounded-lg ${ratioClass}`}
                                            >
                                                <FallbackImage
                                                    src={img}
                                                    alt={`Product detail image ${idx + 2}`}
                                                    width={2000}
                                                    height={3000}
                                                    quality={100}
                                                    unoptimized={true}
                                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                    sizes="(max-width: 768px) 100vw, 50vw"
                                                    style={{ imageRendering: "high-quality" } as any}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            </div>
                        )}
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
            <div className="sticky top-[70px] md:top-[80px] z-30 bg-white/95 backdrop-blur-md border-b border-neutral-base-100 py-4">
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
