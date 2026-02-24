"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import {
    ShoppingBag, Calendar, CreditCard, ChevronRight,
    ArrowLeft, Loader2, Package, CheckCircle2,
    Clock, AlertCircle, Search, ExternalLink,
    MoreHorizontal, Home, Filter, X, Calendar as CalendarIcon
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/store/Navbar";
import UserSidebar from "@/components/store/UserSidebar";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface Order {
    orderId: string;
    tglOrder: string;
    statusOrder: string;
    statusTagihan: string;
    totalTagihan: number;
    metodebayar: string;
    totalOrder: number;
}

interface StatusOrderOption {
    statusOrderId: string;
    statusOrderAdmin: string;
    statusOrderEnduser: string;
}

interface StatusTagihanOption {
    statusTagihanId: string;
    statusTagihanAdmin: string;
    statusTagihanEnduser: string;
}

const statusMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
    "OPEN": { label: "Pending", variant: "outline", icon: Clock },
    "BAYAR": { label: "Dibayar", variant: "secondary", icon: CheckCircle2 },
    "PROSES": { label: "Proses", variant: "default", icon: Package },
    "KIRIM": { label: "Dikirim", variant: "default", icon: Package },
    "SELESAI": { label: "Selesai", variant: "secondary", icon: CheckCircle2 },
    "BATAL": { label: "Batal", variant: "destructive", icon: AlertCircle },
};

const getStatusMetadata = (statusId: string, label?: string) => {
    const metadata = statusMap[statusId] || { label: label || statusId, variant: "outline", icon: Clock };
    if (label) metadata.label = label;
    return metadata;
};

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined,
    });
    const [statusOrder, setStatusOrder] = useState<string>("ALL");
    const [statusTagihan, setStatusTagihan] = useState<string>("ALL");

    const [orderStatusOptions, setOrderStatusOptions] = useState<StatusOrderOption[]>([]);
    const [tagihanStatusOptions, setTagihanStatusOptions] = useState<StatusTagihanOption[]>([]);

    const limit = 10;

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
            if (statusOrder !== "ALL") params.append("statusOrder", statusOrder);
            if (statusTagihan !== "ALL") params.append("statusTagihan", statusTagihan);

            const response = await fetch(`/api/user/orders?${params.toString()}`);
            const data = await response.json();
            setOrders(data.orders || []);
            setTotalOrders(data.total || 0);
        } catch (error) {
            console.error("Gagal mengambil data pesanan:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStatuses = async () => {
        try {
            const response = await fetch("/api/user/orders/statuses");
            const data = await response.json();
            setOrderStatusOptions(data.orderStatuses || []);
            setTagihanStatusOptions(data.tagihanStatuses || []);
        } catch (error) {
            console.error("Gagal mengambil opsi status");
        }
    };

    useEffect(() => {
        fetchStatuses();
    }, []);

    useEffect(() => {
        fetchOrders(currentPage);
    }, [currentPage, dateRange, statusOrder, statusTagihan]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [dateRange, statusOrder, statusTagihan, searchQuery]);

    // Handle search separately to avoid too many requests
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage === 1) {
                fetchOrders(1);
            } else {
                setCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const totalPages = Math.ceil(totalOrders / limit);

    return (
        <div className="min-h-screen bg-neutral-base-50 font-sans text-neutral-base-900 selection:bg-amber-100 selection:text-amber-900">
            <Navbar />

            <main className="max-w-[1240px] mx-auto px-6 py-12 md:py-16">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                    <UserSidebar />

                    <div className="flex-1 min-w-0">
                        {/* Breadcrumbs */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink asChild>
                                            <Link href="/" className="flex items-center gap-1.5 transition-colors hover:text-amber-800">
                                                <Home className="w-3.5 h-3.5" />
                                                <span>Home</span>
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="text-[11px] font-bold uppercase tracking-widest text-neutral-base-900">
                                            Riwayat Pesanan
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-10"
                        >
                            <h1 className="text-[32px] md:text-[42px] font-heading font-bold text-neutral-base-900 tracking-tight leading-tight mb-3">Pesanan <span className="text-amber-800">Saya</span></h1>
                            <p className="text-[14px] md:text-[16px] text-neutral-base-400 font-bold max-w-[600px] leading-relaxed">Kelola dan pantau semua transaksi belanja kamu di satu tempat yang aman dan terorganisir.</p>
                        </motion.div>

                        {/* Improved Filter Bar */}
                        <div className="bg-white/60 backdrop-blur-md border border-neutral-base-100/60 rounded-[28px] p-2 md:p-3 mb-10 shadow-sm">
                            <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
                                {/* Search Component */}
                                <div className="relative group flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300 group-focus-within:text-amber-800 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Cari ID Pesanan..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-12 md:h-14 bg-white/80 border-transparent rounded-[20px] pl-12 pr-6 text-[13px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-50/20 transition-all placeholder:text-neutral-base-300 shadow-none border border-neutral-base-50/50"
                                    />
                                </div>

                                <div className="hidden xl:block w-px h-8 bg-neutral-base-100/40 mx-1" />

                                {/* Filter Controls */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "h-12 md:h-14 px-5 rounded-[20px] border-neutral-base-100/40 text-[12px] font-bold gap-3 bg-white/80 shadow-none hover:bg-white transition-all min-w-[200px] justify-start text-left",
                                                        !dateRange?.from && "text-neutral-base-400",
                                                        dateRange?.from && "text-neutral-base-900 border-amber-800/20 bg-amber-50/30"
                                                    )}
                                                >
                                                    <CalendarIcon className={cn("w-4 h-4", dateRange?.from ? "text-amber-800" : "text-neutral-base-300")} />
                                                    <span className="truncate">
                                                        {dateRange?.from ? (
                                                            dateRange.to ? (
                                                                `${format(dateRange.from, "dd MMM", { locale: id })} - ${format(dateRange.to, "dd MMM yyyy", { locale: id })}`
                                                            ) : (
                                                                format(dateRange.from, "dd MMM yyyy", { locale: id })
                                                            )
                                                        ) : (
                                                            "Pilih Tanggal"
                                                        )}
                                                    </span>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-[28px] border-neutral-base-100 shadow-2xl overflow-hidden" align="end">
                                                <CalendarComponent
                                                    initialFocus
                                                    mode="range"
                                                    defaultMonth={dateRange?.from}
                                                    selected={dateRange}
                                                    onSelect={setDateRange}
                                                    numberOfMonths={2}
                                                    disabled={(date) => date > new Date()}
                                                    className="p-4"
                                                    classNames={{
                                                        day_range_middle: "bg-amber-50 text-amber-900",
                                                        day_selected: "bg-amber-800 text-white hover:bg-amber-800 hover:text-white focus:bg-amber-800 focus:text-white",
                                                        day_today: "bg-neutral-100 text-neutral-900",
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Order Status */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "h-12 md:h-14 px-6 rounded-[20px] border-neutral-base-100/40 text-[12px] font-bold gap-3 bg-white/80 shadow-none hover:bg-white transition-all",
                                                    statusOrder !== "ALL" ? "text-neutral-base-900 border-amber-800/20 bg-amber-50/30" : "text-neutral-base-400"
                                                )}
                                            >
                                                <Package className={cn("w-4 h-4", statusOrder !== "ALL" ? "text-amber-800" : "text-neutral-base-300")} />
                                                <span className="hidden sm:inline">
                                                    {statusOrder === "ALL" ? "Semua Status" : (orderStatusOptions.find(o => o.statusOrderId === statusOrder)?.statusOrderEnduser || statusOrder)}
                                                </span>
                                                {statusOrder !== "ALL" && <div className="w-1.5 h-1.5 rounded-full bg-amber-800" />}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[200px] p-2 rounded-[24px] border-neutral-base-100 shadow-2xl bg-white/95 backdrop-blur-xl">
                                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-base-400 px-3 py-2">Filter Status</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setStatusOrder("ALL")} className="text-[12px] font-bold p-3 cursor-pointer rounded-xl focus:bg-neutral-base-50">Semua Status</DropdownMenuItem>
                                            {orderStatusOptions.map((opt) => (
                                                <DropdownMenuItem key={opt.statusOrderId} onClick={() => setStatusOrder(opt.statusOrderId)} className="text-[12px] font-bold p-3 cursor-pointer rounded-xl focus:bg-neutral-base-50">
                                                    {opt.statusOrderEnduser}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Payment Status */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "h-12 md:h-14 px-6 rounded-[20px] border-neutral-base-100/40 text-[12px] font-bold gap-3 bg-white/80 shadow-none hover:bg-white transition-all",
                                                    statusTagihan !== "ALL" ? "text-neutral-base-900 border-emerald-500/20 bg-emerald-50/20" : "text-neutral-base-400"
                                                )}
                                            >
                                                <CreditCard className={cn("w-4 h-4", statusTagihan !== "ALL" ? "text-emerald-600" : "text-neutral-base-300")} />
                                                <span className="hidden sm:inline">
                                                    {statusTagihan === "ALL" ? "Status Bayar" : (tagihanStatusOptions.find(t => t.statusTagihanId === statusTagihan)?.statusTagihanEnduser || statusTagihan)}
                                                </span>
                                                {statusTagihan !== "ALL" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[200px] p-2 rounded-[24px] border-neutral-base-100 shadow-2xl bg-white/95 backdrop-blur-xl">
                                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-base-400 px-3 py-2">Filter Pembayaran</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setStatusTagihan("ALL")} className="text-[12px] font-bold p-3 cursor-pointer rounded-xl focus:bg-neutral-base-50">Semua Status</DropdownMenuItem>
                                            {tagihanStatusOptions.map((opt) => (
                                                <DropdownMenuItem key={opt.statusTagihanId} onClick={() => setStatusTagihan(opt.statusTagihanId)} className="text-[12px] font-bold p-3 cursor-pointer rounded-xl focus:bg-neutral-base-50">
                                                    {opt.statusTagihanEnduser}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <div className="flex-1" />

                                    {/* Action items */}
                                    <AnimatePresence>
                                        {(dateRange?.from || statusOrder !== "ALL" || statusTagihan !== "ALL" || searchQuery) && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setDateRange(undefined);
                                                        setStatusOrder("ALL");
                                                        setStatusTagihan("ALL");
                                                        setSearchQuery("");
                                                    }}
                                                    className="h-12 md:h-14 px-5 rounded-[20px] text-[11px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 hover:bg-red-50 transition-all flex items-center gap-2"
                                                >
                                                    <X className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Reset</span>
                                                </Button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-neutral-base-100/60 rounded-[32px] overflow-hidden shadow-xl shadow-neutral-base-400/5 backdrop-blur-sm"
                        >
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-40 gap-5">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border-2 border-amber-800/5 animate-pulse" />
                                        <Loader2 className="absolute top-0 left-0 w-12 h-12 animate-spin text-amber-800/30 p-2.5" />
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-base-400">Menyiapkan data anda...</span>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="py-40 text-center">
                                    <div className="w-24 h-24 bg-neutral-base-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                                        <ShoppingBag className="w-10 h-10 text-neutral-base-200" />
                                    </div>
                                    <h2 className="text-[26px] font-heading font-semibold mb-3 text-neutral-base-900">Data tidak ditemukan</h2>
                                    <p className="text-[14px] text-neutral-base-400 font-bold mb-10 max-w-[320px] mx-auto leading-relaxed">Anda belum memiliki riwayat transaksi. Koleksi terbaru kami sedang menunggu.</p>
                                    <Link href="/products" className="inline-flex h-14 items-center px-10 bg-neutral-base-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-amber-900 transition-all shadow-lg shadow-neutral-base-900/10 active:scale-95">
                                        Jelajahi Produk
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent border-neutral-base-50/60 transition-none">
                                                    <TableHead className="w-[200px] h-16 px-8 text-[11px] font-bold uppercase tracking-widest text-neutral-base-300">Order ID</TableHead>
                                                    <TableHead className="h-16 px-6 text-[11px] font-bold uppercase tracking-widest text-neutral-base-300">Date</TableHead>
                                                    <TableHead className="h-16 px-6 text-[11px] font-bold uppercase tracking-widest text-neutral-base-300">Method</TableHead>
                                                    <TableHead className="h-16 px-6 text-[11px] font-bold uppercase tracking-widest text-neutral-base-300">Total Price</TableHead>
                                                    <TableHead className="h-16 px-6 text-[11px] font-bold uppercase tracking-widest text-neutral-base-300 text-center">Status</TableHead>
                                                    <TableHead className="h-16 px-8 text-[11px] font-bold uppercase tracking-widest text-neutral-base-300 text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <AnimatePresence mode="popLayout">
                                                    {orders.map((order, idx) => {
                                                        const statusOpt = orderStatusOptions.find(o => o.statusOrderId === order.statusOrder);
                                                        const status = getStatusMetadata(order.statusOrder, statusOpt?.statusOrderEnduser);
                                                        return (
                                                            <motion.tr
                                                                layout
                                                                key={order.orderId}
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                transition={{ delay: idx * 0.05 }}
                                                                className="group border-neutral-base-50/50 hover:bg-neutral-base-50/40 transition-colors cursor-default"
                                                            >
                                                                <TableCell className="px-8 py-6 font-bold text-neutral-base-900 text-[14px] tracking-tight">
                                                                    <div className="flex items-center gap-2">
                                                                        {order.orderId}
                                                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <ExternalLink className="w-3 h-3 text-neutral-base-300 hover:text-amber-800" />
                                                                        </button>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="px-6 py-6 text-[13px] font-bold text-neutral-base-500">
                                                                    {format(new Date(order.tglOrder), "PPP", { locale: id })}
                                                                </TableCell>
                                                                <TableCell className="px-6 py-6">
                                                                    <span className="text-[11px] font-semibold tracking-wide text-neutral-base-400 uppercase bg-neutral-base-50 px-2.5 py-1 rounded-md border border-neutral-base-100/50">{order.metodebayar}</span>
                                                                </TableCell>
                                                                <TableCell className="px-6 py-6 font-bold text-neutral-base-900 text-[15px]">
                                                                    {formatPrice(order.totalTagihan)}
                                                                </TableCell>
                                                                <TableCell className="px-6 py-6 text-center">
                                                                    <Badge variant={status.variant} className="rounded-lg font-bold text-[10px] uppercase tracking-widest py-1.5 px-4 shadow-sm border-none">
                                                                        {status.label}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="px-8 py-6 text-right">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-white hover:shadow-md rounded-full transition-all text-neutral-base-400 group-hover:text-amber-800">
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="w-[180px] p-2 rounded-2xl border-neutral-base-100 shadow-2xl bg-white/95 backdrop-blur-xl">
                                                                            <DropdownMenuItem className="text-[12px] font-bold p-3 cursor-pointer rounded-xl focus:bg-amber-50/50 focus:text-amber-900 mb-1">
                                                                                Detail Pesanan
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem className="text-[12px] font-bold p-3 cursor-pointer rounded-xl focus:bg-amber-50/50 focus:text-amber-900 mb-1">
                                                                                Lacak Paket
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem className="text-[12px] font-bold uppercase tracking-widest p-3 cursor-pointer rounded-xl text-emerald-600 focus:bg-emerald-50/50 focus:text-emerald-700">
                                                                                Bayar Tagihan
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </TableCell>
                                                            </motion.tr>
                                                        );
                                                    })}
                                                </AnimatePresence>
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="p-10 border-t border-neutral-base-50/60 bg-neutral-base-50/10">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                            <Pagination className="justify-start">
                                                <PaginationContent className="gap-2">
                                                    <PaginationItem>
                                                        <PaginationPrevious
                                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                            className={cn(
                                                                "cursor-pointer h-10 px-4 rounded-xl border border-neutral-base-100/60 font-bold transition-all hover:bg-white hover:shadow-md",
                                                                currentPage === 1 && "opacity-30 pointer-events-none"
                                                            )}
                                                        />
                                                    </PaginationItem>

                                                    {[...Array(totalPages)].map((_, i) => {
                                                        const pageNum = i + 1;
                                                        if (totalPages > 8 && pageNum > 3 && pageNum < totalPages - 2) {
                                                            if (pageNum === 4) return <PaginationItem key={pageNum}><PaginationEllipsis /></PaginationItem>;
                                                            return null;
                                                        }
                                                        return (
                                                            <PaginationItem key={pageNum}>
                                                                <PaginationLink
                                                                    isActive={currentPage === pageNum}
                                                                    onClick={() => setCurrentPage(pageNum)}
                                                                    className={cn(
                                                                        "cursor-pointer w-10 h-10 rounded-xl transition-all font-bold text-[12px]",
                                                                        currentPage === pageNum ? "bg-neutral-base-900 text-white shadow-lg" : "hover:bg-white hover:border-neutral-base-200 border border-transparent"
                                                                    )}
                                                                >
                                                                    {pageNum}
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        );
                                                    })}

                                                    <PaginationItem>
                                                        <PaginationNext
                                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                            className={cn(
                                                                "cursor-pointer h-10 px-4 rounded-xl border border-neutral-base-100/60 font-bold transition-all hover:bg-white hover:shadow-md",
                                                                currentPage === totalPages && "opacity-30 pointer-events-none"
                                                            )}
                                                        />
                                                    </PaginationItem>
                                                </PaginationContent>
                                            </Pagination>

                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-base-300">
                                                    Showing {orders.length} of {totalOrders} total entries
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
