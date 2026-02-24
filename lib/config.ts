/**
 * Global Configuration for Enome API
 * Centralizing hardcoded values for easier maintenance.
 */

export const CONFIG = {
    // API & Service Identifiers
    SERVICE_NAME: "enome-api",

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
};

export default CONFIG;
