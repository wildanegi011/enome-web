"use client";

import React, { useState } from "react";
import { Truck, Copy, Check } from "lucide-react";

interface ShippingInfoCardProps {
    ekspedisi: string;
    service: string;
    noResi: string;
}

export default function ShippingInfoCard({
    ekspedisi,
    service,
    noResi,
}: ShippingInfoCardProps) {
    const [copiedResi, setCopiedResi] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedResi(true);
        setTimeout(() => setCopiedResi(false), 2000);
    };

    return (
        <div className="bg-white border border-neutral-base-100 rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-neutral-base-50 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-neutral-base-900" />
                </div>
                <h2 className="text-[16px] font-bold text-neutral-base-900">Info Pengiriman</h2>
            </div>
            <div className="space-y-4">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-neutral-base-300 mb-1">
                        Kurir
                    </p>
                    <p className="text-[14px] font-bold text-neutral-base-900 uppercase">
                        {ekspedisi} - {service}
                    </p>
                </div>
                <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-neutral-base-300 mb-1">
                        No. Resi
                    </p>
                    <div className="flex items-center gap-2 group">
                        <p className="text-[14px] font-bold text-neutral-base-900">
                            {noResi || "Menunggu Update Resi"}
                        </p>
                        {noResi && (
                            <button
                                onClick={() => handleCopy(noResi)}
                                className="p-1.5 rounded-lg hover:bg-neutral-base-50 transition-colors"
                            >
                                {copiedResi ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5 text-neutral-base-300" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
