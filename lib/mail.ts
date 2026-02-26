import nodemailer from "nodemailer";
import logger from "./logger";

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
    <title>Énome Luxury Interior</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F7F3; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.03);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px 40px; background-color: #171717;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff; text-transform: uppercase;">Énome</h1>
                            <p style="margin: 5px 0 0 0; font-size: 12px; letter-spacing: 0.3em; color: #A3A3A3; text-transform: uppercase; font-weight: 500;">Luxury Interior</p>
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

export async function sendResetPasswordEmail(to: string, resetLink: string) {
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
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info("Email sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        logger.error("Error sending email: ", error);
        return { success: false, error: error.message };
    }
}

export async function sendActivationEmail(to: string, activationLink: string) {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || '"Énome" <noreply@enome.test>',
            to,
            subject: "Aktivasi Akun - Énome",
            html: getPremiumEmailTemplate(
                "Selamat Bergabung",
                "Terima kasih telah memilih Énome Luxury Interior. Untuk mengaktifkan akun Anda dan mulai menjelajahi koleksi eksklusif kami, silakan konfirmasi email Anda.",
                "Konfirmasi Email",
                activationLink,
                "Jika Anda tidak merasa melakukan pendaftaran ini, Anda dapat mengabaikan email ini dengan aman."
            ),
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info("Activation email sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        logger.error("Error sending activation email: ", error);
        return { success: false, error: error.message };
    }
}
