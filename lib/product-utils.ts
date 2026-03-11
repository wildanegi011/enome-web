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
            m.colorId === colorId &&
            m.size === size &&
            (m.variant || "") === (variant || "")
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
            const variantMatch =
                !variant ||
                (item.variant || "") === (variant || "") ||
                item.keterangan?.includes(variant);
            return (
                item.produkId === productId &&
                String(item.warna) === String(colorId) &&
                item.size === size &&
                variantMatch
            );
        })
        .reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

/**
 * Hitung stok tersedia untuk ukuran tertentu.
 * Stok = stok matrix - qty yang sudah di keranjang.
 */
export function getStockForSize(
    matrix: MatrixEntry[],
    cartItems: CartItem[],
    productId: string,
    colorId: string,
    size: string,
    variant: string
): number {
    const entry = findMatrixCombination(matrix, colorId, size, variant);
    const rawStock = entry?.stock ?? 0;
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
    const matchingMatrices = matrix.filter((m) => m.colorId === colorId);
    return matchingMatrices.some(
        (m) =>
            (!m.variant ||
                !selectedVariant ||
                m.variant === selectedVariant ||
                m.variant.includes(selectedVariant) ||
                selectedVariant.includes(m.variant)) &&
            m.stock > 0
    );
}
