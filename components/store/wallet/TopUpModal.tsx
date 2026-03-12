"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Loader2, X } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import CONFIG from "@/lib/config";
import { useIsMobile } from "@/hooks/use-mobile";

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTopUp: (amount: number) => Promise<void>;
    isLoading: boolean;
}

export default function TopUpModal({ isOpen, onClose, onTopUp, isLoading }: TopUpModalProps) {
    const isMobile = useIsMobile();
    const [amount, setAmount] = useState<string>("");

    const formatNumber = (val: string) => {
        if (!val) return "";
        const num = val.replace(/\D/g, "");
        return new Intl.NumberFormat("id-ID").format(parseInt(num));
    };

    const parseNumber = (val: string) => {
        return val.replace(/\D/g, "");
    };

    const handlePredefinedClick = (val: number) => {
        setAmount(val.toString());
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = parseNumber(e.target.value);
        setAmount(rawValue);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseInt(amount);

        if (isNaN(numAmount) || numAmount < 10000) {
            toast.error("Minimal top up adalah Rp 10.000");
            return;
        }

        try {
            await onTopUp(numAmount);
            toast.success("Top up berhasil!");
            setAmount("");
            onClose();
        } catch (error) {
            toast.error("Gagal melakukan top up. Silakan coba lagi.");
        }
    };

    const TopUpHeader = () => (
        <div className="p-8 pb-4 bg-white shrink-0 space-y-4 relative">
            <div className="w-14 h-14 bg-neutral-base-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-neutral-base-900/20">
                <Wallet className="w-7 h-7" />
            </div>
            <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-neutral-base-900">Top Up Wallet</h2>
                <p className="text-neutral-base-400 font-medium text-sm">
                    Tambah saldo wallet Anda untuk kemudahan bertransaksi.
                </p>
            </div>
            {isMobile && (
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full bg-neutral-base-50 text-neutral-base-400 hover:text-neutral-base-900 transition-colors"
                >
                    <X size={20} />
                </button>
            )}
        </div>
    );

    const TopUpForm = () => (
        <form onSubmit={handleSubmit} className="space-y-8 py-4">
            <div className="space-y-4 text-left">
                <Label htmlFor="amount" className="text-[12px] font-black uppercase tracking-[0.2em] text-neutral-base-400 pl-1">
                    Nominal Top Up
                </Label>
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-neutral-base-400 group-focus-within:text-neutral-base-900 transition-colors">Rp</span>
                    <Input
                        id="amount"
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={formatNumber(amount)}
                        onChange={handleInputChange}
                        className="h-16 pl-12 text-2xl font-bold bg-neutral-base-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-neutral-base-900 transition-all outline-hidden"
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {CONFIG.PREDEFINED_AMOUNTS.map((val) => (
                        <button
                            key={val}
                            type="button"
                            onClick={() => handlePredefinedClick(val)}
                            className={cn(
                                "h-12 rounded-xl text-[13px] font-bold transition-all border-2 active:scale-95",
                                amount === val.toString()
                                    ? "bg-neutral-base-900 border-neutral-base-900 text-white shadow-lg shadow-neutral-base-900/10"
                                    : "bg-white border-neutral-base-100 text-neutral-base-600 hover:border-neutral-base-200"
                            )}
                        >
                            {formatCurrency(val)}
                        </button>
                    ))}
                </div>
            </div>

            <Button
                type="submit"
                disabled={isLoading || !amount}
                className="w-full h-14 bg-neutral-base-900 hover:bg-neutral-base-800 text-white rounded-2xl font-bold text-[13px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-neutral-base-900/20"
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    "Konfirmasi Top Up"
                )}
            </Button>
        </form>
    );

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={onClose}>
                <DrawerContent className="p-0 border-none bg-white rounded-t-[32px] outline-hidden max-h-[90dvh]">
                    <DrawerHeader className="p-0 shrink-0">
                        <DrawerTitle className="sr-only">Top Up Wallet</DrawerTitle>
                        <DrawerDescription className="sr-only">Tambah saldo wallet Anda</DrawerDescription>
                        <TopUpHeader />
                    </DrawerHeader>
                    <div className="overflow-y-auto no-scrollbar px-8 pb-8">
                        <style jsx global>{`
                            .no-scrollbar::-webkit-scrollbar { display: none; }
                            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                        `}</style>
                        <TopUpForm />
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full sm:max-w-[425px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl flex flex-col outline-hidden">
                <DialogHeader className="p-0">
                    <DialogTitle className="sr-only">Top Up Wallet</DialogTitle>
                    <DialogDescription className="sr-only">Tambah saldo wallet Anda</DialogDescription>
                    <TopUpHeader />
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-8 pb-8">
                    <style jsx global>{`
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    `}</style>
                    <TopUpForm />
                </div>
            </DialogContent>
        </Dialog>
    );
}
