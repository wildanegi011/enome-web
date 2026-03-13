"use client";

import React from "react";
import FallbackImage from "@/components/store/shared/FallbackImage";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, ChevronRight, MapPin, Truck } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn, formatCurrency } from "@/lib/utils";
import { ASSET_URL } from "@/config/config";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import TrackingModal from "./detail/TrackingModal";

export interface Order {
    orderId: string;
    tglOrder: string;
    statusOrder: string;
    statusTagihan: string;
    totalTagihan: number;
    metodebayar: string;
    totalOrder: number;
    updatedAt: string;
    firstItemName?: string;
    firstItemImage?: string;
    firstItemSize?: string;
    itemCount?: number;
    noResi?: string;
    ekspedisi?: string;
    teleponPenerima?: string;
}

interface OrderCardProps {
    order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
    const [isTrackingOpen, setIsTrackingOpen] = React.useState(false);

    const status = CONFIG.ORDER_STATUS.STYLES[order.statusOrder] || {
        label: order.statusOrder,
        color: "text-neutral-base-400",
        bg: "bg-neutral-base-50"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-neutral-base-100 rounded-[24px] md:rounded-3xl p-4 sm:p-5 md:p-8 hover:shadow-xl hover:shadow-neutral-base-900/5 transition-all group"
        >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-neutral-base-50">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 rounded-xl bg-neutral-base-50 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-5 h-5 text-neutral-base-300" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[14px] font-bold text-neutral-base-900 uppercase tracking-tight">{order.orderId}</h3>
                            <span className={cn("px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest", status.bg, status.color)}>
                                {status.label}
                            </span>
                            {order.statusTagihan === 'KADALUARSA' && (
                                <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100">
                                    Kadaluarsa
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-neutral-base-400 font-medium mt-0.5 md:mt-1">
                            {order.updatedAt ? format(new Date(order.updatedAt.replace(" ", "T").replace("Z", "")), "dd MMM yyyy • HH:mm", { locale: id }) : order.tglOrder} WIB
                        </p>
                    </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                    <p className="text-[12px] font-bold text-neutral-base-300 uppercase tracking-widest mb-1.5">Total Belanja</p>
                    <p className="text-[16px] font-medium text-neutral-base-900 leading-none">
                        {formatCurrency(order.totalTagihan)}
                    </p>
                </div>
            </div>

            {/* Card Body */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 md:gap-6 w-full">
                    <div className="w-16 h-20 md:w-20 md:h-24 bg-neutral-base-50 rounded-xl md:rounded-2xl overflow-hidden relative shrink-0 border border-neutral-base-50">
                        <FallbackImage
                            src={order.firstItemImage ? `${ASSET_URL}/img/${order.firstItemImage}` : "/placeholder-product.jpg"}

                            alt={order.firstItemName || "Produk"}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                        <h4 className="text-[16px] font-bold text-neutral-base-900 line-clamp-1">{order.firstItemName}</h4>
                        <p className="text-[14px] text-neutral-base-400 font-medium mt-1">
                            {order.firstItemSize && `Ukuran: ${order.firstItemSize} • `}
                            {order.itemCount && order.itemCount > 1 ? `${order.totalOrder} barang` : "1 barang"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <Link
                        href={`/account/orders/${encodeURIComponent(order.orderId)}`}
                        className="flex-1 md:flex-none h-11 md:h-12 inline-flex items-center justify-center px-6 md:px-8 bg-white border border-neutral-base-100 text-neutral-base-900 rounded-[14px] md:rounded-xl text-[12px] font-bold hover:bg-neutral-base-50 transition-all gap-2 group/btn"
                    >
                        Detail
                        <ChevronRight className="w-4 h-4 text-neutral-base-300 group-hover/btn:translate-x-0.5 group-hover/btn:text-neutral-base-900 transition-all" />
                    </Link>
                    {order.statusOrder === "KIRIM" && order.noResi && CONFIG.TRACKABLE_COURIERS.includes(order.ekspedisi?.toLowerCase() || "") && (
                        <Button
                            onClick={() => setIsTrackingOpen(true)}
                            className="flex-1 md:flex-none h-11 md:h-12 px-6 md:px-8 bg-neutral-base-900 text-white rounded-[14px] md:rounded-xl text-[12px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-neutral-base-900/10 hover:opacity-90 transition-all active:scale-[0.98]"
                        >
                            <Truck className="w-4 h-4" />
                            <span className="hidden sm:inline">Lacak Pesanan</span>
                            <span className="sm:hidden">Lacak</span>
                        </Button>
                    )}
                </div>
            </div>

            <TrackingModal
                isOpen={isTrackingOpen}
                onClose={() => setIsTrackingOpen(false)}
                awb={order.noResi || ""}
                courier={order.ekspedisi || ""}
                phone={order.teleponPenerima || ""}
            />
        </motion.div>
    );
}
