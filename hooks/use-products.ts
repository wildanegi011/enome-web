import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { productApi, Product, ProductDetailResponse, Category, Color, Size } from "@/lib/api/product-api";
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
    });
}

export function useCategories(limit?: number) {
    return useQuery<Category[]>({
        queryKey: limit ? [...queryKeys.categories.all, limit] : queryKeys.categories.all,
        queryFn: () => productApi.getCategories(limit),
    });
}

export function useColors() {
    return useQuery<Color[]>({
        queryKey: queryKeys.colors.all,
        queryFn: productApi.getColors,
    });
}

export function useSizes() {
    return useQuery<Size[]>({
        queryKey: queryKeys.sizes.all,
        queryFn: productApi.getSizes,
    });
}

export function useProducts(filters?: any) {
    return useQuery<Product[]>({
        queryKey: [...queryKeys.products.all, filters],
        queryFn: () => productApi.getAll(filters),
        placeholderData: keepPreviousData,
    });
}
