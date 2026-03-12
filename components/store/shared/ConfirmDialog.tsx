"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
}

export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmText = "Konfirmasi",
    cancelText = "Batal",
    variant = "default",
}: ConfirmDialogProps) {
    const isMobile = useIsMobile();

    const Content = () => (
        <div className="flex flex-col gap-6">
            <div className="space-y-3">
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-neutral-base-900 leading-tight">
                    {title}
                </h2>
                <p className="text-neutral-base-500 font-medium leading-relaxed text-sm md:text-base">
                    {description}
                </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
                <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="h-12 md:h-14 flex-1 rounded-xl md:rounded-2xl border-neutral-base-100 text-neutral-base-500 font-bold px-8 uppercase tracking-widest text-[11px] md:text-xs active:scale-95 transition-all"
                >
                    {cancelText}
                </Button>
                <Button
                    variant={variant}
                    onClick={() => {
                        onConfirm();
                        onOpenChange(false);
                    }}
                    className={cn(
                        "h-12 md:h-14 flex-1 rounded-xl md:rounded-2xl font-black px-10 uppercase tracking-[0.2em] text-[11px] md:text-xs shadow-lg transition-all active:scale-95",
                        variant === "destructive"
                            ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                            : "bg-neutral-base-900 hover:bg-neutral-base-800 text-white shadow-neutral-base-900/20"
                    )}
                >
                    {confirmText}
                </Button>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="p-8 pb-10 border-none bg-white rounded-t-[32px] outline-hidden">
                    <DrawerHeader className="sr-only">
                        <DrawerTitle>{title}</DrawerTitle>
                        <DrawerDescription>{description}</DrawerDescription>
                    </DrawerHeader>
                    <Content />
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90dvh] overflow-y-auto no-scrollbar rounded-3xl border-none shadow-2xl p-8 outline-hidden">
                <style jsx global>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
                <AlertDialogHeader className="hidden">
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <Content />
            </AlertDialogContent>
        </AlertDialog>
    );
}
