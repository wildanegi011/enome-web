"use client";

import React from "react";
import { MapPin, Phone } from "lucide-react";

interface ShippingAddressCardProps {
    namaPenerima: string;
    alamatKirim: string;
    distrikKirim: string;
    kotaKirim: string;
    provinsiKirim: string;
    teleponPenerima: string;
}

export default function ShippingAddressCard({
    namaPenerima,
    alamatKirim,
    distrikKirim,
    kotaKirim,
    provinsiKirim,
    teleponPenerima,
}: ShippingAddressCardProps) {
    return (
        <div className="bg-white border border-neutral-base-100 rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-neutral-base-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-neutral-base-900" />
                </div>
                <h2 className="text-[16px] font-bold text-neutral-base-900">Alamat Pengiriman</h2>
            </div>
            <div className="space-y-3">
                <p className="text-[14px] font-bold text-neutral-base-900 uppercase tracking-tight">
                    {namaPenerima}
                </p>
                <p className="text-[13px] font-medium text-neutral-base-400 leading-relaxed">
                    {alamatKirim}, {distrikKirim}, {kotaKirim}, {provinsiKirim}
                </p>
                <div className="flex items-center gap-2 text-[13px] font-bold text-neutral-base-500 pt-2 border-t border-neutral-base-50">
                    <Phone className="w-3.5 h-3.5" />
                    {teleponPenerima}
                </div>
            </div>
        </div>
    );
}
