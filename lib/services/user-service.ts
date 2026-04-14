import { db } from "@/lib/db";
import { user as userTable, customer, customerKategori, customerAlamat, wallet, provinsi, kota, kecamatan } from "@/lib/db/schema";
import { eq, desc, sql, and, or } from "drizzle-orm";
import { getJakartaDate } from "@/lib/date-utils";
import { CustomerService } from "./customer-service";

export class UserService {
    /**
     * Get custId from userId.
     */
    static async getCustId(userId: number | string): Promise<string | null> {
        return await CustomerService.getCustId(userId);
    }

    /**
     * Get customer addresses.
     */
    static async getAddresses(custId: string) {
        const legacyAddresses = await db.select({
            id: customerAlamat.id,
            customerId: customerAlamat.custId,
            name: customerAlamat.namaPenerima,
            address: customerAlamat.alamatLengkap,
            phone: customerAlamat.noHandphone,
            label: customerAlamat.labelAlamat,
            kelurahan: customerAlamat.kelurahan,
            kec: customerAlamat.kecamatan,
            kot: customerAlamat.kota,
            prov: customerAlamat.provinsi,
            kodePos: customerAlamat.kodePos,
            namaToko: customerAlamat.namaToko,
            isPrimary: customerAlamat.isPrimary,
            provName: provinsi.province,
            cityName: kota.cityName,
            districtName: kecamatan.subdistrictName
        })
            .from(customerAlamat)
            .leftJoin(provinsi, eq(customerAlamat.provinsi, provinsi.provinceId))
            .leftJoin(kota, eq(customerAlamat.kota, kota.cityId))
            .leftJoin(kecamatan, eq(customerAlamat.kecamatan, kecamatan.subdistrictId))
            .where(eq(customerAlamat.custId, custId))
            .orderBy(desc(customerAlamat.id));

        return legacyAddresses.map(addr => ({
            id: addr.id,
            label: addr.label === "Alamat Utama" && addr.isPrimary !== 1 ? "Alamat" : (addr.label || "Alamat"),
            receiverName: addr.name || "",
            phoneNumber: addr.phone || "",
            fullAddress: addr.address || "",
            city: addr.cityName || addr.kot || "",
            province: addr.provName || addr.prov || "",
            district: addr.districtName || addr.kec || "",
            cityId: addr.kot || "",
            provinceId: addr.prov || "",
            districtId: addr.kec || "",
            postalCode: addr.kodePos || "",
            shopName: addr.namaToko || "",
            isPrimary: addr.isPrimary,
            type: addr.isPrimary === 1 ? "Utama" : "Alamat Tersimpan"
        }));
    }

    /**
     * Get full user profile with customer category and primary address.
     */
    static async getFullProfile(userId: string) {
        const profileData = await db.select({
            id: userTable.id,
            username: userTable.username,
            email: userTable.email,
            nama: userTable.nama,
            kodeCustomer: customer.custId,
            namaTipeCustomer: customerKategori.namaTipeCustomer,
            namaToko: customerAlamat.namaToko,
            noHandphone: customerAlamat.noHandphone,
            gender: userTable.gender,
            brithdate: userTable.brithdate,
            photo: userTable.photo,
            urlphoto: userTable.urlphoto,
        })
            .from(userTable)
            .leftJoin(customer, eq(userTable.id, customer.userId))
            .leftJoin(customerKategori, eq(customer.kategoriCustomerId, customerKategori.id))
            .leftJoin(customerAlamat, and(
                eq(customer.custId, customerAlamat.custId),
                eq(customerAlamat.isPrimary, 1)
            ))
            .where(eq(userTable.id, Number(userId)))
            .limit(1);

        if (profileData.length === 0) return null;

        return {
            ...profileData[0],
            vouchers: [] // Placeholder for future voucher logic
        };
    }

    /**
     * Get wallet balance.
     */
    static async getWalletBalance(custId: string): Promise<number> {
        const [lastWallet]: any = await db.select()
            .from(wallet)
            .where(eq(wallet.custId, custId))
            .orderBy(desc(wallet.id))
            .limit(1);

        return lastWallet?.saldo || 0;
    }
    /**
     * Get wallet history with pagination.
     */
    static async getWalletHistory(custId: string, limit: number = 10, offset: number = 0) {
        const history = await db.select()
            .from(wallet)
            .where(eq(wallet.custId, custId))
            .orderBy(desc(wallet.id))
            .limit(limit)
            .offset(offset);

        const [totalCount]: any = await db.select({
            count: sql`count(*)`
        })
            .from(wallet)
            .where(eq(wallet.custId, custId));

        return {
            history,
            total: Number(totalCount?.count || 0)
        };
    }

    /**
     * Get order history with filters and pagination.
     */
    static async getOrders(userId: string | number, options: {
        page?: number,
        limit?: number,
        startDate?: string,
        endDate?: string,
        statusOrder?: string,
        statusTagihan?: string,
        search?: string,
        custId?: string | null
    }) {
        const {
            page = 1,
            limit = 10,
            startDate,
            endDate,
            statusOrder,
            statusTagihan,
            search,
            custId
        } = options;
        const offset = (page - 1) * limit;

        const { orders, statusOrder: statusOrderSchema } = await import("@/lib/db/schema");
        const { and, gte, lte, or, notInArray, desc, sql, inArray } = await import("drizzle-orm");
        const { CONFIG } = await import("@/lib/config");

        // Membangun kondisi WHERE secara dinamis
        const userCondition = custId
            ? or(eq(orders.userId, userId.toString()), eq(orders.userId, custId))
            : eq(orders.userId, userId.toString());

        const whereConditions = [
            userCondition as any,
            notInArray(orders.statusOrder, CONFIG.ORDER_STATUS.EXCLUDED),
            eq(orders.isDeleted, 0)
        ];

        if (startDate) whereConditions.push(gte(orders.tglOrder, sql`${startDate}`));
        if (endDate) whereConditions.push(lte(orders.tglOrder, sql`${endDate}`));
        if (statusOrder && statusOrder !== "ALL") whereConditions.push(eq(orders.statusOrder, statusOrder));
        if (statusTagihan && statusTagihan !== "ALL") whereConditions.push(eq(orders.statusTagihan, statusTagihan));
        
        if (search) {
            const searchPattern = `%${search}%`;
            whereConditions.push(or(
                sql`${orders.orderId} LIKE ${searchPattern}`,
                sql`EXISTS (
                    SELECT 1 FROM orderdetail od 
                    JOIN produk p ON od.produk_id = p.produk_id 
                    WHERE od.order_id = ${orders.orderId} 
                    AND p.nama_produk LIKE ${searchPattern}
                )`
            ));
        }

        const finalWhere = and(...whereConditions);

        const userOrders = await db.select({
            orderId: orders.orderId,
            tglOrder: orders.tglOrder,
            statusOrder: orders.statusOrder,
            statusTagihan: orders.statusTagihan,
            totalTagihan: orders.totalTagihan,
            metodebayar: orders.metodebayar,
            totalOrder: orders.totalOrder,
            updatedAt: orders.updatedAt,
            noResi: orders.noResi,
            ekspedisi: orders.ekspedisi,
            teleponPenerima: orders.teleponPenerima,
            firstItemName: sql<string>`(SELECT p.nama_produk FROM orderdetail od JOIN produk p ON od.produk_id = p.produk_id WHERE od.order_id = orders.order_id LIMIT 1)`,
            firstItemImage: sql<string>`(
                SELECT COALESCE(
                    (SELECT CONCAT('produk/', pi2.gambar) 
                     FROM produk_image pi2 
                     JOIN orderdetail od2 ON (pi2.produk_id = od2.produk_id)
                     LEFT JOIN warna w3 ON (pi2.warna = w3.warna OR pi2.warna = w3.warna_id)
                     WHERE od2.order_id = orders.order_id 
                       AND (pi2.warna = od2.warna OR w3.warna_id = od2.warna OR w3.warna = od2.warna)
                     ORDER BY pi2.id ASC
                     LIMIT 1),
                    (SELECT CONCAT('produk_utama/', p2.gambar)
                     FROM orderdetail od2
                     JOIN produk p2 ON od2.produk_id = p2.produk_id
                     WHERE od2.order_id = orders.order_id
                     LIMIT 1)
                )
            )`,
            firstItemSize: sql<string>`(SELECT od.ukuran FROM orderdetail od WHERE od.order_id = orders.order_id LIMIT 1)`,
            uniqueSizes: sql<string>`(SELECT GROUP_CONCAT(DISTINCT od.ukuran SEPARATOR ', ') FROM orderdetail od WHERE od.order_id = orders.order_id AND od.ukuran IS NOT NULL AND od.ukuran != '')`,
            sizeCount: sql<number>`(SELECT COUNT(DISTINCT od.ukuran) FROM orderdetail od WHERE od.order_id = orders.order_id AND od.ukuran IS NOT NULL AND od.ukuran != '')`,
            itemCount: sql<number>`(SELECT SUM(od.qty) FROM orderdetail od WHERE od.order_id = orders.order_id)`
        })
            .from(orders)
            .where(finalWhere)
            .orderBy(desc(orders.updatedAt))
            .limit(limit)
            .offset(offset);

        const [totalCount] = await db.select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(finalWhere);

        // Fetch status definitions for tabs
        const statusData = await db.select({
            value: statusOrderSchema.statusOrderId,
            label: statusOrderSchema.statusOrderEnduser
        }).from(statusOrderSchema);

        const tabs = [
            { label: "Semua", value: "ALL" },
            ...CONFIG.ORDER_STATUS.TABS.map(tab => ({
                label: tab.label,
                value: statusData.find(s => s.value === tab.dbStatus)?.value || tab.id
            }))
        ];

        return {
            orders: userOrders,
            total: totalCount?.count || 0,
            tabs
        };
    }

    /**
     * Internal helper to process wallet transactions (Debit/Kredit).
     */
    private static async processTransaction(
        custId: string,
        amount: number,
        type: "debit" | "kredit",
        description: string
    ) {
        const currentBalance = await this.getWalletBalance(custId);
        const newBalance = type === "debit" ? currentBalance + amount : currentBalance - amount;

        const now = getJakartaDate();
        return await db.insert(wallet).values({
            custId,
            debit: type === "debit" ? amount : 0,
            kredit: type === "kredit" ? amount : 0,
            saldo: newBalance,
            keterangan: description,
            createdAt: now,
            updatedAt: now,
        });
    }

    /**
     * Add wallet balance (Top-up).
     */
    static async addWalletBalance(custId: string, amount: number, description: string) {
        return await this.processTransaction(custId, amount, "debit", description);
    }

    /**
     * Deduct wallet balance (Payment).
     */
    static async deductWalletBalance(custId: string, amount: number, description: string) {
        return await this.processTransaction(custId, amount, "kredit", description);
    }

    /**
     * Add new address for a user.
     */
    static async addAddress(userId: string | number, data: any) {
        const customerData = await CustomerService.ensureCustomerData(
            userId,
            "Customer", // Placeholder if name is not available
            "" // Placeholder email
        );

        if (!customerData) throw new Error("Failed to provision customer record");

        const { isPrimary, ...addressInfo } = data;
        const custId = customerData.custId as string;

        if (isPrimary === 1) {
            await db.update(customerAlamat)
                .set({ isPrimary: 0 })
                .where(eq(customerAlamat.custId, custId));
        }

        const [result]: any = await db.insert(customerAlamat).values({
            custId,
            labelAlamat: addressInfo.labelAlamat || (isPrimary === 1 ? "Alamat Utama" : "Alamat"),
            namaPenerima: addressInfo.namaPenerima,
            namaToko: addressInfo.namaToko,
            alamatLengkap: addressInfo.alamatLengkap,
            noHandphone: addressInfo.noHandphone,
            provinsi: addressInfo.provinsi,
            kota: addressInfo.kota,
            kecamatan: addressInfo.kecamatan,
            kodePos: addressInfo.kodePos,
            isPrimary: isPrimary === 1 ? 1 : 0,
            createdBy: 1,
            createdAt: getJakartaDate(),
        });

        if (isPrimary === 1) {
            await this.syncPrimaryAddressToCustomer(custId, addressInfo);
        }

        return result.insertId;
    }

    /**
     * Update existing address.
     */
    static async updateAddress(addressId: number, data: any) {
        const { isPrimary, ...updates } = data;

        const addr = await db.select().from(customerAlamat).where(eq(customerAlamat.id, addressId)).limit(1);
        if (addr.length === 0) throw new Error("Address not found");

        const custId = addr[0].custId as string;

        if (isPrimary === 1) {
            await db.update(customerAlamat)
                .set({ 
                    isPrimary: 0,
                    labelAlamat: sql`CASE WHEN label_alamat = 'Alamat Utama' THEN 'Alamat' ELSE label_alamat END`
                })
                .where(and(
                    eq(customerAlamat.custId, custId),
                    or(
                        eq(customerAlamat.isPrimary, 1),
                        eq(customerAlamat.labelAlamat, "Alamat Utama")
                    )
                ));

            // Set new primary and only update label if it was previously "Alamat" or empty
            const targetAddr = await db.select().from(customerAlamat).where(eq(customerAlamat.id, addressId)).limit(1);
            const needsLabelUpdate = !targetAddr[0]?.labelAlamat || targetAddr[0]?.labelAlamat === "Alamat";

            await db.update(customerAlamat)
                .set({
                    isPrimary: 1,
                    ...(needsLabelUpdate && { labelAlamat: "Alamat Utama" })
                })
                .where(eq(customerAlamat.id, addressId));

            await this.syncPrimaryAddressToCustomer(custId, addr[0]);
        }

        if (Object.keys(updates).length > 0) {
            await db.update(customerAlamat).set(updates).where(eq(customerAlamat.id, addressId));
            
            // Re-sync if this was already primary
            const updatedAddr = await db.select().from(customerAlamat).where(eq(customerAlamat.id, addressId)).limit(1);
            if (updatedAddr[0].isPrimary === 1) {
                await this.syncPrimaryAddressToCustomer(custId, updatedAddr[0]);
            }
        }

        return true;
    }

    /**
     * Delete an address.
     */
    static async deleteAddress(addressId: number) {
        return await db.delete(customerAlamat).where(eq(customerAlamat.id, addressId));
    }

    /**
     * Update user profile data across multiple tables.
     */
    static async updateProfile(userId: string | number, data: any) {
        const {
            nama, gender, brithdate,
            noHandphone, namaToko, alamat,
            alamatLengkap, kecamatan, kota,
            provinsi, kodepos,
            photo, urlphoto
        } = data;

        // 1. Update User Table
        await db.update(userTable)
            .set({
                nama,
                gender: typeof gender === 'string' ? parseInt(gender) : gender,
                brithdate: brithdate ? new Date(brithdate) : null,
                photo,
                urlphoto,
                updatedAt: Math.floor(Date.now() / 1000)
            })
            .where(eq(userTable.id, Number(userId)));

        // 2. Update Customer Table
        await db.update(customer)
            .set({
                namaCustomer: nama,
                namaToko: namaToko || undefined,
                telp: noHandphone || undefined,
                alamat: alamat || undefined,
                alamatLengkap: alamatLengkap || undefined,
                kecamatan: kecamatan || undefined,
                kota: kota || undefined,
                provinsi: provinsi || undefined,
                kodepos: kodepos || undefined,
            })
            .where(eq(customer.userId, Number(userId)));

        // 3. Update Phone Number and Shop Name in Primary Customer Alamat
        const customerData = await db.select({ custId: customer.custId })
            .from(customer)
            .where(eq(customer.userId, Number(userId)))
            .limit(1);

        if (customerData.length > 0) {
            await db.update(customerAlamat)
                .set({
                    noHandphone: noHandphone || undefined,
                    namaToko: namaToko || undefined,
                    alamatLengkap: alamatLengkap || undefined,
                    kecamatan: kecamatan || undefined,
                    kota: kota || undefined,
                    provinsi: provinsi || undefined,
                    kodePos: kodepos || undefined,
                })
                .where(and(
                    eq(customerAlamat.custId, customerData[0].custId),
                    eq(customerAlamat.isPrimary, 1)
                ));
        }

        return true;
    }

    /**
     * Internal helper to sync primary address to customer table.
     */
    private static async syncPrimaryAddressToCustomer(custId: string, addressData: any) {
        return await db.update(customer).set({
            namaToko: addressData.namaToko || undefined,
            telp: addressData.noHandphone || typeof addressData.noHandphone === 'string' ? addressData.noHandphone : undefined,
            alamat: addressData.alamatLengkap || undefined,
            alamatLengkap: (addressData.alamatLengkap || "").substring(0, 50),
            kecamatan: addressData.kecamatan || undefined,
            kota: addressData.kota || undefined,
            provinsi: addressData.provinsi || undefined,
            kodepos: addressData.kodePos || addressData.kodepos || undefined,
        }).where(eq(customer.custId, custId));
    }
}
