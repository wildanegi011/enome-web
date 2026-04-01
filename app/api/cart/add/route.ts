import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keranjang, customer, customerKategori, produk, produkDetail, flashSale, flashSaleDetail, user, variant as variantTable } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth-utils";
import fs from "fs";
import path from "path";
import logger, { apiLogger } from "@/lib/logger";
import { CONFIG } from "@/lib/config";
import { getJakartaDate, nowJakartaYYMMDD, nowJakartaDate, nowJakartaFull } from "@/lib/date-utils";
import { ActivityService } from "@/lib/services/activity-service";

/**
 * Menambahkan produk ke keranjang belanja.
 * Alur: cek sesi → cek kategori harga → validasi produk & stok → cek flash sale → insert/update keranjang.
 *
 * @auth required
 * @method POST
 * @body {{ id_produk: string, color_sylla: string, size_sylla: string, qty_produk: number, data_pre_order_id?: string }}
 * @response 200 (success) — { message: "success", totalinlove: number }
 * @response 200 (login)   — { message: "login" }
 * @response 200 (error)   — { message: "not_available"|"stok_empty", detail: string }
 * @response 500 — { message: "error", error: "Terjadi kesalahan sistem" }
 */
export const POST = withAuth(async (request: NextRequest, context: any, session: any) => {
    try {
        const body = await request.json();
        const { id_produk, color_sylla, size_sylla, variant, qty_produk, data_pre_order_id } = body;

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
                SELECT produk_id as produkId, is_online as isOnline, gambar
                FROM produk 
                WHERE produk_id = ${id_produk} AND is_online = 1 
                FOR UPDATE
            `);
            const freshProduct = freshProductRows[0];

            if (!freshProduct) {
                return { error: "not_available", detail: "Produk sudah tidak tersedia atau offline." };
            }

            // Normalisasi color_sylla: selalu resolve ke warna_id
            // Ini penting agar data yang tersimpan di keranjang.warna selalu konsisten (warna_id, bukan nama warna)
            // sehingga query cek existing cart bisa match dengan benar dan tidak menyebabkan duplikasi
            const [warnaRows]: any = await tx.execute(sql`
                SELECT warna_id, warna FROM warna 
                WHERE warna_id = ${color_sylla} OR warna = ${color_sylla}
                LIMIT 1
            `);
            const colorId = warnaRows[0]?.warna_id || color_sylla;
            const colorName = warnaRows[0]?.warna || color_sylla;

            // RE-CHECK: Ambil detail spesifik varian (warna & size & variant) dari transaksi (LOCK)
            const [freshDetailRows]: any = await tx.execute(sql`
                SELECT 
                    pd.stok_normal as stokNormal, 
                    pd.harga_distributor as hargaDistributor,
                    pd.harga_agen as hargaAgen,
                    pd.harga_reseller as hargaReseller,
                    pd.harga_jual as hargaJual,
                    pd.harga_super_gold,
                    pd.harga_sub_agen,
                    pd.harga_marketer,
                    pd.gambar
                FROM produkdetail pd
                WHERE pd.produk_id = ${id_produk} 
                AND (pd.warna = ${colorId} OR pd.warna = ${color_sylla})
                AND pd.size = ${size_sylla} 
                AND (
                    pd.variant = ${variant} 
                    OR pd.variant LIKE ${"%" + (variant || "") + "%"}
                    OR ${variant || ""} LIKE CONCAT('%', pd.variant, '%')
                    OR (pd.variant IS NULL AND ${variant || ""} = "")
                    OR (pd.variant = "" AND ${variant || ""} = "")
                )
                ORDER BY pd.stok_normal DESC
                LIMIT 1
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

            // Jika frontend mengharapkan harga flash sale tapi ternyata sudah habis di backend
            if (body.is_flash_sale && !isFlashSale) {
                return { error: "flash_sale_ended", detail: "Mohon maaf, periode flash sale untuk produk ini baru saja berakhir." };
            }

            // 5. Kalkulasi harga akhir (freshDetail.stok_normal uses snake_case in raw execute)
            let basePrice = Number(freshDetail[priceColumnName as keyof typeof freshDetail] || freshDetail.hargaJual);
            let finalPrice = basePrice;

            if (isFlashSale) {
                const discount = parseInt(activeFlashSale[0].diskonFlashSale || "0");
                const retailPrice = Number(freshDetail.hargaJual || freshDetail.harga_jual || 0);
                finalPrice = retailPrice - (retailPrice * (discount / 100));
            }

            // Cek existing cart menggunakan normalizedColor (warna_id konsisten)
            // Juga tangani data lama yang mungkin tersimpan sebagai nama warna via JOIN warna
            // Gunakan TRIM untuk menghindari isu whitespace
            const [existingCartRows]: any = await tx.execute(sql`
                SELECT 
                    k.id, 
                    k.qty_produk as qtyProduk 
                FROM keranjang k
                LEFT JOIN warna w ON (k.warna = w.warna_id OR k.warna = w.warna)
                WHERE k.cust_id = ${userId} 
                AND k.produk_id = ${id_produk} 
                AND (
                    TRIM(k.warna) = ${colorName} 
                    OR TRIM(k.warna) = ${colorId} 
                    OR TRIM(w.warna) = ${colorName} 
                    OR TRIM(w.warna_id) = ${colorId}
                )
                AND TRIM(k.size) = ${size_sylla} 
                AND (
                    TRIM(k.variant) = ${variant} 
                    OR k.variant LIKE ${"%" + (variant || "") + "%"}
                    OR ${variant || ""} LIKE CONCAT('%', k.variant, '%')
                    OR (k.variant IS NULL AND ${variant || ""} = "")
                    OR (k.variant = "" AND ${variant || ""} = "")
                )
                AND k.is_deleted = 0 
                ORDER BY k.id DESC
                LIMIT 1
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
                    .set({ 
                        qtyProduk: newQty, 
                        hargaPoduk: Math.floor(finalPrice),
                        isFlashsale: isFlashSale ? 1 : 0,
                        flashsaleId: isFlashSale ? String(activeFlashSale[0].flashSaleId) : null,
                        flashsaleExpired: isFlashSale ? activeFlashSale[0].waktuSelesai : null,
                        updatedAt: now 
                    })
                    .where(eq(keranjang.id, existingCart.id));
            } else {
                await tx.insert(keranjang).values({
                    custId: userId,
                    produkId: id_produk,
                    warna: colorName, // Simpan Nama Warna sesuai kemauan user
                    size: size_sylla,
                    variant: variant || null,
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
            `Scc [${nowFull}][${userId}]: activity : ${session.user.name} Menambahkan ${id_produk} - ${variant || "No Variant"} - ${color_sylla} - ${size_sylla} ke dalam keranjang [nextjs] \n` +
            `Scc [${nowFull}][${userId}]: activity_description : ${session.user.name} Menambahkan ${id_produk} - ${variant || "No Variant"} - ${color_sylla} - ${size_sylla} ke dalam keranjang [nextjs] \n` +
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

        // NEW GLOBAL ACTIVITY LOGGING
        await ActivityService.log(
            "Add to Cart",
            `${session.user.name} Menambahkan ${id_produk} - ${variant || "No Variant"} - ${color_sylla} - ${size_sylla} ke dalam keranjang`,
            userId
        );

        logger.info("Cart Add: Success", { userId, totalInCart: totalItems });
        return NextResponse.json({
            message: "success",
            totalinlove: totalItems
        });

    } catch (error: any) {
        apiLogger.error(request, error, { route: "/api/cart/add" });
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});
