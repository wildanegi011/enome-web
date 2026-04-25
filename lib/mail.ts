import nodemailer from "nodemailer";
import logger from "./logger";
import path from "path";
import { ConfigService } from "./services/config-service";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

function getPremiumEmailTemplate(title: string, message: string, buttonText: string, link: string, footerNote: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Énome</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F7F3; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.03);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px 40px; background-color: #171717;">
                            <img src="cid:logo" alt="Énome" width="160" style="display: block; border: 0; outline: none; text-decoration: none;">
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td align="center" style="padding: 50px 50px 40px 50px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #171717; letter-spacing: -0.01em;">${title}</h2>
                            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #525252;">${message}</p>
                            
                            <!-- CTA Button -->
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" bgcolor="#171717" style="border-radius: 12px;">
                                        <a href="${link}" target="_blank" style="display: inline-block; padding: 18px 36px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 12px;">${buttonText}</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <p style="margin: 40px 0 0 0; font-size: 12px; color: #737373;">Atau gunakan tautan berikut jika tombol tidak berfungsi:</p>
                            <a href="${link}" style="display: block; margin-top: 5px; font-size: 12px; color: #171717; text-decoration: none; word-break: break-all;">${link}</a>
                        </td>
                    </tr>
                    
                    <!-- Footer Info -->
                    <tr>
                        <td style="padding: 0 50px 40px 50px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #F5F5F5; padding-top: 30px;">
                                <tr>
                                    <td align="center" style="font-size: 12px; line-height: 1.5; color: #A3A3A3;">
                                        <p style="margin: 0;">${footerNote}</p>
                                        <p style="margin: 10px 0 0 0;">&copy; 2024 Énome. Semua hak dilindungi.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

export async function sendResetPasswordEmail(to: string, resetLink: string, attachments: any[] = []) {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || '"Énome" <noreply@enome.test>',
            to,
            subject: "Reset Password - Énome",
            html: getPremiumEmailTemplate(
                "Pemulihan Kata Sandi",
                "Kami menerima permintaan untuk menyetel ulang kata sandi akun Énome Anda. Silakan klik tombol di bawah ini untuk melanjutkan proses pemulihan.",
                "Setel Ulang Password",
                resetLink,
                "Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini. Tautan ini akan kedaluwarsa dalam 1 jam."
            ),
            attachments: [
                {
                    filename: 'logo-enome-white.png',
                    path: path.join(process.cwd(), 'public', 'logo-enome-white.png'),
                    cid: 'logo'
                },
                ...attachments
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info("Email sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        logger.error("Error sending email: ", error);
        return { success: false, error: error.message };
    }
}

export async function sendActivationEmail(to: string, activationLink: string, attachments: any[] = []) {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || '"Énome" <noreply@enome.test>',
            to,
            subject: "Aktivasi Akun - Énome",
            html: getPremiumEmailTemplate(
                "Selamat Bergabung",
                "Terima kasih telah memilih Énome. Untuk mengaktifkan akun Anda dan mulai menjelajahi koleksi eksklusif kami, silakan konfirmasi email Anda.",
                "Konfirmasi Email",
                activationLink,
                "Tautan ini akan kedaluwarsa dalam 24 jam. Jika Anda tidak merasa melakukan pendaftaran ini, Anda dapat mengabaikan email ini dengan aman."
            ),
            attachments: [
                {
                    filename: 'logo-enome-white.png',
                    path: path.join(process.cwd(), 'public', 'logo-enome-white.png'),
                    cid: 'logo'
                },
                ...attachments
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info("Activation email sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        logger.error("Error sending activation email: ", error);
        return { success: false, error: error.message };
    }
}

export async function sendNewOrderAdminNotification(adminEmail: string, orderData: any) {
    try {
        const { orderId, customerName, totalTagihan, items, shippingAddress, kelurahan, kecamatan, kota, provinsi, kodePos } = orderData;

        const itemsList = items.map((item: any) => `
            <tr>
                <td style="padding: 12px 10px; border-bottom: 1px solid #f2f2f2; font-size: 14px; color: #404040;">
                    <div style="font-weight: 600; color: #171717; margin-bottom: 2px;">${item.namaProduk}</div>
                    <div style="font-size: 12px; color: #737373;">
                        <strong>Size:</strong> ${item.size} | 
                        <strong>Warna:</strong> ${item.warna} | 
                        <strong>Motif:</strong> ${item.variant || "-"}
                    </div>
                </td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #f2f2f2; text-align: center; font-size: 14px; color: #171717; font-weight: 500;">
                    ${item.qty}
                </td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #f2f2f2; text-align: right; font-size: 14px; color: #171717; font-weight: 600;">
                    Rp ${Math.round(item.harga).toLocaleString('id-ID')}
                </td>
            </tr>
        `).join('');

        const orderDetailsHtml = `
            <div style="text-align: left; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 16px; overflow: hidden; margin: 25px 0;">
                <div style="background-color: #171717; padding: 15px 20px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                            <td><span style="color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">RINGKASAN PESANAN</span></td>
                            <td align="right"><span style="background-color: #F59E0B; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap;">Menunggu Pembayaran</span></td>
                        </tr>
                    </table>
                </div>
                
                <div style="padding: 20px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; border-bottom: 1px solid #f5f5f5; padding-bottom: 20px;">
                        <tr>
                            <td width="50%" valign="top">
                                <p style="margin: 0 0 5px 0; font-size: 11px; color: #a3a3a3; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Order ID</p>
                                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #171717;">#${orderId}</p>
                            </td>
                            <td width="50%" valign="top">
                                <p style="margin: 0 0 5px 0; font-size: 11px; color: #a3a3a3; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Pelanggan</p>
                                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #171717;">${customerName}</p>
                            </td>
                        </tr>
                    </table>

                    <div style="margin-bottom: 25px;">
                        <p style="margin: 0 0 8px 0; font-size: 11px; color: #a3a3a3; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Alamat Pengiriman</p>
                        <p style="margin: 0; font-size: 13px; color: #525252; line-height: 1.6;">
                            ${shippingAddress}<br>
                            ${kelurahan && kelurahan !== "-" ? `Kel. ${kelurahan}, ` : ""}${kecamatan && kecamatan !== "-" ? `Kec. ${kecamatan}` : ""}<br>
                            ${kota && kota !== "-" ? kota : ""}${provinsi && provinsi !== "-" ? `, ${provinsi}` : ""} ${kodePos && kodePos !== "-" ? kodePos : ""}
                        </p>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="border-bottom: 2px solid #171717;">
                                <th style="padding: 10px 10px 8px 10px; text-align: left; font-size: 11px; color: #737373; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Produk</th>
                                <th style="padding: 10px 10px 8px 10px; text-align: center; font-size: 11px; color: #737373; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Qty</th>
                                <th style="padding: 10px 10px 8px 10px; text-align: right; font-size: 11px; color: #737373; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsList}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="padding: 20px 10px 10px 10px; text-align: left; font-size: 14px; font-weight: 700; color: #737373;">TOTAL TAGIHAN</td>
                                <td style="padding: 20px 10px 10px 10px; text-align: right; font-size: 20px; font-weight: 800; color: #171717;">
                                    Rp ${Math.round(totalTagihan).toLocaleString('id-ID')}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;

        // Fetch backend URL for the admin portal link
        const backendUrl = await ConfigService.get("backend_url", "http://enome.test");
        const adminDetailLink = `${backendUrl}/pesanan-online/status?id=${encodeURIComponent(orderId)}`;

        const mailOptions = {
            from: process.env.SMTP_FROM || '"Énome" <noreply@enome.test>',
            to: adminEmail,
            subject: `[PESANAN BARU] ${orderId} - ${customerName}`,
            html: getPremiumEmailTemplate(
                "Pesanan Baru Diterima",
                `Halo Admin, pesanan baru telah masuk. Segera tinjau rincian di bawah ini dan siapkan proses pengiriman setelah pembayaran dikonfirmasi.`,
                "Kelola di Dashboard",
                adminDetailLink,
                "Ini adalah notifikasi otomatis sistem. Mohon tidak membalas email ini."
            ).replace('<p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #525252;">', `<p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #525252;">${orderDetailsHtml}`),
            attachments: [
                {
                    filename: 'logo-enome-white.png',
                    path: path.join(process.cwd(), 'public', 'logo-enome-white.png'),
                    cid: 'logo'
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info("Admin notification email sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        logger.error("Error sending admin notification email: ", error);
        return { success: false, error: error.message };
    }
}

export async function sendOrderConfirmationEmail(to: string, orderData: any) {
    try {
        const { orderId, customerName, totalTagihan, items, paymentInfo, shippingAddress, kelurahan, kecamatan, kota, provinsi, kodePos } = orderData;

        const itemsList = items.map((item: any) => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <div style="font-weight: 600; color: #171717;">${item.namaProduk}</div>
                    <div style="font-size: 11px; color: #737373;">
                        Size: ${item.size} | Warna: ${item.warna} | Motif: ${item.variant || "-"}
                    </div>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rp ${Math.round(item.harga).toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        let paymentInstructionsHtml = '';
        if (paymentInfo) {
            paymentInstructionsHtml = `
                <div style="margin: 20px 0; padding: 25px; background-color: #171717; border-radius: 16px; color: #ffffff; text-align: left;">
                    <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 0.05em;">Instruksi Pembayaran</h3>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #A3A3A3; line-height: 1.5;">Silakan lakukan transfer tepat sampai 3 digit terakhir untuk mempercepat verifikasi otomatis:</p>
                    
                    <div style="background-color: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 15px;">
                        <p style="margin: 0 0 5px 0; font-size: 12px; color: #A3A3A3; text-transform: uppercase;">Total Pembayaran</p>
                        <p style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Rp ${Math.round(totalTagihan).toLocaleString('id-ID')}</p>
                    </div>

                    <div style="border-top: 1px solid rgba(255,255,255,0.1); pt: 15px; margin-top: 15px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding-bottom: 10px;">
                                    <p style="margin: 0; font-size: 12px; color: #A3A3A3;">Bank</p>
                                    <p style="margin: 2px 0 0 0; font-size: 15px; font-weight: 600;">${paymentInfo.bankName}</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-bottom: 10px;">
                                    <p style="margin: 0; font-size: 12px; color: #A3A3A3;">Nomor Rekening</p>
                                    <p style="margin: 2px 0 0 0; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">${paymentInfo.bankAccount}</p>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <p style="margin: 0; font-size: 12px; color: #A3A3A3;">Atas Nama</p>
                                    <p style="margin: 2px 0 0 0; font-size: 15px; font-weight: 600;">${paymentInfo.bankOwner}</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            `;
        }

        const orderSummaryHtml = `
            <div style="text-align: left; background-color: #f9f9f9; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <p style="margin-bottom: 10px;"><strong>Ringkasan Pesanan:</strong></p>
                <table style="width: 100%; border-collapse: collapse;">
                    <tbody>
                        ${itemsList}
                        <tr>
                            <td colspan="2" style="padding: 15px 10px 10px 10px; font-weight: bold;">Subtotal</td>
                            <td style="padding: 15px 10px 10px 10px; font-weight: bold; text-align: right; color: #171717;">
                                Rp ${Math.round(totalTagihan).toLocaleString('id-ID')}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div style="text-align: left; background-color: #f9f9f9; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #a3a3a3; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Alamat Pengiriman</p>
                <p style="margin: 0; font-size: 13px; color: #525252; line-height: 1.6;">
                    ${shippingAddress || "-"}<br>
                    ${kelurahan && kelurahan !== "-" ? `Kel. ${kelurahan}, ` : ""}${kecamatan && kecamatan !== "-" ? `Kec. ${kecamatan}` : ""}<br>
                    ${kota && kota !== "-" ? kota : ""}${provinsi && provinsi !== "-" ? `, ${provinsi}` : ""} ${kodePos && kodePos !== "-" ? kodePos : ""}
                </p>
            </div>
            ${paymentInstructionsHtml}
        `;

        const frontendUrl = await ConfigService.get("mobile_main_url", "http://enome.test");
        const orderDetailLink = `${frontendUrl}/account/orders/${encodeURIComponent(orderId)}`;

        const mailOptions = {
            from: process.env.SMTP_FROM || '"Énome" <noreply@enome.test>',
            to,
            subject: `Pesanan Énome Berhasil Dibuat - ${orderId}`,
            html: getPremiumEmailTemplate(
                "Terima Kasih Atas Pesanan Anda",
                `Halo ${customerName}, pesanan Anda dengan ID <strong>${orderId}</strong> telah berhasil kami terima. Berikut adalah detail pembayaran untuk pesanan Anda.`,
                "Lihat Detail Pesanan",
                orderDetailLink,
                "Terima kasih telah berbelanja di Énome. Pesanan Anda akan kami proses setelah pembayaran kami terima."
            ).replace('<p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #525252;">', `<p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #525252;">${orderSummaryHtml}`),
            attachments: [
                {
                    filename: 'logo-enome-white.png',
                    path: path.join(process.cwd(), 'public', 'logo-enome-white.png'),
                    cid: 'logo'
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info("Customer order confirmation email sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        logger.error("Error sending order confirmation email to customer: ", error);
        return { success: false, error: error.message };
    }
}

export async function sendOrderStatusUpdateEmail(to: string, orderData: any) {
    try {
        const { orderId, customerName, status, noResi, ekspedisi, items, shippingAddress, kelurahan, kecamatan, kota, provinsi, kodePos } = orderData;
        let title = "Update Status Pesanan";
        let message = `Pesanan Anda #${orderId} telah berubah status menjadi ${status}.`;
        let buttonText = "Lihat Detail Pesanan";
        let footerNote = "Terima kasih telah berbelanja di Énome.";

        const frontendUrl = await ConfigService.get("mobile_main_url", "http://localhost:3000");
        let link = `${frontendUrl}/account/orders/${encodeURIComponent(orderId)}`;

        // Customize based on status
        const upperStatus = status.toUpperCase();
        if (upperStatus.includes("BAYAR") || upperStatus.includes("PAID")) {
            title = "Pembayaran Diterima";
            message = `Terima kasih! Pembayaran untuk pesanan #${orderId} telah kami terima dengan baik. Pesanan Anda saat ini sudah masuk ke tahap pengemasan.`;
        } else if (upperStatus.includes("PROSES")) {
            title = "Pesanan Sedang Dikemas";
            message = `Kabar baik! Pesanan #${orderId} sudah kami terima dengan baik dan saat ini sedang dalam proses pengemasan. Kami akan segera menginformasikan nomor resi setelah pesanan dikirimkan.`;
        } else if (upperStatus.includes("KIRIM")) {
            title = "Pesanan Telah Dikirim";
            message = `Kabar gembira! Pesanan #${orderId} telah dikirim melalui kurir ${ekspedisi || "ekspedisi pilihan"}. Anda dapat melacaknya dengan nomor resi: <strong>${noResi || "-"}</strong>`;
            buttonText = "Lacak Pesanan";
        } else if (upperStatus.includes("CLOSE") || upperStatus.includes("SELESAI")) {
            title = "Pesanan Selesai";
            message = `Pesanan #${orderId} telah dinyatakan selesai. Kami harap Anda puas dengan produk Énome.`;
        } else if (upperStatus.includes("KADALUARSA") || upperStatus.includes("EXPIRE")) {
            title = "Pesanan Kedaluwarsa";
            message = `Pesanan #${orderId} telah dibatalkan secara otomatis oleh sistem karena kami tidak menerima konfirmasi pembayaran hingga batas waktu yang ditentukan. Silakan lakukan pemesanan ulang jika Anda masih menginginkan produk tersebut.`;
            // buttonText = "Pesan Ulang";
            footerNote = "Mohon maaf atas ketidaknyamanan ini.";
        } else if (upperStatus.includes("BATAL") || upperStatus.includes("CANCEL")) {
            title = "Pesanan Dibatalkan";
            message = `Pesanan #${orderId} telah dibatalkan. Jika Anda merasa hal ini adalah kesalahan, silakan hubungi Customer Service kami.`;
            buttonText = "Hubungi Kami";
            footerNote = "Terima kasih dan kami mohon maaf atas ketidaknyamanan ini.";

            // Redirect to WhatsApp for cancelled orders
            const whatsappNumber = await ConfigService.get("whatsapp_nomor", "628997279308");
            const whatsappMessage = encodeURIComponent(`Halo Admin, saya ingin menanyakan perihal pembatalan pesanan saya dengan nomor #${orderId}.`);
            link = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
        }

        let orderItemsHtml = "";
        if (items && items.length > 0) {
            const itemsList = items.map((item: any) => `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <div style="font-weight: 600; color: #171717;">${item.namaProduk}</div>
                        <div style="font-size: 11px; color: #737373;">
                            Size: ${item.size || item.ukuran} | Warna: ${item.warna} | Motif: ${item.variant || "-"}
                        </div>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rp ${Math.round(item.harga).toLocaleString('id-ID')}</td>
                </tr>
            `).join('');

            orderItemsHtml = `
                <div style="text-align: left; background-color: #f9f9f9; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <p style="margin-bottom: 10px; font-size: 14px; font-weight: bold; color: #171717;">Rincian Pesanan:</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <th style="text-align: left; padding: 10px; font-size: 11px; color: #737373; text-transform: uppercase;">Produk</th>
                                <th style="text-align: center; padding: 10px; font-size: 11px; color: #737373; text-transform: uppercase;">Qty</th>
                                <th style="text-align: right; padding: 10px; font-size: 11px; color: #737373; text-transform: uppercase;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsList}
                        </tbody>
                    </table>
                </div>

                <div style="text-align: left; background-color: #f9f9f9; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 11px; color: #a3a3a3; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Alamat Pengiriman</p>
                    <p style="margin: 0; font-size: 13px; color: #525252; line-height: 1.6;">
                        ${shippingAddress || "-"}<br>
                        ${kelurahan && kelurahan !== "-" ? `Kel. ${kelurahan}, ` : ""}${kecamatan && kecamatan !== "-" ? `Kec. ${kecamatan}` : ""}<br>
                        ${kota && kota !== "-" ? kota : ""}${provinsi && provinsi !== "-" ? `, ${provinsi}` : ""} ${kodePos && kodePos !== "-" ? kodePos : ""}
                    </p>
                </div>
            `;
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || '"Énome" <noreply@enome.test>',
            to,
            subject: `Update Pesanan ${orderId}: ${title}`,
            html: getPremiumEmailTemplate(title, message, buttonText, link, footerNote)
                .replace('<p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #525252;">',
                    `<p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #525252;">${orderItemsHtml}`),
            attachments: [
                {
                    filename: 'logo-enome-white.png',
                    path: path.join(process.cwd(), 'public', 'logo-enome-white.png'),
                    cid: 'logo'
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info("Order status update email sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        logger.error("Error sending order status update email: ", error);
        return { success: false, error: error.message };
    }
}
