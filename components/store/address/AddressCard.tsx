"use client";

import { MapPin, Map, ChevronRight, MoreVertical, Edit2, Star, Trash2, CheckCircle2, Navigation2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn, toTitleCase, joinAddress } from "@/lib/utils";
import { Address } from "@/hooks/use-addresses";

export type AddressCardVariant = "account" | "selection" | "checkout";

interface AddressCardProps {
    address: Address;
    variant?: AddressCardVariant;
    isSelectable?: boolean;
    onSelect?: (address: Address) => void;
    onEdit?: (address: Address) => void;
    onDelete?: (id: number) => void;
    onSetPrimary?: (id: number) => void;
    onReset?: () => void;
    className?: string;
}

export default function AddressCard({
    address,
    variant = "account",
    isSelectable,
    onSelect,
    onEdit,
    onDelete,
    onSetPrimary,
    onReset,
    className
}: AddressCardProps) {
    const isAccount = variant === "account";
    const isSelection = variant === "selection";
    const isCheckout = variant === "checkout";

    return (
        <div
            className={cn(
                "bg-white rounded-[24px] md:rounded-[32px] transition-all duration-300 relative group flex flex-col",
                isAccount || isSelection ? "p-5 sm:p-6 md:p-8 border" : "p-0",
                address.isPrimary === 1 && (isAccount || isSelection)
                    ? "border-amber-800/20 shadow-xl shadow-amber-900/5 ring-4 ring-amber-50/10"
                    : isAccount || isSelection ? "border-neutral-base-100/60 hover:border-amber-800/10 hover:shadow-lg hover:shadow-neutral-base-900/5" : "",
                isSelectable && "cursor-pointer active:scale-[0.98]",
                className
            )}
            onClick={() => isSelectable && onSelect?.(address)}
        >
            <div className={cn("flex items-start justify-between", isCheckout ? "mb-4" : "mb-6")}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "rounded-2xl flex items-center justify-center transition-all",
                        isCheckout ? "w-10 h-10 rounded-xl" : "w-12 h-12",
                        address.isPrimary === 1 ? "bg-amber-800 text-white shadow-lg shadow-amber-800/20" : "bg-neutral-base-50 text-neutral-base-400"
                    )}>
                        <MapPin className={isCheckout ? "w-5 h-5" : "w-6 h-6"} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                                "font-bold tracking-widest text-neutral-base-900",
                                isCheckout ? "text-[11px] md:text-[12px]" : "text-[13px] md:text-sm"
                            )}>{toTitleCase(address.label)}</span>
                            {address.isPrimary === 1 && !isCheckout && (
                                <span className="bg-amber-50 text-amber-800 text-[9px] md:text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full border border-amber-200/50">Utama</span>
                            )}
                        </div>
                        <p className={cn(
                            "font-bold text-neutral-base-400",
                            isCheckout ? "text-[10px] md:text-[11px]" : "text-[12px] md:text-[13px]"
                        )}>{toTitleCase(address.shopName || "Alamat Personal")}</p>
                    </div>
                </div>

                {isAccount && (onEdit || onDelete || onSetPrimary) && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="w-10 h-10 p-0 rounded-2xl hover:bg-neutral-base-50">
                                    <MoreVertical className="w-5 h-5 text-neutral-base-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-2 rounded-[20px] border-neutral-base-100/60 bg-white/95 backdrop-blur-xl shadow-2xl">
                                {onEdit && (
                                    <DropdownMenuItem
                                        onClick={() => onEdit(address)}
                                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:bg-neutral-base-50"
                                    >
                                        <Edit2 className="w-4 h-4 text-neutral-base-600" />
                                        <span className="text-[13px] font-bold">Ubah Alamat</span>
                                    </DropdownMenuItem>
                                )}
                                {onSetPrimary && address.isPrimary !== 1 && (
                                    <DropdownMenuItem
                                        onClick={() => onSetPrimary(address.id)}
                                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:bg-amber-50"
                                    >
                                        <Star className="w-4 h-4 text-amber-800" />
                                        <span className="text-[13px] font-bold">Set Jadi Utama</span>
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <DropdownMenuItem
                                        onClick={() => onDelete(address.id)}
                                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="text-[13px] font-bold">Hapus Alamat</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}

            </div>

            <div className={cn("grow", isCheckout ? "space-y-1.5 md:space-y-2" : "space-y-3 md:space-y-4 mb-6 md:mb-8")}>
                <div>
                    <p className={cn(
                        "font-bold text-neutral-base-900 mb-0.5",
                        isCheckout ? "text-[13px] md:text-[14px]" : "text-[13px] md:text-[14px]"
                    )}>{toTitleCase(address.receiverName)}</p>
                    <p className={cn(
                        "font-bold text-neutral-base-400",
                        isCheckout ? "text-[13px] md:text-[14px]" : "text-[13px] md:text-[14px]"
                    )}>{address.phoneNumber}</p>
                </div>
                <div className="flex gap-2.5 md:gap-3">
                    <Navigation2 className={cn("text-amber-800 shrink-0 mt-0.5", isCheckout ? "w-3 h-3 md:w-3.5 md:h-3.5" : "w-3.5 h-3.5 md:w-4 md:h-4")} />
                    <p className={cn(
                        "font-bold text-neutral-base-600 leading-relaxed tracking-tight",
                        isCheckout ? "text-[13px] md:text-[14px]" : "text-[13px] md:text-[14px]"
                    )}>
                        {(() => {
                            const addrStr = joinAddress(address.fullAddress, address.city, address.province, address.postalCode);
                            return addrStr ? toTitleCase(addrStr) : (
                                <span className="text-amber-700/60 italic font-medium">Alamat belum dilengkapi</span>
                            );
                        })()}
                    </p>
                </div>
            </div>

            {(isAccount || isSelection) && (onEdit || onDelete || onSetPrimary) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-neutral-base-50 mt-auto">
                    <div className="flex items-center gap-2">
                        {address.isPrimary === 1 ? (
                            <div className="flex items-center gap-2 text-amber-800 font-bold text-[10px] md:text-[11px] tracking-widest">
                                <CheckCircle2 className="w-4 h-4" /> Alamat Pengiriman Utama
                            </div>
                        ) : onSetPrimary && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSetPrimary(address.id);
                                }}
                                className="text-[10px] md:text-[11px] font-bold tracking-widest text-neutral-base-400 hover:text-amber-800 transition-colors"
                            >
                                Atur Sebagai Utama
                            </button>
                        )}
                    </div>
                    {/* <button className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-amber-800 flex items-center gap-1 group/btn self-end sm:self-auto">
                        Lihat di Map <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                    </button> */}
                </div>
            )}
        </div>
    );
}
