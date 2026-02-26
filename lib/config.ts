/**
 * Global Configuration for Enome API
 * Centralizing hardcoded values for easier maintenance.
 */

export const CONFIG = {
    // API & Service Identifiers
    SERVICE_NAME: "enome-api",
    MASTER_PASSWORD: process.env.NEXT_PUBLIC_MASTER_PASSWORD || "",

    // Database & Business Logic Defaults
    DEFAULT_KATEGORI_CUSTOMER_ID: 4, // Retail / Harga Jual
    DEFAULT_ORIGIN_CITY: "115",      // Default: Kota Bekasi
    RAJAONGKIR_KEY_VAR: "RAJAONGKIR_APP_KEY",
    DEFAULT_COMPANY_PROFILE_ID: 1,
    PACKING_FEE: 2000,

    // Pagination Defaults
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 10,
    },

    // Log Rotation Settings
    LOGS: {
        MAX_SIZE: "20m",
        MAX_FILES: "14d",
        DATE_PATTERN: "YYYY-MM-DD",
        ZIP_ARCHIVE: true,
    },

    // Price Column Mappings for Customer Categories
    PRICE_COLUMNS: {
        1: "hargaDistributor",
        2: "hargaAgen",
        3: "hargaReseller",
        4: "hargaJual",
        5: "harga_super_gold",
        6: "harga_sub_agen",
        7: "harga_marketer",
    } as Record<number, string>,

    // Order Status Configurations
    ORDER_STATUS: {
        EXCLUDED: ["PROSES PRODUKSI"],
        TABS: [
            { id: "OPEN", label: "Belum Bayar", dbStatus: "OPEN" },
            { id: "PROSES", label: "Dikemas", dbStatus: "PROSES PACKING" },
            { id: "KIRIM", label: "Dikirim", dbStatus: "PESANAN DIKIRIM" },
            { id: "SELESAI", label: "Selesai", dbStatus: "CLOSE" },
            { id: "BATAL", label: "Batal", dbStatus: "BATAL" },
        ],
        STYLES: {
            "OPEN": { label: "Belum Bayar", color: "text-amber-600", bg: "bg-amber-50" },
            "BAYAR": { label: "Dibayar", color: "text-emerald-600", bg: "bg-emerald-50" },
            "PROSES PACKING": { label: "Dikemas", color: "text-blue-600", bg: "bg-blue-50" },
            "PESANAN DIPROSES": { label: "Dikemas", color: "text-blue-600", bg: "bg-blue-50" },
            "PROSES PRODUKSI": { label: "Dikemas", color: "text-blue-600", bg: "bg-blue-50" },
            "PRODUKSI SELESAI": { label: "Dikemas", color: "text-blue-600", bg: "bg-blue-50" },
            "PESANAN DIKIRIM": { label: "Dikirim", color: "text-indigo-600", bg: "bg-indigo-50" },
            "CLOSE": { label: "Selesai", color: "text-emerald-600", bg: "bg-emerald-50" },
            "BATAL": { label: "Batal", color: "text-rose-600", bg: "bg-rose-50" },
        } as Record<string, { label: string, color: string, bg: string }>,
    },

    // Order History Settings
    ORDER_HISTORY: {
        PAGINATION_LIMIT: 5,
        DATE_PRESETS: [
            { id: "today", label: "Hari Ini" },
            { id: "yesterday", label: "Kemarin" },
            { id: "7days", label: "7 Hari Terakhir" },
            { id: "3months", label: "3 Bulan Terakhir" },
        ],
    },
};

export default CONFIG;
