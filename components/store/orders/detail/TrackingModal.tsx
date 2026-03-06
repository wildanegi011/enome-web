"use client";

import React from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import TrackingManifest from "./TrackingManifest";

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

    const TrackingContent = () => (
        <div className="bg-[#F9FAFB] p-1">
            <ScrollArea className={cn("px-8 py-5", isMobile ? "h-[65vh]" : "h-[500px]")}>
                <TrackingManifest
                    awb={awb}
                    courier={courier}
                    phone={phone}
                />
            </ScrollArea>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DrawerContent className="rounded-t-[32px] border-none outline-none">
                    <DrawerHeader className="px-8 pt-8 pb-4">
                        <DrawerTitle className="text-2xl font-black text-neutral-base-900 flex items-center gap-3">
                            <Truck className="w-6 h-6" />
                            Lacak Pesanan
                        </DrawerTitle>
                        <DrawerDescription className="text-neutral-base-400 font-medium text-left">
                            Resi: <span className="text-neutral-base-900 font-bold">{awb}</span> ({courier.toUpperCase()})
                        </DrawerDescription>
                    </DrawerHeader>
                    <TrackingContent />
                    <div className="p-6 bg-white border-t border-neutral-base-50">
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-neutral-base-900 text-white rounded-2xl text-[14px] font-bold hover:opacity-90 transition-all active:scale-[0.98]"
                        >
                            Tutup
                        </button>
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
                <DialogHeader className="p-8 pb-4 bg-white">
                    <DialogTitle className="text-2xl font-black text-neutral-base-900 flex items-center gap-3">
                        <Truck className="w-6 h-6" />
                        Lacak Pesanan
                    </DialogTitle>
                    <DialogDescription className="text-neutral-base-400 font-medium">
                        Resi: <span className="text-neutral-base-900 font-bold">{awb}</span> ({courier.toUpperCase()})
                    </DialogDescription>
                </DialogHeader>

                <TrackingContent />

                <div className="p-6 bg-white border-t border-neutral-base-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-neutral-base-900 text-white rounded-2xl text-[13px] font-bold hover:opacity-90 transition-all active:scale-[0.98]"
                    >
                        Tutup
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
