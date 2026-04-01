import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getSession } from "@/lib/auth-utils";
import { queryKeys } from "@/lib/query-keys";
import { db } from "@/lib/db";
import { customer } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CONFIG } from "@/lib/config";
import { getJakartaDate } from "@/lib/date-utils";
import { ProductService } from "@/lib/services/product-service";
import { CustomerService } from "@/lib/services/customer-service";
import Navbar from "@/components/store/layout/Navbar";
import ProductDetailClient from "@/components/store/product/ProductDetailClient";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";
import { ConfigService } from "@/lib/services/config-service";

export default async function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
    const { id: encodedId } = await props.params;
    const id = decodeURIComponent(encodedId);
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

