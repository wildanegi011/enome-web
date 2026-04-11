import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Metadata } from "next";

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await props.params;

    // Use default category for metadata/SEO to avoid session dependency
    const kategoriId = CONFIG.DEFAULT_KATEGORI_CUSTOMER_ID;
    const productData = await ProductService.getProductDetail(id, kategoriId);

    if (!productData) {
        return {
            title: "Produk Tidak Ditemukan",
        };
    }

    // Fetch central description as fallback
    const centralDescription = await ConfigService.get("META_DESCRIPTION", siteConfig.description);
    const productDescription = (productData.product.deskripsi && productData.product.deskripsi !== "-")
        ? productData.product.deskripsi
        : centralDescription;

    const title = productData.product.namaProduk;

    return {
        title: title,
        description: productDescription,
        // Explicitly set metadata for various platforms
        other: {
            title: title,
        },
        openGraph: {
            title: title,
            description: productDescription,
            images: productData.product.gambar ? [`${ASSET_URL}/img/produk/${productData.product.gambar}`] : [],
        },
        twitter: {
            card: "summary_large_image",
            title: title,
            description: productDescription,
            images: productData.product.gambar ? [`${ASSET_URL}/img/produk/${productData.product.gambar}`] : [],
        }
    };
}

import { getSession } from "@/lib/auth-utils";
import { queryKeys } from "@/lib/query-keys";
import { ProductService } from "@/lib/services/product-service";
import { CustomerService } from "@/lib/services/customer-service";
import Navbar from "@/components/store/layout/Navbar";
import ProductDetailClient from "@/components/store/product/ProductDetailClient";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";
import { ConfigService } from "@/lib/services/config-service";
import { siteConfig } from "@/lib/site-config";
import { ASSET_URL } from "@/config/config";
import CONFIG from "@/lib/config";

export const revalidate = 3600; // Cache for 1 hour

/* 
export async function generateStaticParams() {
    const { data } = await ProductService.getProducts({
        kategoriId: 1, // Default category
        limit: 50,
        page: 1,
    });

    return data.map((p: any) => ({
        id: p.produkId,
    }));
}
*/

export default async function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;
    const session = await getSession();
    const queryClient = new QueryClient();

    const kategoriId = await CustomerService.getKategoriId(session?.user?.id);
    const productData = await ProductService.getProductDetail(id, kategoriId);

    const whatsappNomor = await ConfigService.get("whatsapp_nomor", "62895627727196"); // Fallback to provided number or empty

    if (!productData) {
        notFound();
    }

    await queryClient.prefetchQuery({
        queryKey: queryKeys.products.detail(id),
        queryFn: () => productData
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ProductDetailClient productData={productData} whatsappNomor={whatsappNomor} />
        </HydrationBoundary>
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

