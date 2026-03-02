"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import {
    ShoppingBag, Search, Package, MapPin, Loader2, Calendar as CalendarIcon, ChevronRight, User as UserIcon, Heart
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/store/Navbar";
import UserSidebar from "@/components/store/UserSidebar";
import AccountSidebarMobile from "@/components/store/AccountSidebarMobile";
import Image from "next/image";
import { format, subMonths, subDays, startOfDay, endOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { ASSET_URL } from "@/config/config";
import { CONFIG } from "@/lib/config";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import ResultsInfo from "@/components/store/ResultsInfo";

interface Order {
    orderId: string;
    tglOrder: string;
    statusOrder: string;
    statusTagihan: string;
    totalTagihan: number;
    metodebayar: string;
    totalOrder: number;
    updatedAt: string;
    // Enhanced data
    firstItemName?: string;
    firstItemImage?: string;
    firstItemSize?: string;
    itemCount?: number;
}


const OrderCardSkeleton = () => (
    <div className="bg-white border border-neutral-base-100 rounded-[28px] md:rounded-3xl p-5 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-base-50">
            <div className="flex items-center gap-3 md:gap-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-20 h-5" />
                        <Skeleton className="w-16 h-4" />
                    </div>
                    <Skeleton className="w-32 h-3" />
                </div>
            </div>
            <div className="space-y-2 text-left sm:text-right w-full sm:w-auto">
                <Skeleton className="w-20 h-3 sm:ml-auto" />
                <Skeleton className="w-28 h-5 sm:ml-auto" />
            </div>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 md:gap-6 w-full">
                <Skeleton className="w-16 h-20 md:w-20 md:h-24 rounded-xl md:rounded-2xl shrink-0" />
                <div className="flex-1 space-y-3">
                    <Skeleton className="w-3/4 h-5" />
                    <Skeleton className="w-1/2 h-4" />
                    <Skeleton className="w-24 h-5 mt-2" />
                </div>
            </div>
            <div className="flex gap-2 md:gap-3 w-full md:w-auto">
                <Skeleton className="flex-1 md:w-32 h-11 md:h-12 rounded-[14px] md:rounded-xl" />
                <Skeleton className="flex-1 md:w-32 h-11 md:h-12 rounded-[14px] md:rounded-xl" />
            </div>
        </div>
    </div>
);

const menuItems = [
    { title: "Profil Saya", icon: UserIcon, href: "/account/profile" },
    { title: "Daftar Alamat", icon: MapPin, href: "/account/addresses" },
    { title: "Riwayat Transaksi", icon: ShoppingBag, href: "/account/orders" },
    { title: "Wishlist", icon: Heart, href: "/account/wishlist" },
];

export default function OrderHistoryPage() {
    const pathname = usePathname();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [activeTab, setActiveTab] = useState("ALL");
    const [tabs, setTabs] = useState<{ label: string, value: string }[]>([{ label: "Semua", value: "ALL" }]);

    const datePresets = [
        { id: "today", label: CONFIG.ORDER_HISTORY.DATE_PRESETS[0].label, getRange: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
        { id: "yesterday", label: CONFIG.ORDER_HISTORY.DATE_PRESETS[1].label, getRange: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
        { id: "7days", label: CONFIG.ORDER_HISTORY.DATE_PRESETS[2].label, getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
        { id: "3months", label: CONFIG.ORDER_HISTORY.DATE_PRESETS[3].label, getRange: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
    ];

    const [dateRange, setDateRange] = useState<DateRange | undefined>(datePresets[3].getRange());

    const limit = CONFIG.ORDER_HISTORY.PAGINATION_LIMIT;

    const fetchOrders = async (page: number) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: searchQuery,
            });

            if (dateRange?.from) params.append("startDate", format(dateRange.from, "yyyy-MM-dd"));
            if (dateRange?.to) params.append("endDate", format(dateRange.to, "yyyy-MM-dd"));
            if (activeTab !== "ALL") params.append("statusOrder", activeTab);

            const response = await fetch(`/api/user/orders?${params.toString()}`);
            const data = await response.json();
            setOrders(data.orders || []);
            setTotalOrders(data.total || 0);
            if (data.tabs && data.tabs.length > 0) {
                setTabs(data.tabs);
            }
        } catch (error) {
            console.error("Gagal mengambil data pesanan:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Reset page to 1 when filters change
        setCurrentPage(1);
        fetchOrders(1);
    }, [searchQuery, dateRange, activeTab]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchOrders(page);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const totalPages = Math.ceil(totalOrders / limit);

    return (
        <div className="min-h-screen bg-neutral-base-50/30 font-sans text-neutral-base-900">
            <Navbar />

            <main className="max-w-[1340px] mx-auto px-3 sm:px-4 md:px-8 py-6 md:py-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="hidden lg:block">
                        <UserSidebar />
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex flex-col gap-1">
                                <h1 className="text-[26px] md:text-[32px] font-black text-neutral-base-900 tracking-tight">Riwayat Pesanan</h1>
                                <p className="text-[12px] md:text-[14px] text-neutral-base-400 font-medium">Lacak dan kelola semua pesanan Anda di sini.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <AccountSidebarMobile />
                            </div>
                        </div>

                        {/* Status Tabs */}
                        <div className="bg-white border border-neutral-base-100 rounded-3xl md:rounded-[32px] p-1 mb-6 flex items-center overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-2 shadow-sm">
                            <div className="flex items-center w-full min-w-max">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.value}
                                        onClick={() => setActiveTab(tab.value)}
                                        className={cn(
                                            "flex-1 min-w-[120px] py-4 text-[13px] font-bold transition-all relative",
                                            activeTab === tab.value
                                                ? "text-neutral-base-900"
                                                : "text-neutral-base-400 hover:text-neutral-base-600"
                                        )}
                                    >
                                        {tab.label}
                                        {activeTab === tab.value && (
                                            <motion.div
                                                layoutId="activeStatus"
                                                className="absolute bottom-0 left-6 right-6 h-0.5 bg-neutral-base-900"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search & Date Filter Bar */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 mb-8">
                            <div className="relative group flex-1 w-full">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300 group-focus-within:text-neutral-base-900 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cari Order ID atau Nama Produk..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 pl-12 pr-6 rounded-2xl border border-neutral-base-100 bg-white text-[13px] font-medium outline-none focus:ring-4 focus:ring-neutral-base-900/5 transition-all"
                                />
                            </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-12 px-5 rounded-2xl border-neutral-base-100 text-[12px] font-bold gap-3 bg-neutral-base-50/30 md:bg-white shadow-none w-full sm:min-w-[200px] sm:w-auto justify-start text-left focus:ring-4 focus:ring-neutral-base-900/5 transition-all outline-none",
                                            !dateRange?.from && "text-neutral-base-400"
                                        )}
                                    >
                                        <CalendarIcon className="w-4 h-4 text-neutral-base-300" />
                                        <span>
                                            {(() => {
                                                if (!dateRange?.from) return "Pilih Tanggal";
                                                const preset = datePresets.find(p => {
                                                    const r = p.getRange();
                                                    return r.from?.toDateString() === dateRange.from?.toDateString() &&
                                                        r.to?.toDateString() === dateRange.to?.toDateString();
                                                });
                                                if (preset) return preset.label;
                                                return dateRange.to
                                                    ? `${format(dateRange.from, "dd MMM")} - ${format(dateRange.to, "dd MMM yyyy")}`
                                                    : format(dateRange.from, "dd MMM yyyy");
                                            })()}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-neutral-base-100 shadow-2xl flex flex-col md:flex-row" align="end">
                                    <div className="p-4 border-b md:border-b-0 md:border-r border-neutral-base-50 bg-neutral-base-50/50 min-w-[180px] space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-base-300 mb-3 px-2">Pilihan Cepat</p>
                                        {datePresets.map((preset) => (
                                            <button
                                                key={preset.id}
                                                onClick={() => setDateRange(preset.getRange())}
                                                className={cn(
                                                    "w-full text-left px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all",
                                                    datePresets.find(p => {
                                                        const r = p.getRange();
                                                        return r.from?.toDateString() === dateRange?.from?.toDateString() &&
                                                            r.to?.toDateString() === dateRange?.to?.toDateString();
                                                    })?.id === preset.id
                                                        ? "bg-neutral-base-900 text-white"
                                                        : "text-neutral-base-500 hover:bg-white hover:text-neutral-base-900"
                                                )}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-2">
                                        <CalendarComponent
                                            mode="range"
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                            numberOfMonths={1}
                                            disabled={(date) => date > new Date()}
                                            className="p-3"
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Total Info */}
                        {!isLoading && orders.length > 0 && (
                            <ResultsInfo
                                currentPage={currentPage}
                                itemsPerPage={limit}
                                totalItems={totalOrders}
                                label="pesanan"
                                className="mb-4 px-1"
                            />
                        )}

                        {/* Order Cards List */}
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="space-y-4">
                                    <OrderCardSkeleton />
                                    <OrderCardSkeleton />
                                    <OrderCardSkeleton />
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="py-32 text-center bg-white border border-neutral-base-100 rounded-[32px]">
                                    <ShoppingBag className="w-12 h-12 text-neutral-base-100 mx-auto mb-6" />
                                    <h2 className="text-[20px] font-bold text-neutral-base-900 mb-2">Belum ada transaksi</h2>
                                    <p className="text-[14px] text-neutral-base-400 font-medium mb-8">Anda belum memiliki riwayat transaksi apa pun.</p>
                                    <Link href="/products" className="inline-flex h-12 items-center px-8 bg-neutral-base-900 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-neutral-base-800 transition-all">
                                        Mulai Belanja
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    {orders.map((order) => {
                                        const status = CONFIG.ORDER_STATUS.STYLES[order.statusOrder] || { label: order.statusOrder, color: "text-neutral-base-400", bg: "bg-neutral-base-50" };
                                        return (
                                            <motion.div
                                                key={order.orderId}
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
                                                                <h3 className="text-[14px] md:text-[15px] font-bold text-neutral-base-900 uppercase tracking-tight">{order.orderId}</h3>
                                                                <span className={cn("px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest", status.bg, status.color)}>
                                                                    {status.label}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] md:text-[12px] text-neutral-base-400 font-medium mt-0.5 md:mt-1">
                                                                {order.updatedAt ? format(new Date(order.updatedAt.replace(" ", "T").replace("Z", "")), "dd MMM yyyy • HH:mm", { locale: id }) : order.tglOrder} WIB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-left sm:text-right shrink-0">
                                                        <p className="text-[10px] md:text-[11px] font-black text-neutral-base-300 uppercase tracking-widest mb-1">Total Belanja</p>
                                                        <p className="text-[16px] md:text-[18px] font-black text-neutral-base-900 leading-none">
                                                            {formatPrice(order.totalTagihan)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Card Body */}
                                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4 md:gap-6 w-full">
                                                        <div className="w-16 h-20 md:w-20 md:h-24 bg-neutral-base-50 rounded-xl md:rounded-2xl overflow-hidden relative shrink-0 border border-neutral-base-50">
                                                            <Image
                                                                src={order.firstItemImage ? `${ASSET_URL}/img/produk/${order.firstItemImage}` : "/placeholder-product.jpg"}
                                                                alt={order.firstItemName || "Produk"}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <div className="min-w-0 pr-4">
                                                            <h4 className="text-[14px] md:text-[16px] font-bold text-neutral-base-900 truncate max-w-full">{order.firstItemName}</h4>
                                                            <p className="text-[11px] md:text-[12px] text-neutral-base-400 font-medium mt-1">
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
                                                        {order.statusOrder === "PESANAN DIKIRIM" && (
                                                            <Button className="flex-1 md:flex-none h-11 md:h-12 px-6 md:px-8 bg-neutral-base-900 text-white rounded-[14px] md:rounded-xl text-[12px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-neutral-base-900/10">
                                                                <span className="hidden sm:inline">Lacak Pesanan</span>
                                                                <span className="sm:hidden">Lacak</span>
                                                                <MapPin className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {/* Pagination */}
                                    {totalOrders > limit && (
                                        <div className="pt-10 flex justify-center">
                                            <Pagination>
                                                <PaginationContent className="gap-2">
                                                    <PaginationItem>
                                                        <PaginationPrevious
                                                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                                            className={cn("h-11 px-4 rounded-xl border-neutral-base-100", currentPage === 1 && "opacity-30 pointer-events-none")}
                                                        />
                                                    </PaginationItem>
                                                    {(() => {
                                                        const pages = [];
                                                        const maxVisiblePages = 5;

                                                        if (totalPages <= maxVisiblePages) {
                                                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                                                        } else {
                                                            pages.push(1);
                                                            if (currentPage > 3) pages.push('ellipsis-start');

                                                            const startPage = Math.max(2, currentPage - 1);
                                                            const endPage = Math.min(totalPages - 1, currentPage + 1);

                                                            for (let i = startPage; i <= endPage; i++) {
                                                                if (i !== 1 && i !== totalPages) pages.push(i);
                                                            }

                                                            if (currentPage < totalPages - 2) pages.push('ellipsis-end');
                                                            if (totalPages > 1) pages.push(totalPages);
                                                        }

                                                        return pages.map((page, i) => (
                                                            <PaginationItem key={i}>
                                                                {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                                                                    <span className="flex w-11 h-11 items-center justify-center text-neutral-base-400">
                                                                        <PaginationEllipsis />
                                                                    </span>
                                                                ) : (
                                                                    <PaginationLink
                                                                        isActive={currentPage === page}
                                                                        onClick={() => handlePageChange(page as number)}
                                                                        className={cn(
                                                                            "w-11 h-11 rounded-xl transition-all",
                                                                            currentPage === page ? "bg-neutral-base-900 text-white" : "hover:bg-neutral-base-50"
                                                                        )}
                                                                    >
                                                                        {page}
                                                                    </PaginationLink>
                                                                )}
                                                            </PaginationItem>
                                                        ));
                                                    })()}
                                                    <PaginationItem>
                                                        <PaginationNext
                                                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                                            className={cn("h-11 px-4 rounded-xl border-neutral-base-100", currentPage === totalPages && "opacity-30 pointer-events-none")}
                                                        />
                                                    </PaginationItem>
                                                </PaginationContent>
                                            </Pagination>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

