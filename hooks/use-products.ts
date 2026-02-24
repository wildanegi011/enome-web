import { useQuery } from "@tanstack/react-query";

export interface Category {
    kategoriId: number;
    kategori: string;
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
    minPrice: string | null; // Added minPrice as string because aggregators return strings in many drivers
    colors: string | null;
    totalStock?: number | null;
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
        matrix: { color: string; size: string; stock: number; price: string; image: string | null }[];
    };
    images: string[];
    relatedProducts: any[]; // Can be refined later with a proper Product-like interface
}

export function useNewArrivals() {
    return useQuery<Product[]>({
        queryKey: ["products", "new-arrivals"],
        queryFn: async () => {
            const response = await fetch("/api/products/new-arrivals");
            if (!response.ok) throw new Error("Failed to fetch new arrivals");
            return response.json();
        },
    });
}

export function useProduct(id: string) {
    return useQuery<ProductDetailResponse>({
        queryKey: ["product", id],
        queryFn: async () => {
            const response = await fetch(`/api/products/${id}`);
            if (!response.ok) throw new Error("Failed to fetch product");
            return response.json();
        },
        enabled: !!id,
    });
}

export function useCategories() {
    return useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => {
            const response = await fetch("/api/categories");
            if (!response.ok) throw new Error("Failed to fetch categories");
            return response.json();
        },
    });
}

export function useProducts() {
    return useQuery<Product[]>({
        queryKey: ["products"],
        queryFn: async () => {
            const response = await fetch("/api/products");
            if (!response.ok) throw new Error("Failed to fetch products");
            return response.json();
        },
    });
}
