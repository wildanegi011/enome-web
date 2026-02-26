import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keranjang, customer, customerKategori, produk, produkDetail, flashSale, flashSaleDetail, user } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";
import fs from "fs";
import path from "path";
import logger from "@/lib/logger";
import { CONFIG } from "@/lib/config";
import { getJakartaDate, nowJakartaYYMMDD, nowJakartaDate, nowJakartaFull } from "@/lib/date-utils";

/**
 * Handler untuk menambahkan produk ke keranjang belanja.
 * Alur:
 * 1. Cek sesi user.
 * 2. Cek kategori customer untuk penentuan harga.
 * 3. Validasi keberadaan produk dan stok varian (warna/size).
 * 4. Cek apakah produk sedang Flash Sale atau Pre-Order.
 * 5. Cek apakah item yang sama sudah ada di keranjang untuk update Qty.
 * 6. Jika belum ada, insert record baru.
 * 7. Logging aktivitas ke file log legacy (untuk sinkronisasi PHP) dan Winston.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            logger.warn("Cart Add: Unauthorized attempt");
            return NextResponse.json({ message: "login" });
        }

        const body = await request.json();
        const { id_produk, color_sylla, size_sylla, qty_produk, data_pre_order_id } = body;

        const userId = session.user.id;
        logger.info("Cart Add: Request received", { userId, id_produk, qty_produk });

        // 1. Ambil kategori customer untuk level harga
        const customerData = await db.select()
            .from(customer)
            .where(eq(customer.userId, userId))
            .limit(1);

        let kategoriId = CONFIG.DEFAULT_KATEGORI_CUSTOMER_ID;
        if (customerData.length > 0) {
            kategoriId = customerData[0].kategoriCustomerId || CONFIG.DEFAULT_KATEGORI_CUSTOMER_ID;
        }

        // Jalankan seluruh logika penambahan ke keranjang dalam satu transaksi database
        // untuk menjamin konsistensi data (Double Check STOCK & ONLINE)
        const result = await db.transaction(async (tx) => {
            // 2. Map kategori ke kolom harga database menggunakan CONFIG
            const priceColumnName = CONFIG.PRICE_COLUMNS[kategoriId] || CONFIG.PRICE_COLUMNS[CONFIG.DEFAULT_KATEGORI_CUSTOMER_ID];

            // 3. RE-CHECK: Pastikan produk tersedia secara online (Fresh Fetch + LOCK)
            const [freshProductRows]: any = await tx.execute(sql`
                SELECT produk_id as produkId, is_online as isOnline 
                FROM produk 
                WHERE produk_id = ${id_produk} AND is_online = 1 
                FOR UPDATE
            `);
            const freshProduct = freshProductRows[0];

            if (!freshProduct) {
                return { error: "not_available", detail: "Produk sudah tidak tersedia atau offline." };
            }

            // RE-CHECK: Ambil detail spesifik varian (warna & size) dari transaksi (LOCK)
            const [freshDetailRows]: any = await tx.execute(sql`
                SELECT 
                    stok_normal as stokNormal, 
                    harga_distributor as hargaDistributor,
                    harga_agen as hargaAgen,
                    harga_reseller as hargaReseller,
                    harga_jual as hargaJual,
                    harga_super_gold,
                    harga_sub_agen,
                    harga_marketer
                FROM produkdetail 
                WHERE produk_id = ${id_produk} AND warna = ${color_sylla} AND size = ${size_sylla} 
                FOR UPDATE
            `);
            const freshDetail = freshDetailRows[0];

            if (!freshDetail) {
                return { error: "not_available", detail: "Varian produk (warna/ukuran) tidak ditemukan." };
            }

            // Validasi ketersediaan stok terbaru
            const requestedQty = parseInt(qty_produk || "1");
            if ((freshDetail.stokNormal || 0) < requestedQty) {
                return { error: "stok_empty", detail: `Stok produk tidak mencukupi (Sisa: ${freshDetail.stokNormal || 0}).` };
            }

            // 4. Cek apakah produk sedang dalam periode Flash Sale aktif
            const now = getJakartaDate();
            // Flash sale data biasanya statis/periodik, tidak perlu FOR UPDATE 
            // kecuali jika stok flash sale dikelola secara terpisah.
            const activeFlashSale = await tx.select({
                flashSaleId: flashSale.id,
                waktuSelesai: flashSale.waktuSelesai,
                diskonFlashSale: customerKategori.diskonFlashSale
            })
                .from(flashSale)
                .innerJoin(flashSaleDetail, eq(flashSale.id, flashSaleDetail.flashSaleId))
                .innerJoin(customerKategori, eq(customerKategori.id, kategoriId))
                .where(and(
                    eq(flashSale.isAktif, 1),
                    eq(flashSaleDetail.produkId, id_produk),
                    sql`${now} BETWEEN ${flashSale.waktuMulai} AND ${flashSale.waktuSelesai}`,
                    sql`${flashSale.customerKategoriId} LIKE ${"%" + kategoriId + "%"}`
                ))
                .limit(1);

            const isFlashSale = activeFlashSale.length > 0;
            const isPreOrder = false;

            // 5. Kalkulasi harga akhir (freshDetail.stok_normal uses snake_case in raw execute)
            let basePrice = Number(freshDetail[priceColumnName as keyof typeof freshDetail] || freshDetail.harga_jual);
            let finalPrice = basePrice;

            if (isFlashSale) {
                const discount = parseInt(activeFlashSale[0].diskonFlashSale || "0");
                finalPrice = basePrice - (basePrice * (discount / 100));
            }

            // 6. Cek apakah item yang persis sama sudah ada di keranjang (LOCK)
            const [existingCartRows]: any = await tx.execute(sql`
                SELECT 
                    id, 
                    qty_produk as qtyProduk, 
                    harga_poduk as hargaPoduk 
                FROM keranjang 
                WHERE cust_id = ${userId} 
                AND produk_id = ${id_produk} 
                AND warna = ${color_sylla} 
                AND size = ${size_sylla} 
                AND is_deleted = 0 
                AND is_flashsale = ${isFlashSale ? 1 : 0} 
                AND is_preorder = ${isPreOrder ? 1 : 0} 
                AND harga_poduk = ${Math.floor(finalPrice)} 
                FOR UPDATE
            `);
            const existingCart = existingCartRows[0];

            if (existingCart) {
                const currentCartQty = existingCart.qtyProduk || 0;
                const newQty = currentCartQty + requestedQty;

                if ((freshDetail.stokNormal || 0) < newQty) {
                    return { error: "stok_empty", detail: "Stok tidak mencukupi untuk penambahan ini" };
                }

                await tx.update(keranjang)
                    .set({ qtyProduk: newQty, updatedAt: now })
                    .where(eq(keranjang.id, existingCart.id));
            } else {
                await tx.insert(keranjang).values({
                    custId: userId,
                    produkId: id_produk,
                    warna: color_sylla,
                    size: size_sylla,
                    qtyProduk: requestedQty,
                    hargaPoduk: Math.floor(finalPrice),
                    gambarProduk: freshDetail.gambar || freshProduct.gambar,
                    isFlashsale: isFlashSale ? 1 : 0,
                    flashsaleId: isFlashSale ? String(activeFlashSale[0].flashSaleId) : null,
                    flashsaleExpired: isFlashSale ? activeFlashSale[0].waktuSelesai : null,
                    isPreorder: 0,
                    preorderId: null,
                    createdAt: now,
                    status: 0,
                    tipeDiskon: "allin",
                    keterangan: ""
                });
            }

            return { success: true };
        });

        if (result.error) {
            logger.warn("Cart Add: Validation failed in transaction", { userId, ...result });
            return NextResponse.json({ message: result.error, detail: result.detail });
        }

        // 7. Ambil total item terbaru di keranjang untuk dikirim ke frontend
        const cartCount = await db.select({ total: sql<number>`count(*)` })
            .from(keranjang)
            .where(and(eq(keranjang.custId, userId), eq(keranjang.isDeleted, 0)));

        const totalItems = Number(cartCount[0]?.total || 0);

        // SYNC LOGGING: Menulis log aktivitas manual ke file teks khusus (Legacy Yii2 behavior)
        const logDate = nowJakartaYYMMDD().slice(0, 4); // YYMM
        const nowFull = nowJakartaFull();
        const logContent = `==================================================================================================================== \n` +
            `Scc [${nowFull}][${userId}]: activity : ${session.user.name} Menambahkan ${id_produk} - ${color_sylla} - ${size_sylla} ke dalam keranjang [nextjs] \n` +
            `Scc [${nowFull}][${userId}]: activity_description : ${session.user.name} Menambahkan ${id_produk} - ${color_sylla} - ${size_sylla} ke dalam keranjang [nextjs] \n` +
            `Scc [${nowFull}][${userId}]: created_by : ${userId} \n`;

        try {
            const logDir = "/var/www/html/enome/frontend/web/theme/log";
            if (fs.existsSync(logDir)) {
                const logFilePath = path.join(logDir, `log_activity_scc${logDate}.txt`);
                fs.appendFileSync(logFilePath, logContent);
            }
        } catch (logErr: any) {
            logger.error("Cart Add: Legacy log write failure", { error: logErr.message });
        }

        logger.info("Cart Add: Success", { userId, totalInCart: totalItems });
        return NextResponse.json({
            message: "success",
            totalinlove: totalItems
        });

    } catch (error: any) {
        logger.error("API Error: /api/cart/add", { error: error.message });
        return NextResponse.json({ message: "error", error: error.message }, { status: 500 });
    }
}


