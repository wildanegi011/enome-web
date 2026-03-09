"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrderDetail } from "@/hooks/use-order-detail";
import Navbar from "@/components/store/layout/Navbar";
import UserSidebar from "@/components/store/layout/UserSidebar";
import { Skeleton } from "@/components/ui/skeleton";

import OrderHeader from "@/components/store/orders/detail/OrderHeader";
import OrderTimeline from "@/components/store/orders/detail/OrderTimeline";
import PaymentInstruction from "@/components/store/orders/detail/PaymentInstruction";
import OrderItemsCard from "@/components/store/orders/detail/OrderItemsCard";
import ShippingInfoCard from "@/components/store/orders/detail/ShippingInfoCard";
import OrderSummaryCard from "@/components/store/orders/detail/OrderSummaryCard";
import TrackingManifest from "@/components/store/orders/detail/TrackingManifest";
import { CONFIG } from "@/lib/config";

const OrderDetailSkeleton = () => (
    <div className="min-h-screen bg-[#F9FAFB] font-montserrat text-neutral-base-900">
        <Navbar />
        <main className="max-w-[1340px] mx-auto px-4 md:px-8 py-10">
            <div className="flex flex-col lg:flex-row gap-12">
                <div className="hidden lg:block">
                    <UserSidebar />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 md:mb-8">
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                            <Skeleton className="w-48 md:w-64 h-7 md:h-8" />
                        </div>
                        <div className="flex items-center gap-2 ml-14 md:ml-0">
                            <Skeleton className="w-24 md:w-32 h-6 md:h-8" />
                            <Skeleton className="w-16 h-6 rounded-lg" />
                        </div>
                    </div>

                    <div className="bg-white border border-neutral-base-100 rounded-[28px] md:rounded-[32px] p-6 md:p-10 mb-8 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between gap-6 overflow-x-auto pb-2 scrollbar-hide">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex flex-col items-center min-w-[80px]">
                                    <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl" />
                                    <Skeleton className="w-16 h-3 mt-3" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-2 space-y-8">
                            <div className="bg-white border border-neutral-base-100 rounded-[28px] md:rounded-[32px] overflow-hidden shadow-sm">
                                <div className="px-6 md:px-8 py-5 md:py-6 border-b border-neutral-base-50 flex items-center justify-between">
                                    <Skeleton className="w-32 h-5" />
                                    <Skeleton className="w-20 h-4" />
                                </div>
                                <div className="divide-y divide-neutral-base-50">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="p-6 md:p-8 flex items-start md:items-center gap-4 md:gap-6">
                                            <Skeleton className="w-20 h-24 md:w-24 md:h-32 rounded-xl md:rounded-2xl shrink-0" />
                                            <div className="flex-1 space-y-3">
                                                <Skeleton className="w-3/4 h-5" />
                                                <Skeleton className="w-1/2 h-4" />
                                                <Skeleton className="w-24 h-6 mt-2 md:mt-4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[1, 2].map((i) => (
                                    <div key={i} className="bg-white border border-neutral-base-100 rounded-[28px] md:rounded-[32px] p-6 md:p-8 shadow-sm">
                                        <div className="flex items-center gap-4 mb-6">
                                            <Skeleton className="w-10 h-10 rounded-xl" />
                                            <Skeleton className="w-32 h-5" />
                                        </div>
                                        <div className="space-y-4">
                                            <Skeleton className="w-full h-4" />
                                            <Skeleton className="w-5/6 h-4" />
                                            <Skeleton className="w-1/2 h-4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-white border border-neutral-base-100 rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-xl shadow-neutral-base-900/5 xl:sticky xl:top-24">
                                <Skeleton className="w-40 h-6 mb-8" />
                                <div className="space-y-6 pb-8 border-b border-neutral-base-50">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex justify-between">
                                            <Skeleton className="w-24 h-4" />
                                            <Skeleton className="w-20 h-4" />
                                        </div>
                                    ))}
                                </div>
                                <div className="py-8 flex justify-between">
                                    <Skeleton className="w-24 h-3" />
                                    <Skeleton className="w-32 h-8" />
                                </div>
                                <Skeleton className="w-full h-12 md:h-14 rounded-2xl mt-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
);

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();

    const orderIdParam = Array.isArray(params.id) ? params.id[0] : (params.id || "");
    const { data, isLoading, isError } = useOrderDetail(orderIdParam);

    useEffect(() => {
        if (!isLoading && isError) {
            router.push("/account/orders");
        }
    }, [isLoading, isError, router]);

    if (isLoading) {
        return <OrderDetailSkeleton />;
    }

    if (!data) return null;

    const { order, items, paymentInfo, voucherInfo, uniqueCode: uniqueCodeValue = 0, expiredTime, whatsappAdmin } = data;

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-montserrat text-neutral-base-900">
            <Navbar />

            <main className="max-w-[1340px] mx-auto px-3 sm:px-4 md:px-8 py-6 md:py-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="hidden lg:block">
                        <UserSidebar />
                    </div>

                    <div className="flex-1 min-w-0">
                        <OrderHeader
                            orderId={order.orderId}
                            tglOrder={order.tglOrder}
                        />

                        <OrderTimeline statusOrder={order.statusOrder} />

                        {order.statusOrder === "CLOSE" && CONFIG.TRACKABLE_COURIERS.includes(order.ekspedisi?.toLowerCase()) && (
                            <div className="bg-white border border-neutral-base-100 rounded-[28px] md:rounded-[32px] p-6 md:p-10 mb-8 shadow-sm overflow-hidden">
                                <TrackingManifest
                                    awb={order.noResi}
                                    courier={order.ekspedisi}
                                    phone={order.teleponPenerima}
                                    showTitle={true}
                                    isCollapsible={true}
                                />
                            </div>
                        )}

                        <PaymentInstruction
                            statusTagihan={order.statusTagihan}
                            totalTagihan={order.totalTagihan}
                            paymentInfo={paymentInfo}
                            uniqueCodeValue={uniqueCodeValue}
                            expiredTime={expiredTime}
                        />

                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                            <div className="xl:col-span-7 space-y-10">
                                <OrderItemsCard items={items} />

                                <div className="space-y-10">
                                    <ShippingInfoCard
                                        ekspedisi={order.ekspedisi}
                                        service={order.service}
                                        noResi={order.noResi}
                                        phone={order.teleponPenerima}
                                        statusOrder={order.statusOrder}
                                        namaPenerima={order.namaPenerima}
                                        alamatKirim={order.alamatKirim}
                                        distrikKirim={order.distrikKirim}
                                        kotaKirim={order.kotaKirim}
                                        provinsiKirim={order.provinsiKirim}
                                    />
                                </div>
                            </div>

                            <div className="xl:col-span-5 space-y-10">
                                <OrderSummaryCard
                                    orderId={order.orderId}
                                    totalHarga={order.totalHarga}
                                    ongkir={order.ongkir}
                                    biayalain={order.biayalain}
                                    totalTagihan={order.totalTagihan}
                                    metodebayar={order.metodebayar}
                                    statusTagihan={order.statusTagihan}
                                    viaWallet={order.viaWallet}
                                    uniqueCodeValue={uniqueCodeValue}
                                    voucherInfo={voucherInfo}
                                    whatsappAdmin={whatsappAdmin}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
