import { Suspense } from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { ProductService } from "@/lib/services/product-service";
import { CategoryService } from "@/lib/services/category-service";
import { CustomerService } from "@/lib/services/customer-service";
import { queryKeys } from "@/lib/query-keys";
import { eq } from "drizzle-orm";
import { produk } from "@/lib/db/schema";
import { getSession } from "@/lib/auth-utils";
import CONFIG from "@/lib/config";
import ProductsClient from "@/components/store/product/ProductsClient";
import ProductListSkeleton from "@/components/store/product/ProductListSkeleton";

export default async function ProductsPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const queryClient = new QueryClient();

    // 1. Get User Session & Category for Price Calculation
    const session = await getSession();
    const kategoriId = session?.user?.id 
        ? await CustomerService.getKategoriId(session.user.id)
        : CONFIG.DEFAULT_KATEGORI_CUSTOMER_ID;

    // 2. Parse Filters from URL
    const filters = {
        collection: typeof searchParams.category === "string" ? searchParams.category.split(",") : [],
        size: typeof searchParams.size === "string" ? searchParams.size.split(",") : [],
        color: typeof searchParams.color === "string" ? searchParams.color.split(",") : [],
        brand: typeof searchParams.brand === "string" ? searchParams.brand.split(",") : [],
        gender: typeof searchParams.gender === "string" ? searchParams.gender.split(",") : [],
        price: typeof searchParams.price === "string" ? searchParams.price.split(",") : [],
        search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    };

    // 3. Prefetch Data in Parallel
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: [...queryKeys.products.all, filters],
            queryFn: () => ProductService.getProducts({
                kategoriId,
                categories: filters.collection,
                sizes: filters.size,
                colors: filters.color,
                brand: filters.brand,
                gender: filters.gender,
                priceRanges: filters.price,
                search: filters.search,
                limit: 100,
                where: eq(produk.isOnline, 1),
            }),
        }),
        queryClient.prefetchQuery({
            queryKey: [...queryKeys.categories.all, { brand: filters.brand, gender: filters.gender }, undefined],
            queryFn: () => CategoryService.getCategories({
                brand: filters.brand,
                gender: filters.gender,
            }),
        }),
        queryClient.prefetchQuery({
            queryKey: queryKeys.colors.all,
            queryFn: () => ProductService.getColors(),
        }),
        queryClient.prefetchQuery({
            queryKey: queryKeys.sizes.all,
            queryFn: () => ProductService.getSizes(),
        }),
    ]);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<ProductListSkeleton />}>
                <ProductsClient />
            </Suspense>
        </HydrationBoundary>
    );
}

