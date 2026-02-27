import { db } from "@/lib/db";
import { customerAlamat, wallet, provinsi, kota, kecamatan } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export class UserService {
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
            label: addr.label || "Alamat",
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
}
