"use client";

import { useEffect, useState } from "react";
import { Plus, User, Phone, MapPin, Search, Loader2, AlertCircle, Truck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AddressSelectionModal from "@/components/store/address/AddressSelectionModal";
import AddAddressModal from "@/components/store/address/AddAddressModal";
import AddressCard from "@/components/store/address/AddressCard";
import { Address } from "@/hooks/use-addresses";
import { cn } from "@/lib/utils";

interface AddressSectionProps {
    addresses: Address[];
    shippingForm: any;
    setShippingForm: (form: any) => void;
    isSelectionModalOpen: boolean;
    setIsSelectionModalOpen: (open: boolean) => void;
    isAddAddressModalOpen: boolean;
    setIsAddAddressModalOpen: (open: boolean) => void;
    handleSelectAddress: (addr: Address) => void;
    hasError?: boolean;
    onFieldChange?: () => void;
}

export default function AddressSection({
    addresses,
    shippingForm,
    setShippingForm,
    isSelectionModalOpen,
    setIsSelectionModalOpen,
    isAddAddressModalOpen,
    setIsAddAddressModalOpen,
    handleSelectAddress,
    hasError,
    onFieldChange
}: AddressSectionProps) {
    const [locationQuery, setLocationQuery] = useState(shippingForm.kecamatan || "");
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [locations, setLocations] = useState<any[]>([]);
    const [editData, setEditData] = useState<Address | null>(null);

    useEffect(() => {
        const searchLocation = async () => {
            if (locationQuery.length < 2 || locationQuery === shippingForm.kecamatan) return;
            setIsSearching(true);
            try {
                const res = await fetch(`/api/locations?q=${encodeURIComponent(locationQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setLocations(data.locations || []);
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(searchLocation, 500);
        return () => clearTimeout(timer);
    }, [locationQuery, shippingForm.kecamatan]);

    const handleSelectLocation = (loc: any) => {
        setShippingForm({
            ...shippingForm,
            provinsi: loc.province,
            provinceId: loc.provinceId,
            kota: loc.city,
            cityId: loc.cityId,
            kecamatan: loc.subdistrict,
            districtId: loc.subdistrictId
        });
        setLocationQuery(loc.label);
        setShowResults(false);
        onFieldChange?.();
    };

    return (
        <section className={cn(
            "flex flex-col gap-3 bg-white/80 backdrop-blur-sm border border-neutral-base-100/50 p-4 md:p-5 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300",
            hasError ? "ring-2 ring-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.1)]" : ""
        )}>
            <div className="flex items-center justify-between border-b border-neutral-base-50 pb-2 md:pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center text-amber-800">
                        <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <h2 className="text-[14px] md:text-[15px] font-bold uppercase tracking-widest md:tracking-[0.15em] text-neutral-base-900">
                        Informasi Pengiriman
                    </h2>
                </div>

            </div>
            <AddressSelectionModal
                isOpen={isSelectionModalOpen}
                onClose={() => setIsSelectionModalOpen(false)}
                onSelect={handleSelectAddress}
            />

            <AddAddressModal
                open={isAddAddressModalOpen}
                onOpenChange={(open) => {
                    setIsAddAddressModalOpen(open);
                    if (!open) setEditData(null);
                }}
                initialData={editData}
                onSuccess={(newAddr) => {
                    if (newAddr) {
                        setShippingForm({
                            ...shippingForm,
                            addressId: newAddr.id,
                            name: newAddr.receiverName,
                            phone: newAddr.phoneNumber,
                            address: newAddr.fullAddress,
                            provinsi: newAddr.province,
                            provinceId: newAddr.provinceId || "",
                            kota: newAddr.city,
                            cityId: newAddr.cityId || "",
                            kecamatan: newAddr.district,
                            districtId: newAddr.districtId || newAddr.district,
                            kodePos: newAddr.postalCode,
                            customerId: parseInt(newAddr.customerId || "0"),
                        });
                        onFieldChange?.();
                    }
                }}
            />

            <div className="flex flex-col gap-2.5 px-1 md:px-5">
                {shippingForm.addressId > 0 && addresses.find(a => a.id === shippingForm.addressId) ? (
                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] md:text-[12px] font-bold uppercase tracking-widest text-neutral-base-400">Alamat Terpilih</span>
                        </div>
                        <div className="bg-neutral-base-50/30 rounded-2xl p-3 md:bg-transparent md:p-0">
                            <AddressCard
                                address={addresses.find(a => a.id === shippingForm.addressId)!}
                                variant="checkout"
                                className="bg-transparent p-0! shadow-none border-none"
                            />
                        </div>
                        <div className="flex items-center justify-end gap-2 px-1">
                            <button
                                onClick={() => {
                                    const currentAddr = addresses.find(a => a.id === shippingForm.addressId);
                                    if (currentAddr) {
                                        setEditData(currentAddr);
                                        setIsAddAddressModalOpen(true);
                                    }
                                }}
                                className="text-[10px] md:text-[12px] font-bold uppercase tracking-widest text-neutral-base-500 hover:text-amber-800 transition-colors bg-white px-3.5 md:px-4 py-2 rounded-xl border border-neutral-base-100 shadow-sm active:scale-95"
                            >
                                Ubah
                            </button>
                            <button
                                onClick={() => setIsSelectionModalOpen(true)}
                                className="text-[10px] md:text-[12px] font-bold uppercase tracking-widest text-neutral-base-500 hover:text-amber-800 transition-colors bg-white px-3.5 md:px-4 py-2 rounded-xl border border-neutral-base-100 shadow-sm active:scale-95"
                            >
                                Ganti
                            </button>
                        </div>
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="bg-neutral-base-50/20 rounded-[28px] p-5 md:p-8 border border-dashed border-neutral-base-200 flex flex-col items-center justify-center text-center gap-4 group transition-all hover:bg-neutral-base-50/40">
                        <div className="w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-[28px] bg-white/80 backdrop-blur-sm border border-neutral-base-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-500">
                            <MapPin className="w-5 h-5 md:w-10 md:h-10 text-neutral-base-200 group-hover:text-amber-800 transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1 md:gap-2">
                            <h3 className="text-[12px] md:text-[16px] font-bold text-neutral-base-900 uppercase tracking-widest">Belum Ada Alamat</h3>
                            <p className="text-[10px] md:text-[12px] font-medium text-neutral-base-400 max-w-[240px] md:max-w-md mx-auto leading-relaxed">
                                Anda belum memiliki alamat tersimpan. Tambah alamat baru untuk pengiriman.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsAddAddressModalOpen(true)}
                            className="h-11 md:h-14 bg-neutral-base-900 text-white px-6 md:px-10 rounded-xl md:rounded-full font-bold text-[10px] md:text-[12px] uppercase tracking-widest shadow-xl shadow-neutral-base-900/10 hover:bg-neutral-base-800 transition-all flex items-center gap-2 group/btn active:scale-95"
                        >
                            <Plus className="w-3 h-3 group-hover/btn:rotate-90 transition-transform" />
                            Tambah Alamat
                        </button>
                    </div>
                ) : (
                    <div className="bg-neutral-base-50/20 rounded-[30px] p-6 md:p-8 border border-neutral-base-100/40 flex flex-col items-center justify-center text-center gap-5 md:gap-8 min-h-[200px] md:min-h-[240px]">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-[20px] md:rounded-[24px] bg-white/80 backdrop-blur-sm border border-neutral-base-100 flex items-center justify-center shadow-sm">
                            <Truck className="w-6 h-6 md:w-8 md:h-8 text-neutral-base-200" />
                        </div>
                        <div className="flex flex-col gap-1 md:gap-2">
                            <p className="text-[12px] md:text-[13px] font-medium text-neutral-base-400 uppercase tracking-widest">Silahkan pilih alamat pengiriman Anda</p>
                        </div>
                        <button
                            onClick={() => setIsSelectionModalOpen(true)}
                            className="h-12 md:h-14 bg-amber-800 text-white px-8 md:px-10 rounded-full font-bold text-[12px] md:text-[14px] uppercase tracking-widest shadow-xl shadow-amber-800/10 hover:bg-amber-900 transition-all flex items-center gap-3"
                        >
                            Pilih Alamat
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
