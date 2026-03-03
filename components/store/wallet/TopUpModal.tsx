"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Check, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import CONFIG from "@/lib/config";

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTopUp: (amount: number) => Promise<void>;
    isLoading: boolean;
}

export default function TopUpModal({ isOpen, onClose, onTopUp, isLoading }: TopUpModalProps) {
    const [amount, setAmount] = useState<string>("");

    const handlePredefinedClick = (val: number) => {
        setAmount(val.toString());
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl">
                <DialogHeader className="space-y-4">
                    <div className="w-14 h-14 bg-neutral-base-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-neutral-base-900/20">
                        <Wallet className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                        <DialogTitle className="text-2xl font-black tracking-tight text-neutral-base-900">Top Up Wallet</DialogTitle>
                        <DialogDescription className="text-neutral-base-400 font-medium">
                            Tambah saldo wallet Anda untuk kemudahan bertransaksi.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-8 py-4">
                    <div className="space-y-4">
                        <Label htmlFor="amount" className="text-[12px] font-bold uppercase tracking-[0.2em] text-neutral-base-400 pl-1">
                            Nominal Top Up
                        </Label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-neutral-base-400 group-focus-within:text-neutral-base-900 transition-colors">Rp</span>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="h-16 pl-12 text-2xl font-bold bg-neutral-base-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-neutral-base-900 transition-all"
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
                                        "h-12 rounded-xl text-[13px] font-bold transition-all border-2",
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

                    <DialogFooter className="sm:justify-start">
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
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
