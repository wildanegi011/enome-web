import { mysqlTable, serial, varchar, text, int, date, datetime, tinyint, smallint, timestamp, double, float, char } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const slide = mysqlTable("slide", {
    id: serial("id").primaryKey(),
    image: varchar("image", { length: 225 }),
    text: text("text"),
    kategori: varchar("kategori", { length: 50 }),
    publish: int("publish").default(0),
    grid: int("grid"),
    link: text("link"),
    isMobile: int("is_mobile").notNull().default(0),
    isDeleted: int("is_deleted").notNull().default(0),
});

export const produk = mysqlTable("produk", {
    produkId: varchar("produk_id", { length: 20 }).primaryKey(),
    kategori: varchar("kategori", { length: 50 }).notNull(),
    namaProduk: varchar("nama_produk", { length: 100 }).notNull(),
    qtyStokNormal: int("qtystok_normal").default(0),
    qtyStokRijek: int("qtystok_rijek").default(0),
    tglRilis: date("tgl_rilis"),
    gambar: varchar("gambar", { length: 255 }),
    gambarSize: varchar("gambar_size", { length: 255 }),
    deskripsi: text("deskripsi"),
    detail: text("detail"),
    createdAt: int("created_at"),
    updatedAt: int("updated_at"),
    isOnline: int("is_online").notNull().default(0),
    tglOnline: datetime("tgl_online"),
    isAktif: int("isaktif").notNull().default(0),
    produkPreorder: int("produk_preorder").notNull().default(0),
    customerKategoriId: text("customer_kategori_id"),
    customerPerson: text("customer_person"),
    isHighlighted: tinyint("is_highlighted").notNull().default(0),
    highlightedAt: datetime("highlighted_at"),
    highlightOrder: int("highlight_order"),
});

export const produkDetail = mysqlTable("produkdetail", {
    detailId: serial("detail_id").primaryKey(),
    produkId: varchar("produk_id", { length: 20 }).notNull(),
    size: varchar("size", { length: 20 }),
    warnaId: varchar("warna", { length: 20 }), // Actually refers to warna_id
    berat: int("berat"),
    hpp: int("hpp"),
    hargaDistributor: int("harga_distributor"),
    hargaAgen: int("harga_agen"),
    hargaReseller: int("harga_reseller"),
    hargaJual: int("harga_jual"),
    stokNormal: int("stok_normal").default(0),
    stokRijek: int("stok_rijek").default(0),
    line: int("line"),
    diskon: int("diskon"),
    gambar: varchar("gambar", { length: 255 }),
});

export const kategoriProduk = mysqlTable("kategoriproduk", {
    kategoriId: serial("kategori_id").primaryKey(),
    kategori: varchar("kategori", { length: 50 }).notNull(),
});

export const warna = mysqlTable("warna", {
    warnaId: varchar("warna_id", { length: 10 }).primaryKey(),
    warna: varchar("warna", { length: 50 }).notNull(),
    kodeWarna: varchar("kode_warna", { length: 50 }),
});

export const size = mysqlTable("size", {
    sizeId: serial("size_id").primaryKey(),
    size: varchar("size", { length: 20 }),
});

export const keranjangLove = mysqlTable("keranjang_love", {
    id: serial("id").primaryKey(),
    produkId: varchar("produk_id", { length: 20 }),
    warna: varchar("warna", { length: 20 }),
    size: varchar("size", { length: 20 }),
    qtyProduk: int("qty_produk"),
    hargaPoduk: int("harga_poduk"),
    gambarProduk: text("gambar_produk"),
    status: int("status"),
    custId: int("cust_id"),
    keterangan: text("keterangan"),
    itemDiskon: varchar("item_diskon", { length: 10 }),
    tipeDiskon: varchar("tipe_diskon", { length: 20 }),
    persenDiskon: double("persen_diskon"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
    createdBy: int("created_by"),
    updatedBy: int("updated_by"),
    isDeleted: int("is_deleted").default(0),
});

export const user = mysqlTable("user", {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    authKey: varchar("auth_key", { length: 32 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    passwordResetToken: varchar("password_reset_token", { length: 255 }).unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    status: smallint("status").notNull().default(10),
    role: smallint("role").notNull(),
    createdAt: int("created_at").notNull(),
    updatedAt: int("updated_at").notNull(),
    verificationToken: varchar("verification_token", { length: 255 }),
    nama: varchar("nama", { length: 100 }).notNull(),
    alamat: varchar("alamat", { length: 255 }).notNull(),
    photo: varchar("photo", { length: 100 }).notNull(),
    urlphoto: varchar("urlphoto", { length: 200 }).notNull(),
    updatephoto: varchar("updatephoto", { length: 25 }).notNull(),
    isDeleted: int("is_deleted"),
    lastActivity: timestamp("last_activity").notNull().defaultNow().onUpdateNow(),
    gender: int("gender").notNull().default(1),
    brithdate: date("brithdate"),
});

export const activityLogin = mysqlTable("activity_login", {
    id: serial("id").primaryKey(),
    createdBy: int("created_by").notNull(),
    isLogin: timestamp("is_login").notNull().defaultNow().onUpdateNow(),
    device: varchar("device", { length: 10 }).notNull(),
});

export const customerKategori = mysqlTable("customer_kategori", {
    id: serial("id").primaryKey(),
    namaTipeCustomer: varchar("nama_tipe_customer", { length: 50 }),
    diskon: varchar("diskon", { length: 3 }),
    diskonFlashSale: varchar("diskon_flash_sale", { length: 3 }),
    SYARAT_KETENTUAN: text("syarat_ketentuan"),
    urutan: int("urutan").notNull(),
});

export const customer = mysqlTable("customer", {
    custId: varchar("cust_id", { length: 200 }).primaryKey(),
    namaCustomer: varchar("nama_customer", { length: 150 }),
    userId: int("user_id"),
    email: varchar("email", { length: 50 }),
    telp: varchar("telp", { length: 20 }),
    alamat: varchar("alamat", { length: 255 }),
    alamatLengkap: varchar("alamat_lengkap", { length: 50 }),
    namaToko: varchar("nama_toko", { length: 100 }),
    kecamatan: varchar("kecamatan", { length: 100 }),
    kota: varchar("kota", { length: 100 }),
    provinsi: varchar("provinsi", { length: 100 }),
    kodepos: varchar("kodepos", { length: 10 }),
    kategoriCustomerId: int("kategori_customer_id"),
    kategoriCustomer: varchar("kategori_customer", { length: 100 }),
    completedDepositTime: timestamp("completed_deposit_time"),
    isDeleted: int("is_deleted").default(0),
});

export const customerAlamat = mysqlTable("customer_alamat", {
    id: serial("id").primaryKey(),
    custId: varchar("cust_id", { length: 200 }),
    labelAlamat: varchar("label_alamat", { length: 50 }),
    namaPenerima: varchar("nama_penerima", { length: 50 }),
    alamatLengkap: text("alamat_lengkap"),
    noHandphone: varchar("no_handphone", { length: 20 }),
    kelurahan: varchar("kelurahan", { length: 50 }),
    kecamatan: varchar("kecamatan", { length: 20 }),
    kota: varchar("kota", { length: 30 }),
    provinsi: varchar("provinsi", { length: 30 }),
    kodePos: varchar("kode_pos", { length: 10 }),
    createdAt: timestamp("created_at"),
    createdBy: int("created_by"),
    namaToko: varchar("nama_toko", { length: 255 }),
    isPrimary: int("is_primary").default(0),
});

export const keranjang = mysqlTable("keranjang", {
    id: serial("id").primaryKey(),
    produkId: varchar("produk_id", { length: 200 }),
    warna: varchar("warna", { length: 20 }),
    size: varchar("size", { length: 50 }),
    qtyProduk: int("qty_produk"),
    hargaPoduk: int("harga_poduk"),
    gambarProduk: text("gambar_produk"),
    status: int("status"),
    custId: int("cust_id"),
    keterangan: text("keterangan"),
    isFlashsale: int("is_flashsale").default(0),
    flashsaleExpired: timestamp("flashsale_expired"),
    isPreorder: int("is_preorder").default(0),
    preorderId: int("preorder_id"),
    flashsaleId: varchar("flashsale_id", { length: 3 }),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
    tipeDiskon: varchar("tipe_diskon", { length: 20 }),
    isDeleted: int("is_deleted").default(0),
});

export const orders = mysqlTable("orders", {
    orderId: varchar("order_id", { length: 100 }).primaryKey(),
    tglOrder: date("tgl_order"),
    customer: varchar("customer", { length: 100 }),
    statusCustomer: varchar("status_customer", { length: 100 }),
    shipto: varchar("shipto", { length: 100 }),
    alamatKirim: varchar("alamat_kirim", { length: 300 }),
    provinsiKirim: varchar("provinsi_kirim", { length: 100 }),
    kotaKirim: varchar("kota_kirim", { length: 100 }),
    distrikKirim: varchar("distrik_kirim", { length: 100 }),
    noResi: varchar("no_resi", { length: 100 }),
    ekspedisi: varchar("ekspedisi", { length: 100 }),
    service: varchar("service", { length: 100 }),
    kodeservice: varchar("kodeservice", { length: 100 }),
    shipper: varchar("shipper", { length: 100 }),
    totalOrder: int("total_order"),
    totalHarga: double("total_harga"),
    totcost: double("totcost"),
    totalBerat: float("total_berat"),
    ongkir: double("ongkir"),
    biayalain: double("biayalain"),
    totalTagihan: double("total_tagihan"),
    statusTagihan: varchar("status_tagihan", { length: 50 }),
    tglBayar: datetime("tgl_bayar"),
    statusOrder: varchar("status_order", { length: 50 }),
    tglKirim: datetime("tgl_kirim"),
    statusBarang: smallint("status_barang"),
    userId: varchar("user_id", { length: 100 }),
    metodebayar: varchar("metodebayar", { length: 100 }),
    keterangan: text("keterangan"),
    proses1: char("proses1", { length: 1 }).default("N"),
    proses2: char("proses2", { length: 1 }).default("N"),
    proses3: char("proses3", { length: 1 }).default("N"),
    proses4: char("proses4", { length: 1 }).default("N"),
    timestamp: datetime("timestamp").notNull(),
    isOnline: int("is_online").default(0),
    orderTipe: varchar("order_tipe", { length: 20 }).default("ORDER"),
    preorderId: int("preorder_id"),
    sisaPembayaran: int("sisa_pembayaran"),
    isReadyStok: int("is_ready_stok").default(0),
    viaWallet: int("via_wallet").default(0),
    viaBank: int("via_bank").default(0),
    companyprofileId: int("companyprofile_id"),
    namaPenerima: varchar("nama_penerima", { length: 100 }).notNull(),
    teleponPenerima: varchar("telepon_penerima", { length: 100 }).notNull(),
    customerAlamatIdPengirim: int("customer_alamat_id_pengirim").notNull().default(0),
    customerAlamatIdPenerima: int("customer_alamat_id_penerima").notNull(),
    namaPengirim: varchar("nama_pengirim", { length: 100 }).notNull(),
    teleponPengirim: varchar("telepon_pengirim", { length: 100 }).notNull(),
    alamatPengirim: varchar("alamat_pengirim", { length: 255 }).notNull(),
    nilaiRating: varchar("nilai_rating", { length: 100 }),
    komentarRating: text("komentar_rating"),
    waktuRating: varchar("waktu_rating", { length: 100 }),
    isGetReferal: int("is_get_referal").notNull().default(0),
    catatanKhusus: text("catatan_khusus"),
    suratJalanCreatedAt: datetime("surat_jalan_created_at").notNull(),
    suratJalanCreatedBy: int("surat_jalan_created_by").notNull().default(0),
    catatanKhususAdmin: text("catatan_khusus_admin").notNull(),
    jneNoTiket: varchar("jne_no_tiket", { length: 255 }).notNull(),
    jneCodeOrigin: varchar("jne_code_origin", { length: 255 }).notNull(),
    jneCodeDestination: varchar("jne_code_destination", { length: 255 }).notNull(),
    updatedAt: datetime("updated_at").notNull(),
    updatedBy: int("updated_by").notNull().default(0),
    catatanOrderGabung: text("catatan_order_gabung").notNull(),
    idOrderGabung: int("id_order_gabung").notNull().default(0),
    isDeleted: int("is_deleted").notNull().default(0),
});

export const orderdetail = mysqlTable("orderdetail", {
    id: serial("id").primaryKey(),
    orderId: varchar("order_id", { length: 50 }),
    produkId: varchar("produk_id", { length: 20 }),
    ukuran: varchar("ukuran", { length: 50 }),
    warna: varchar("warna", { length: 20 }),
    harga: int("harga"),
    qty: int("qty"),
    jmlHarga: int("jml_harga"),
    catatan: text("catatan"),
    berat: int("berat"),
    jmlBerat: int("jml_berat"),
    kategori: varchar("kategori", { length: 100 }),
});

export const flashSale = mysqlTable("flash_sale", {
    id: serial("id").primaryKey(),
    namaEvent: varchar("nama_event", { length: 255 }),
    waktuMulai: timestamp("waktu_mulai"),
    waktuSelesai: timestamp("waktu_selesai"),
    customerKategoriId: text("customer_kategori_id"),
    isAktif: int("is_aktif").default(0),
});

export const flashSaleDetail = mysqlTable("flash_sale_detail", {
    id: serial("id").primaryKey(),
    flashSaleId: int("flash_sale_id"),
    produkId: varchar("produk_id", { length: 20 }),
    hargaNormal: int("harga_normal"),
    nilaiPotongan: int("nilai_potongan"),
    hargaAkhir: int("harga_akhir"),
});

export const preOrder = mysqlTable("pre_order", {
    preOrderId: serial("pre_order_id").primaryKey(),
    namaEvent: varchar("nama_event", { length: 255 }),
    waktuMulai: timestamp("waktu_mulai"),
    waktuSelesai: timestamp("waktu_selesai"),
    customerKategoriId: text("customer_kategori_id"),
    isAktif: int("is_aktif").default(0),
});

export const preOrderDetail = mysqlTable("pre_order_detail", {
    id: serial("id").primaryKey(),
    preOrderId: int("pre_order_id"),
    produkId: varchar("produk_id", { length: 20 }),
    warna: varchar("warna", { length: 20 }),
    size: varchar("size", { length: 20 }),
    qty: int("qty"),
    harga: int("harga"),
    createdAt: timestamp("created_at"),
    createdBy: int("created_by"),
});


export const provinsi = mysqlTable("provinsi", {
    provinceId: char("province_id", { length: 2 }).primaryKey(),
    province: varchar("province", { length: 255 }).notNull(),
});

export const kota = mysqlTable("kota", {
    cityId: char("city_id", { length: 4 }).primaryKey(),
    provinceId: char("province_id", { length: 2 }).notNull(),
    cityName: varchar("city_name", { length: 255 }).notNull(),
    jneOriginCityCode: varchar("Jne_Origin_City_Code", { length: 255 }),
    jneOriginCityName: varchar("Jne_Origin_City_Name", { length: 255 }),
});

export const kecamatan = mysqlTable("kecamatan", {
    subdistrictId: char("subdistrict_id", { length: 7 }).primaryKey(),
    cityId: char("city_id", { length: 4 }).notNull(),
    subdistrictName: varchar("subdistrict_name", { length: 255 }).notNull(),
    jneDestinationCityCode: varchar("Jne_Destination_City_Code", { length: 255 }),
    jneDestinationCityName: varchar("Jne_Destination_City_Name", { length: 255 }),
});

export const wallet = mysqlTable("wallet", {
    id: serial("id").primaryKey(),
    custId: varchar("cust_id", { length: 200 }),
    debit: int("debit").default(0),
    kredit: int("kredit").default(0),
    saldo: int("saldo").default(0),
    keterangan: text("keterangan"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
});

export const companyProfile = mysqlTable("companyprofile", {
    id: serial("id").primaryKey(),
    namaPerusahaan: varchar("nama", { length: 255 }),
    alamat: text("alamat"),
    kota: varchar("kota", { length: 100 }),
    isAktif: int("is_aktif").default(0),
});

export const centralConfig = mysqlTable("central_config", {
    variable: varchar("variable", { length: 255 }).primaryKey(),
    value: text("value"),
});

export const statusOrder = mysqlTable("status_order", {
    statusOrderId: varchar("statusorder_id", { length: 100 }).primaryKey(),
    statusOrderAdmin: varchar("statusorder_admin", { length: 100 }),
    statusOrderEnduser: varchar("statusorder_enduser", { length: 100 }),
});

export const statusTagihan = mysqlTable("status_tagihan", {
    statusTagihanId: varchar("statustagihan_id", { length: 100 }).primaryKey(),
    statusTagihanAdmin: varchar("statustagihan_admin", { length: 100 }),
    statusTagihanEnduser: varchar("statustagihan_enduser", { length: 100 }),
});

export const rekeningPembayaran = mysqlTable("rekening_pembayaran", {
    id: serial("id").primaryKey(),
    namaBank: varchar("nama_bank", { length: 100 }),
    namaPemilik: varchar("nama_pemilik", { length: 100 }),
    noRekening: varchar("no_rekening", { length: 100 }),
    logoBank: varchar("logo_bank", { length: 255 }),
    isAktif: int("is_aktif").default(1),
});

export const cargo = mysqlTable("cargo", {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 50 }),
    name: varchar("name", { length: 100 }),
    isAktif: int("is_aktif").default(1),
});

export const voucher = mysqlTable("voucher", {
    id: serial("id").primaryKey(),
    kodeVoucher: varchar("kode_voucher", { length: 255 }).notNull(),
    namaVoucher: varchar("nama_voucher", { length: 255 }),
    tanggalMulai: datetime("tanggal_mulai"),
    tanggalKadaluarsa: datetime("tanggal_kadaluarsa"),
    nilaiVoucher: int("nilai_voucher"),
    tipeVoucher: varchar("tipe_voucher", { length: 255 }),
    orderTipe: varchar("order_tipe", { length: 255 }),
    kategoriCustomerId: varchar("kategori_customer_id", { length: 255 }),
    minimalTransaksi: int("minimal_transaksi"),
    maksimalNominalVoucherPersen: int("maksimal_nominal_voucher_persen"),
    custId: text("cust_id"),
    kuotaVoucher: int("kuota_voucher"),
    deskripsiVoucher: text("deskripsi_voucher"),
    isAktif: int("is_aktif").default(1),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
    createdBy: int("created_by"),
    updatedBy: int("updated_by"),
});

export const voucherHistory = mysqlTable("voucher_history", {
    id: int("id"),
    // idOrder: int("id_order"),
    kodeVoucher: varchar("kode_voucher", { length: 255 }).notNull(),
    namaVoucher: varchar("nama_voucher", { length: 255 }),
    tanggalMulai: datetime("tanggal_mulai"),
    tanggalKadaluarsa: datetime("tanggal_kadaluarsa"),
    nilaiVoucher: int("nilai_voucher"),
    tipeVoucher: varchar("tipe_voucher", { length: 255 }),
    orderTipe: varchar("order_tipe", { length: 255 }),
    kategoriCustomerId: varchar("kategori_customer_id", { length: 255 }),
    minimalTransaksi: int("minimal_transaksi"),
    maksimalNominalVoucherPersen: int("maksimal_nominal_voucher_persen"),
    custId: text("cust_id"),
    kuotaVoucher: int("kuota_voucher"),
    deskripsiVoucher: text("deskripsi_voucher"),
    isAktif: int("is_aktif").default(1),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
    createdBy: int("created_by"),
    updatedBy: int("updated_by"),
});
