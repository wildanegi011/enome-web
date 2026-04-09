"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toTitleCase, cn } from "@/lib/utils";
import {
    ShoppingBag,
    MapPin,
    Truck,
    CreditCard,
    ChevronRight,
    Loader2,
    ShieldCheck,
    Package,
    Check
} from "lucide-react";
import FallbackImage from "@/components/store/shared/FallbackImage";
import { ASSET_URL } from "@/config/config";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OrderConfirmationProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    isSubmitting: boolean;
    isSuccess?: boolean;
    cartItems: any[];
    shippingForm: any;
    paymentMethod: string;
    paymentAccountName?: string;
    paymentAccountNumber?: string;
    grandTotal: number;
    shippingPrice: number;
    packingFee: number;
    voucherDiscount: number;
    appliedWalletAmount: number;
    remainingBill: number;
    subtotal: number;
    uniqueCode?: number;
    formatPrice: (price: number) => string;
}

{/* Standalone Sub-components to prevent re-mounting during parent re-renders */ }
const ResumeContent = ({
    shippingForm,
    paymentMethod,
    paymentAccountNumber,
    paymentAccountName,
    cartItems,
    grandTotal,
    shippingPrice,
    packingFee,
    voucherDiscount,
    appliedWalletAmount,
    remainingBill,
    subtotal,
    uniqueCode,
    formatPrice
}: any) => (
    <div className="flex flex-col gap-6 py-4">
        {/* Address Summary */}
        <div className="bg-neutral-base-50/50 rounded-3xl p-4 border border-neutral-base-100/50">
            <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-neutral-base-900" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-base-400">Alamat Pengiriman</span>
            </div>
            <div className="flex flex-col gap-1">
                <p className="text-[14px] font-bold text-neutral-base-900">
                    {toTitleCase(shippingForm.name || "")}
                </p>
                <p className="text-[12px] text-neutral-base-600 leading-relaxed line-clamp-2">
                    {toTitleCase(shippingForm.address || "")}, {toTitleCase(shippingForm.kecamatan || "")}, {toTitleCase(shippingForm.kota || "")}, {toTitleCase(shippingForm.provinsi || "")} {shippingForm.kodePos}
                </p>
            </div>
        </div>

        {/* Courier & Payment Summary Row */}
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-base-50/50 rounded-2xl p-3 border border-neutral-base-100/50">
                <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-3.5 h-3.5 text-neutral-base-900" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-base-400">Pengiriman</span>
                </div>
                <p className="text-[12px] font-bold text-neutral-base-900 truncate uppercase mt-0.5">
                    {shippingForm.courier || "KURIR"} {shippingForm.service || ""}
                </p>
            </div>
            <div className="bg-neutral-base-50/50 rounded-2xl p-3 border border-neutral-base-100/50">
                <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-3.5 h-3.5 text-neutral-base-900" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-base-400">Pembayaran</span>
                </div>
                <p className="text-[12px] font-bold text-neutral-base-900 truncate uppercase mt-0.5">
                    {paymentMethod === 'wallet' ? 'ENOME WALLET' : (paymentMethod || "METODE").toUpperCase()}
                </p>
                {paymentAccountNumber && (
                    <div className="flex flex-col mt-0.5">
                        <span className="text-[11px] text-neutral-base-900 font-bold tabular-nums mt-0.5 tracking-wider">{paymentAccountNumber}</span>
                        {paymentAccountName && (
                            <span className="text-[10px] text-neutral-base-500 truncate uppercase font-bold mt-0.5">A.N. {paymentAccountName}</span>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Items Summary */}
        <div>
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-neutral-base-900" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-base-400">Rincian Barang</span>
                </div>
                <span className="text-[11px] font-bold text-neutral-base-900 tracking-tight">{cartItems.length} Item</span>
            </div>
            <ScrollArea className="h-40 pr-3">
                <div className="flex flex-col gap-3">
                    {cartItems.map((item: any) => (
                        <div key={item.id} className="flex gap-3">
                            <div className="w-12 h-12 rounded-xl bg-neutral-base-100 overflow-hidden relative border border-neutral-base-100/50 shrink-0">
                                <FallbackImage
                                    src={item.gambar ? `${ASSET_URL}/img/${item.gambar}` : "/placeholder-product.jpg"}
                                    alt={item.namaProduk}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h4 className="text-[13px] font-bold text-neutral-base-900 truncate mb-1">{toTitleCase(item.namaProduk || "")}</h4>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 rounded-md bg-neutral-base-100 text-neutral-base-700 text-[10px] font-bold">
                                        {item.qty}x
                                    </span>
                                    {item.size && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-neutral-base-50 text-neutral-base-500 border border-neutral-base-100 text-[10px] font-bold uppercase">
                                            {item.size}
                                        </span>
                                    )}
                                    {(item.warnaName || item.warna) && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-neutral-base-50 text-neutral-base-500 border border-neutral-base-100 text-[10px] font-bold uppercase">
                                            {toTitleCase(item.warnaName || item.warna || "")}
                                        </span>
                                    )}
                                    {item.variant && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-neutral-base-50 text-neutral-base-500 border border-neutral-base-100 text-[10px] font-bold uppercase">
                                            {item.variant}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[13px] font-bold text-neutral-base-900 mt-1">{formatPrice(item.harga)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>

        {/* Price Summary */}
        <div className="border-t border-neutral-base-100 pt-4 mt-2">
            <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center px-1">
                    <span className="text-[12px] font-medium text-neutral-base-400">Subtotal</span>
                    <span className="text-[13px] font-bold text-neutral-base-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center px-1">
                    <span className="text-[12px] font-medium text-neutral-base-400">Pengiriman</span>
                    <span className="text-[13px] font-bold text-neutral-base-900">{formatPrice(shippingPrice)}</span>
                </div>
                {voucherDiscount > 0 && (
                    <div className="flex justify-between items-center px-1 text-rose-600 font-bold">
                        <span className="text-[12px]">Voucher</span>
                        <span className="text-[13px]">-{formatPrice(voucherDiscount)}</span>
                    </div>
                )}
                {appliedWalletAmount > 0 && (
                    <div className="flex justify-between items-center px-1 text-emerald-600 font-bold">
                        <span className="text-[12px]">Enome Wallet</span>
                        <span className="text-[13px]">-{formatPrice(appliedWalletAmount)}</span>
                    </div>
                )}
                {uniqueCode > 0 && (
                    <div className="flex justify-between items-center px-1 text-amber-600 font-bold">
                        <span className="text-[12px]">Biaya Kode Unik</span>
                        <span className="text-[13px]">+{formatPrice(uniqueCode)}</span>
                    </div>
                )}
                <div className="flex justify-between items-center px-1 pt-2 border-t border-neutral-base-50">
                    <span className="text-[14px] font-bold text-neutral-base-900 uppercase tracking-widest">Total Bayar</span>
                    <span className="text-[20px] font-bold text-neutral-base-900 tracking-tight">{formatPrice(remainingBill)}</span>
                </div>
            </div>
        </div>

        {/* Trust Banner */}
        <div className="bg-emerald-50/50 rounded-2xl p-3 border border-emerald-100/50 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-[11px] text-emerald-800 font-medium leading-tight">
                Data Anda terenkripsi penuh. Klik tombol bayar untuk menyelesaikan pesanan Anda.
            </p>
        </div>
    </div>
);

const ConfirmButton = ({ isSubmitting, isSuccess, onConfirm }: any) => (
    <Button
        disabled={isSubmitting || isSuccess}
        onClick={onConfirm}
        className={cn(
            "w-full h-14 md:h-16 rounded-2xl md:rounded-3xl font-bold text-[14px] uppercase tracking-widest md:tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all duration-500",
            isSuccess
                ? "bg-emerald-600 text-white shadow-emerald-200"
                : "bg-neutral-base-900 text-white shadow-neutral-base-900/10 shadow-xl"
        )}
    >
        {isSuccess ? (
            <>
                <Check className="w-5 h-5" />
                Berhasil
            </>
        ) : isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
            <>
                Bayar
                <ChevronRight className="w-5 h-5" />
            </>
        )}
    </Button>
);

export default function OrderConfirmation({
    isOpen,
    onClose,
    onConfirm,
    isSubmitting,
    isSuccess,
    cartItems,
    shippingForm,
    paymentMethod,
    paymentAccountName,
    paymentAccountNumber,
    grandTotal,
    shippingPrice,
    packingFee,
    voucherDiscount,
    appliedWalletAmount,
    remainingBill,
    subtotal,
    uniqueCode,
    formatPrice
}: OrderConfirmationProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Capture props when modal opens to prevent flickering during submission
    const [frozenProps, setFrozenProps] = React.useState<any>(null);

    React.useEffect(() => {
        if (isOpen && !frozenProps) {
            setFrozenProps({
                shippingForm,
                paymentMethod,
                paymentAccountNumber,
                paymentAccountName,
                cartItems,
                grandTotal,
                shippingPrice,
                packingFee,
                voucherDiscount,
                appliedWalletAmount,
                remainingBill,
                subtotal,
                uniqueCode,
                formatPrice
            });
        } else if (!isOpen) {
            setFrozenProps(null);
        }
    }, [isOpen, shippingForm, paymentMethod, paymentAccountNumber, paymentAccountName, cartItems, grandTotal, shippingPrice, packingFee, voucherDiscount, appliedWalletAmount, remainingBill, subtotal, formatPrice, frozenProps]);

    const activeProps = frozenProps || {
        shippingForm,
        paymentMethod,
        paymentAccountNumber,
        paymentAccountName,
        cartItems,
        grandTotal,
        shippingPrice,
        packingFee,
        voucherDiscount,
        appliedWalletAmount,
        remainingBill,
        subtotal,
        uniqueCode,
        formatPrice
    };

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
                <DialogContent className="sm:max-w-[480px] w-[95vw] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl max-h-[96vh] flex flex-col">
                    <DialogHeader className="p-6 pb-0">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-neutral-base-900 flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-[20px] font-bold tracking-tight text-neutral-base-900">Konfirmasi Pesanan</DialogTitle>
                                <DialogDescription className="text-[12px] text-neutral-base-400">Silakan periksa kembali detail pesanan Anda</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-2 overscroll-contain custom-scrollbar">
                        <ResumeContent {...activeProps} />
                    </div>
                    <DialogFooter className="p-6 pt-0">
                        <div className="flex flex-col md:flex-row-reverse items-center gap-4 w-full">
                            <div className="w-full md:flex-1">
                                <ConfirmButton isSubmitting={isSubmitting} isSuccess={isSuccess} onConfirm={onConfirm} />
                            </div>
                            <button
                                disabled={isSubmitting}
                                onClick={onClose}
                                className="w-full md:w-auto px-8 py-4 text-[13px] font-bold text-neutral-base-300 hover:text-neutral-base-900 uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                Periksa Kembali
                            </button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()} dismissible={!isSubmitting}>
            <DrawerContent className="rounded-t-[32px] max-h-[96vh] p-0">
                <div className="mx-auto w-12 h-1.5 bg-neutral-base-100 rounded-full mt-3 mb-2" />
                <DrawerHeader className="px-6 py-4">
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-base-900 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <DrawerTitle className="text-[18px] font-bold tracking-tight text-neutral-base-900">Konfirmasi Pesanan</DrawerTitle>
                            <DrawerDescription className="text-[12px] text-neutral-base-400">Silakan periksa kembali detail pesanan Anda</DrawerDescription>
                        </div>
                    </div>
                </DrawerHeader>
                <div className="px-6 overflow-y-auto overscroll-contain pb-6">
                    <ResumeContent {...activeProps} />
                    <div className="mt-4">
                        <ConfirmButton isSubmitting={isSubmitting} isSuccess={isSuccess} onConfirm={onConfirm} />
                        <button
                            disabled={isSubmitting}
                            onClick={onClose}
                            className="w-full py-4 text-[13px] font-bold text-neutral-base-300 uppercase tracking-widest mt-2 disabled:opacity-30"
                        >
                            Periksa Kembali
                        </button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
