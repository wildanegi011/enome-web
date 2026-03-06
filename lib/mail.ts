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
                "Jika Anda tidak merasa melakukan pendaftaran ini, Anda dapat mengabaikan email ini dengan aman."
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
        const { orderId, customerName, totalTagihan, items, shippingAddress } = orderData;

        const itemsList = items.map((item: any) => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.namaProduk} (${item.size}/${item.warna})</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rp ${Math.round(item.harga).toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        const orderDetailsHtml = `
            <div style="text-align: left; background-color: #f9f9f9; padding: 20px; border-radius: 12px; margin-top: 20px;">
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Total Tagihan:</strong> Rp ${Math.round(totalTagihan).toLocaleString('id-ID')}</p>
                <p><strong>Alamat Pengiriman:</strong> ${shippingAddress}</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <thead>
                        <tr style="background-color: #eee;">
                            <th style="padding: 10px; text-align: left;">Produk</th>
                            <th style="padding: 10px; text-align: center;">Qty</th>
                            <th style="padding: 10px; text-align: right;">Harga</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsList}
                    </tbody>
                </table>
            </div>
        `;

        // Fetch backend URL for the admin portal link
        // The URL format is expected to be: {backend_url}/administrator/pesanan-online/status?id={orderId}
        const backendUrl = await ConfigService.get("backend_url", "http://enome.test");
        const adminDetailLink = `${backendUrl}/pesanan-online/status?id=${encodeURIComponent(orderId)}`;

        const mailOptions = {
            from: process.env.SMTP_FROM || '"Énome" <noreply@enome.test>',
            to: adminEmail,
            subject: `[PESANAN BARU] ${orderId} - ${customerName}`,
            html: getPremiumEmailTemplate(
                "Pesanan Baru Diterima",
                `Halo Admin, pesanan baru telah masuk dengan ID <strong>${orderId}</strong>. Berikut adalah rincian pesanan dari pelanggan <strong>${customerName}</strong>.`,
                "Lihat Detail Pesanan",
                adminDetailLink,
                "Ini adalah notifikasi otomatis untuk admin. Silakan login ke dashboard untuk memproses pesanan."
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
