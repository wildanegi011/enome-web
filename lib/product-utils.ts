/**
 * Product Utilities
 *
 * Kumpulan fungsi pure untuk operasi terkait produk:
 * - Lookup matrix (kombinasi warna × ukuran × varian)
 * - Kalkulasi stok (termasuk yang sudah ada di keranjang)
 * - Resolusi harga dinamis
 * - Pengecekan ketersediaan warna per varian
 */

import { CartItem } from "@/lib/api/cart-api";
import { formatCurrency } from "@/lib/utils";

// ---- Types ----

/** Representasi satu warna produk */
export interface ProductColor {
    id: string;
    name: string;
    value: string;
    image: string | null;
    totalStock: number;
}

/** Satu baris di tabel matrix produk (kombinasi warna × ukuran × varian) */
export interface MatrixEntry {
    color: string;
    colorId: string;
    size: string;
    variant: string;
    stock: number;
    price: string;
    image: string | null;
}

// ---- Matrix / Stock Utilities ----

/**
 * Helper internal untuk pengecekan match variant yang robust.
 * Menangani case-insensitive, trim whitespace, dan partial match.
 */
function isVariantMatch(matrixVariant: string, targetVariant: string): boolean {
    const mv = (matrixVariant || "").trim().toLowerCase();
    const tv = (targetVariant || "").trim().toLowerCase();

    if (!tv) return true; // Jika target kosong, anggap match (untuk aggregat)
    return mv === tv || mv.includes(tv) || tv.includes(mv);
}

/**
 * Cari entry matrix yang cocok berdasarkan colorId, size, dan variant.
 * Digunakan untuk mendapatkan stok & harga dari kombinasi yang dipilih user.
 */
export function findMatrixCombination(
    matrix: MatrixEntry[],
    colorId: string,
    size: string,
    variant: string
): MatrixEntry | undefined {
    return matrix.find(
        (m) =>
            String(m.colorId) === String(colorId) &&
            String(m.size).trim().toLowerCase() === String(size).trim().toLowerCase() &&
            isVariantMatch(m.variant, variant)
    );
}

/**
 * Hitung jumlah qty yang sudah ada di keranjang untuk kombinasi tertentu.
 * Berguna untuk mengurangi stok yang "sudah dipesan" dari tampilan.
 */
export function getQtyInCartForVariant(
    cartItems: CartItem[],
    productId: string,
    colorId: string,
    size: string,
    variant: string
): number {
    return cartItems
        .filter((item) => {
            return (
                item.produkId === productId &&
                String(item.warna) === String(colorId) &&
                String(item.size).trim().toLowerCase() === String(size).trim().toLowerCase() &&
                isVariantMatch((item.variant || ""), variant)
            );
        })
        .reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

/**
 * Hitung stok tersedia untuk ukuran tertentu.
 * Stok = stok matrix (aggregat jika variant kosong) - qty yang sudah di keranjang.
 */
export function getStockForSize(
    matrix: MatrixEntry[],
    cartItems: CartItem[],
    productId: string,
    colorId: string,
    size: string,
    variant: string
): number {
    // Jika variant kosong, cari aggregat stok untuk kombinasi color + size di SEMUA variant
    const matchingEntries = matrix.filter(
        m => String(m.colorId) === String(colorId) && 
             String(m.size).trim().toLowerCase() === String(size).trim().toLowerCase() && 
             isVariantMatch(m.variant, variant)
    );
    const rawStock = matchingEntries.reduce((sum, m) => sum + m.stock, 0);

    const qtyInCart = getQtyInCartForVariant(cartItems, productId, colorId, size, variant);
    return Math.max(0, rawStock - qtyInCart);
}

/**
 * Resolusi harga tampil berdasarkan kombinasi matrix.
 * Jika kombinasi belum dipilih, fallback ke harga default produk.
 */
export function getSelectedPrice(
    combination: MatrixEntry | undefined,
    fallbackPrice: string
): string {
    return combination
        ? formatCurrency(parseInt(combination.price))
        : fallbackPrice;
}

/**
 * Cek apakah suatu warna punya stok untuk varian tertentu.
 * Digunakan untuk me-disable tombol warna yang sudah habis.
 */
export function isColorAvailableForVariant(
    matrix: MatrixEntry[],
    colorId: string,
    selectedVariant: string
): boolean {
    return matrix.some(
        (m) =>
            String(m.colorId) === String(colorId) &&
            isVariantMatch(m.variant, selectedVariant) &&
            m.stock > 0
    );
}
