"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { Truck, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import TrackingManifest from "./TrackingManifest";
import { useIsMobile } from "@/hooks/use-mobile";

interface TrackingModalProps {
    isOpen: boolean;
    onClose: () => void;
    awb: string;
    courier: string;
    phone: string;
}

export default function TrackingModal({
    isOpen,
    onClose,
    awb,
    courier,
    phone
}: TrackingModalProps) {
    const isMobile = useIsMobile();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const TrackingHeader = () => (
        <div className="p-6 md:p-8 pb-4 bg-white shrink-0 relative">
            <h2 className="text-xl md:text-2xl font-black text-neutral-base-900 flex items-center justify-between gap-3">
                <span className="flex items-center gap-3">
                    <Truck className="w-5 h-5 md:w-6 md:h-6" />
                    Lacak Pesanan
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setIsRefreshing(true);
                            setTimeout(() => setIsRefreshing(false), 1000);
                        }}
                        className={cn(
                            "p-2 hover:bg-neutral-base-50 rounded-xl transition-all active:scale-95",
                            isRefreshing && "animate-spin"
                        )}
                        title="Perbarui status"
                    >
                        <RotateCw className="w-5 h-5 text-neutral-base-400" />
                    </button>
                    {isMobile && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-neutral-base-50 text-neutral-base-400 hover:text-neutral-base-900 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </h2>
            <p className="text-neutral-base-400 font-medium text-[13px] md:text-base mt-2">
                Resi: <span className="text-neutral-base-900 font-bold">{awb}</span> ({courier.toUpperCase()})
            </p>
        </div>
    );

    const TrackingBody = () => (
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-[#F9FAFB] px-6 md:px-8 py-5">
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <TrackingManifest
                key={`${awb}-${isRefreshing}`}
                awb={awb}
                courier={courier}
                phone={phone}
            />
        </div>
    );

    const TrackingFooter = () => (
        <div className="p-6 bg-white border-t border-neutral-base-50 flex justify-end shrink-0">
            <button
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3.5 bg-neutral-base-900 text-white rounded-2xl text-[13px] font-bold hover:opacity-90 transition-all active:scale-[0.98] outline-hidden"
            >
                Tutup Halaman
            </button>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DrawerContent className="h-[90dvh] flex flex-col p-0 border-none bg-white rounded-t-[32px] outline-hidden">
                    <DrawerHeader className="p-0">
                        <DrawerTitle className="sr-only">Lacak Pesanan</DrawerTitle>
                        <DrawerDescription className="sr-only">Informasi status pengiriman paket Anda</DrawerDescription>
                        <TrackingHeader />
                    </DrawerHeader>
                    <TrackingBody />
                    <TrackingFooter />
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-full sm:max-w-[650px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl flex flex-col outline-hidden">
                <DialogHeader className="p-0">
                    <DialogTitle className="sr-only">Lacak Pesanan</DialogTitle>
                    <DialogDescription className="sr-only">Informasi status pengiriman paket Anda</DialogDescription>
                    <TrackingHeader />
                </DialogHeader>
                <TrackingBody />
                <TrackingFooter />
            </DialogContent>
        </Dialog>
    );
}
