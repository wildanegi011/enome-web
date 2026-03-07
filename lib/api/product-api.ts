import { apiClient } from "./api-client";

export interface Category {
    kategoriId: number;
    kategori: string;
    gambarKategori?: string | null;
}

export interface Color {
    warnaId: string;
    warna: string;
    kodeWarna: string | null;
}

export interface Size {
    sizeId: number;
    size: string | null;
}

export interface Product {
    produkId: string;
    kategori: string;
    namaProduk: string;
    qtyStokNormal?: number | null;
    qtyStokRijek?: number | null;
    tglRilis: string | null;
    gambar: string | null;
    gambarSize?: string | null;
    deskripsi?: string | null;
    detail?: string | null;
    createdAt?: number | null;
    updatedAt?: number | null;
    isOnline: number;
    tglOnline?: string | null;
    isAktif: number;
    produkPreorder?: number;
    customerKategoriId?: string | null;
    customerPerson?: string | null;
    isHighlighted: number;
    highlightedAt?: string | null;
    highlightOrder?: number | null;
    minPrice: string | null;
    maxPrice: string | null;
    baseMinPrice: string | null;
    baseMaxPrice: string | null;
    finalMinPrice?: string | number | null;
    finalMaxPrice?: string | number | null;
    colors: string | null;
    totalStock?: number | null;
    isOnFlashSale?: boolean;
    isOnPreOrder?: boolean;
    hasCommission?: boolean;
    commissionMin?: string | number | null;
    commissionMax?: string | number | null;
    discountPercentage?: number;
    jenisProduk?: string | null;
    jenisBahan?: string | null;
    isFuring?: number | null;
}

export interface ProductDetailResponse {
    product: Product;
    stats: {
        minPrice: string;
        maxPrice: string;
        totalStock: string;
    };
    variants: {
        colors: { name: string; value: string; image: string | null; totalStock: number }[];
        sizes: string[];
        types: string[];
        matrix: { color: string; size: string; variant: string; stock: number; price: string; image: string | null }[];
        berat?: number | null;
    };
    images: string[];
    relatedProducts: any[];
}

export const productApi = {
    getAll: (filters?: any) => {
        let url = "/api/products";
        if (filters) {
            const params = new URLSearchParams();
            if (filters.collection?.length) params.append("categories", filters.collection.join(","));
            if (filters.price?.length) params.append("priceRanges", filters.price.join(","));
            if (filters.color?.length) params.append("colors", filters.color.join(","));
            if (filters.size?.length) params.append("sizes", filters.size.join(","));
            if (filters.search) params.append("search", filters.search);
            const qs = params.toString();
            if (qs) url += `?${qs}`;
        }
        return apiClient<Product[]>(url);
    },
    getNewArrivals: () => apiClient<Product[]>("/api/products/new-arrivals"),
    getHighlights: () => apiClient<Product[]>("/api/products/highlights"),
    getById: (id: string) => apiClient<ProductDetailResponse>(`/api/products/${id}`),
    getCategories: (limit?: number) => apiClient<Category[]>(`/api/categories${limit ? `?limit=${limit}` : ""}`),
    getColors: () => apiClient<Color[]>("/api/colors"),
    getSizes: () => apiClient<Size[]>("/api/sizes"),
};
