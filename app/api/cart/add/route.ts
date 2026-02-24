import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keranjang, customer, customerKategori, produk, produkDetail, flashSale, flashSaleDetail, user } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";
import fs from "fs";
import path from "path";
import logger from "@/lib/logger";
import { CONFIG } from "@/lib/config";

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

        // 2. Map kategori ke kolom harga database menggunakan CONFIG
        const priceColumnName = CONFIG.PRICE_COLUMNS[kategoriId] || CONFIG.PRICE_COLUMNS[CONFIG.DEFAULT_KATEGORI_CUSTOMER_ID];
        const priceColumn = (produkDetail as any)[priceColumnName] || sql.raw(priceColumnName);

        // 3. Pastikan produk tersedia secara online
        const productData = await db.select()
            .from(produk)
            .where(and(eq(produk.produkId, id_produk), eq(produk.isOnline, 1)))
            .limit(1);

        if (productData.length === 0) {
            logger.warn("Cart Add: Product not available", { id_produk });
            return NextResponse.json({ message: "not_available", error: "3" });
        }

        // Ambil detail spesifik varian (warna & size)
        const detail = await db.select()
            .from(produkDetail)
            .where(and(
                eq(produkDetail.produkId, id_produk),
                eq(produkDetail.warnaId, color_sylla),
                eq(produkDetail.size, size_sylla)
            ))
            .limit(1);

        if (detail.length === 0) {
            logger.warn("Cart Add: Variant not found", { id_produk, color_sylla, size_sylla });
            return NextResponse.json({ message: "stok_empty", error: "3" });
        }

        const currentDetail = detail[0];
        // Validasi ketersediaan stok
        if ((currentDetail.stokNormal || 0) < parseInt(qty_produk || "1")) {
            logger.warn("Cart Add: Insufficient stock", { id_produk, stock: currentDetail.stokNormal, requested: qty_produk });
            return NextResponse.json({ message: "stok_empty", error: "3" });
        }

        // 4. Cek apakah produk sedang dalam periode Flash Sale aktif
        const now = new Date();
        const activeFlashSale = await db.select({
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
        const isPreOrder = false; // Implementasi pre-order menyusul

        // 5. Kalkulasi harga akhir setelah diskon (jika flash sale)
        // Penentuan harga dasar menggunakan nama kolom dari mapping (fallbacks to hargaJual)
        let basePrice = Number(currentDetail[priceColumnName as keyof typeof currentDetail] || currentDetail.hargaJual);
        let finalPrice = basePrice;

        if (isFlashSale) {
            const discount = parseInt(activeFlashSale[0].diskonFlashSale || "0");
            finalPrice = basePrice - (basePrice * (discount / 100));
            logger.info("Cart Add: Flash Sale applied", { id_produk, discount });
        }

        // 6. Cek apakah item yang persis sama sudah ada di keranjang belanja
        const existingCart = await db.select()
            .from(keranjang)
            .where(and(
                eq(keranjang.custId, userId),
                eq(keranjang.produkId, id_produk),
                eq(keranjang.warna, color_sylla),
                eq(keranjang.size, size_sylla),
                eq(keranjang.isDeleted, 0),
                eq(keranjang.isFlashsale, isFlashSale ? 1 : 0),
                eq(keranjang.isPreorder, isPreOrder ? 1 : 0),
                eq(keranjang.hargaPoduk, Math.floor(finalPrice))
            ))
            .limit(1);

        if (existingCart.length > 0) {
            // Update jumlah (Qty) jika item sudah ada
            await db.update(keranjang)
                .set({
                    qtyProduk: (existingCart[0].qtyProduk || 0) + parseInt(qty_produk || "1"),
                    updatedAt: now
                })
                .where(eq(keranjang.id, existingCart[0].id));
            logger.info("Cart Add: Item quantity updated", { cartId: existingCart[0].id });
        } else {
            // Tambah baris baru jika item belum ada
            await db.insert(keranjang).values({
                custId: userId,
                produkId: id_produk,
                warna: color_sylla,
                size: size_sylla,
                qtyProduk: parseInt(qty_produk || "1"),
                hargaPoduk: Math.floor(finalPrice),
                gambarProduk: currentDetail.gambar || productData[0].gambar,
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
            logger.info("Cart Add: New item inserted");
        }

        // 7. Ambil total item terbaru di keranjang untuk dikirim ke frontend
        const cartCount = await db.select({ total: sql<number>`count(*)` })
            .from(keranjang)
            .where(and(eq(keranjang.custId, userId), eq(keranjang.isDeleted, 0)));

        const totalItems = Number(cartCount[0]?.total || 0);

        // SYNC LOGGING: Menulis log aktivitas manual ke file teks khusus (Legacy Yii2 behavior)
        const logDate = now.toISOString().slice(0, 7).replace('-', '');
        const logContent = `==================================================================================================================== \n` +
            `Scc [${now.toISOString().replace('T', ' ').slice(0, 19)}][${userId}]: activity : ${session.user.name} Menambahkan ${id_produk} - ${color_sylla} - ${size_sylla} ke dalam keranjang [nextjs] \n` +
            `Scc [${now.toISOString().replace('T', ' ').slice(0, 19)}][${userId}]: activity_description : ${session.user.name} Menambahkan ${id_produk} - ${color_sylla} - ${size_sylla} ke dalam keranjang [nextjs] \n` +
            `Scc [${now.toISOString().replace('T', ' ').slice(0, 19)}][${userId}]: created_by : ${userId} \n`;

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


