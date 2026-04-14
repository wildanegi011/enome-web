import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { productApi, Product, ProductDetailResponse, Category, Color, Size, ProductListResponse } from "@/lib/api/product-api";
import { queryKeys } from "@/lib/query-keys";

export type { Product, ProductDetailResponse, Category, Color, Size };

export function useNewArrivals() {
    return useQuery<Product[]>({
        queryKey: queryKeys.products.newArrivals,
        queryFn: productApi.getNewArrivals,
    });
}

export function useHighlights() {
    return useQuery<Product[]>({
        queryKey: queryKeys.products.highlights,
        queryFn: productApi.getHighlights,
    });
}

export function useProduct(id: string) {
    return useQuery<ProductDetailResponse>({
        queryKey: queryKeys.products.detail(id),
        queryFn: () => productApi.getById(id),
        enabled: !!id,
        staleTime: 2 * 60 * 1000, // Cache 2 menit
    });
}

export function useCategories(filters?: { brand?: string[], gender?: string[] }, limit?: number) {
    return useQuery<Category[]>({
        queryKey: [...queryKeys.categories.all, filters, limit],
        queryFn: () => productApi.getCategories(filters, limit),
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 menit
        gcTime: 30 * 60 * 1000,   // 30 menit
    });
}

export function useColors() {
    return useQuery<Color[]>({
        queryKey: queryKeys.colors.all,
        queryFn: productApi.getColors,
        staleTime: 60 * 60 * 1000, // 1 jam
        gcTime: 24 * 60 * 60 * 1000, // 24 jam
    });
}

export function useSizes() {
    return useQuery<Size[]>({
        queryKey: queryKeys.sizes.all,
        queryFn: productApi.getSizes,
        staleTime: 60 * 60 * 1000, // 1 jam
        gcTime: 24 * 60 * 60 * 1000, // 24 jam
    });
}

export function useProducts(filters?: any, options?: any) {
    return useQuery<ProductListResponse>({
        queryKey: [...queryKeys.products.all, filters],
        queryFn: () => productApi.getAll(filters),
        placeholderData: keepPreviousData,
        staleTime: 2 * 60 * 1000, // 2 menit
        ...options
    });
}
