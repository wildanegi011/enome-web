import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function handleWhatsAppConfirm(orderId: string, totalAmount: number, paymentMethod: string, whatsappNumber: string) {
  const message = `Halo Admin Enome,\n\nSaya ingin konfirmasi pembayaran untuk pesanan:\n\nOrder ID: ${orderId}\nTotal Tagihan: ${formatCurrency(totalAmount)}\nMetode Pembayaran: ${paymentMethod}\n\nBerikut bukti pembayarannya:`;
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
  window.open(whatsappUrl, "_blank");
}
