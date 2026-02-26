# Resume Fitur & Use Case: Order to Checkout ÉNOMÉ

Dokumen ini berisi rangkuman fitur dan skenario penggunaan yang telah diimplementasikan dalam alur pesanan (Order) hingga penyelesaian pembayaran (Checkout) pada aplikasi ÉNOMÉ.

---

## 1. Keranjang Belanja & Validasi Stok
*   **Validasi Stok Real-time**: Sistem secara otomatis mencegah penambahan barang ke keranjang atau perubahan jumlah (quantity) jika melebihi stok yang tersedia di database.
*   **Validasi Status Toko/Produk**: Pengguna tidak dapat melanjutkan ke proses checkout jika produk atau toko berstatus offline (`is_online == 0`).

## 2. Riwayat Pesanan (Order History)
*   **Filter Tanggal Premium**: Penambahan filter tanggal yang intuitif (1 Bulan, 3 Bulan, Tahun Ini, atau Rentang Khusus) dengan default 3 bulan terakhir.
*   **Pencarian Pesanan**: Fitur pencarian canggih yang mendukung pencarian berdasarkan **Order ID** maupun **Nama Produk** di dalam pesanan.
*   **Status Tabs**: Navigasi antar status pesanan (Semua, Menunggu Pembayaran, Diproses, Dikirim, Selesai, Dibatalkan) dengan sinkronisasi data database.

## 3. Alur Checkout (Multi-Step Logic)
*   **Manajemen Pengiriman (Shipping)**:
    *   Integrasi alamat utama dan pemilihan alamat tujuan.
    *   Kalkulasi ongkir otomatis menggunakan integrasi API Komerce.
    *   Pemilihan kurir yang disederhanakan dalam satu daftar tunggal.
*   **Pembayaran & Dompet (Wallet)**:
    *   Fitur penggunaan saldo Dompet (Wallet) untuk memotong total tagihan secara langsung.
    *   Validasi kode promo agar tidak dapat digunakan jika sisa tagihan sudah mencapai Rp 0.
    *   Penambahan **Kode Unik** (3 digit terakhir) secara otomatis pada total pembayaran untuk mempermudah verifikasi manual.
*   **Pengurangan Stok**: Stok produk akan otomatis terpotong secara atomik sesaat setelah pesanan berhasil dibuat.

## 4. Profil & Pengaturan Akun
*   **Biodata Diri**: Integrasi pembaruan data Nama, Tanggal Lahir (dengan Date Picker), dan Jenis Kelamin.
*   **Upload & Sinkronisasi Foto**:
    *   Fitur upload foto profil dengan preview instan.
    *   Sinkronisasi otomatis ke folder `frontend/web/img/user` (aplikasi lama/Yii2) agar data tetap konsisten di kedua sistem.
    *   Penyimpanan URL lengkap foto profil di database.
*   **Format Nomor HP**: Pembersihan otomatis awalan `0` atau `+62` pada input nomor HP untuk mencegah duplikasi data.
