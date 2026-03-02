"use client";

import { useEffect, useState } from "react";
import { Plus, User, Phone, MapPin, Search, Loader2, AlertCircle, Truck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AddressSelectionModal from "@/components/store/AddressSelectionModal";
import AddAddressModal from "@/components/store/AddAddressModal";
import AddressCard from "@/components/store/AddressCard";
import { Address } from "@/hooks/use-addresses";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
            kota: loc.city,
            kecamatan: loc.subdistrict,
            districtId: loc.subdistrictId
        });
        setLocationQuery(loc.label);
        setShowResults(false);
        onFieldChange?.();
    };

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex items-center gap-3 md:gap-4 border-b border-neutral-base-50 pb-4 md:pb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center font-black text-amber-800 text-[14px] md:text-[18px]">2</div>
                <h2 className="text-[14px] md:text-[16px] font-black uppercase tracking-widest md:tracking-[0.15em] text-neutral-base-900">
                    Informasi Pengiriman
                </h2>
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
                    // Only auto-select if it's set as primary address
                    if (newAddr && newAddr.isPrimary === 1) {
                        setShippingForm({
                            ...shippingForm,
                            addressId: newAddr.id,
                            name: newAddr.receiverName,
                            phone: newAddr.phoneNumber,
                            address: newAddr.fullAddress,
                            provinsi: newAddr.province,
                            kota: newAddr.city,
                            kecamatan: newAddr.district,
                            districtId: newAddr.districtId || newAddr.district,
                            kodePos: newAddr.postalCode,
                            customerId: parseInt(newAddr.customerId || "0"),
                        });
                        onFieldChange?.();
                    }
                }}
            />

            <div className={`flex flex-col gap-6 md:gap-8 p-1 rounded-[32px] transition-all duration-300 ${hasError ? "bg-white ring-2 ring-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.05)]" : ""}`}>
                {shippingForm.addressId > 0 && addresses.find(a => a.id === shippingForm.addressId) ? (
                    <div className="bg-neutral-base-50/30 p-4 md:p-8 rounded-xl md:rounded-[32px] border border-neutral-base-100/60 flex flex-col gap-6">
                        <AddressCard
                            address={addresses.find(a => a.id === shippingForm.addressId)!}
                            variant="checkout"
                            className="bg-transparent"
                        />
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-neutral-base-100/60">
                            <button
                                onClick={() => {
                                    const currentAddr = addresses.find(a => a.id === shippingForm.addressId);
                                    if (currentAddr) {
                                        setEditData(currentAddr);
                                        setIsAddAddressModalOpen(true);
                                    }
                                }}
                                className="h-16 md:h-14 flex-1 bg-white border border-neutral-base-100 p-2 md:p-0 px-6 rounded-xl md:rounded-2xl font-black text-[12px] md:text-[13px] uppercase tracking-widest text-neutral-base-600 hover:text-neutral-base-900 hover:bg-neutral-base-50 transition-all flex items-center justify-center gap-3 group"
                            >
                                <Search className="w-4 h-4 text-neutral-base-300 group-hover:text-amber-800 transition-colors" />
                                Update (Ubah)
                            </button>
                            <button
                                onClick={() => setIsSelectionModalOpen(true)}
                                className="h-16 md:h-14 flex-1 bg-white border border-neutral-base-100 p-2 md:p-0 px-6 rounded-xl md:rounded-2xl font-black text-[12px] md:text-[13px] uppercase tracking-widest text-neutral-base-600 hover:text-amber-800 hover:border-amber-100 hover:bg-amber-50/30 transition-all flex items-center justify-center gap-3 group"
                            >
                                <Truck className="w-4 h-4 text-neutral-base-300 group-hover:text-amber-800 transition-colors" />
                                Pilih Lainnya
                            </button>
                        </div>
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="bg-neutral-base-50/30 rounded-xl md:rounded-[32px] p-8 md:p-12 border border-dashed border-neutral-base-200 flex flex-col items-center justify-center text-center gap-4 md:gap-6 group transition-all hover:bg-neutral-base-50/50">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[32px] bg-white border border-neutral-base-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
                            <MapPin className="w-8 h-8 md:w-10 md:h-10 text-neutral-base-200 group-hover:text-amber-800 transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1 md:gap-2">
                            <h3 className="text-[16px] md:text-[18px] font-black text-neutral-base-900 uppercase tracking-widest">Belum Ada Alamat</h3>
                            <p className="text-[12px] md:text-[13px] font-bold text-neutral-base-400 max-w-[280px] md:max-w-md mx-auto line-relaxed">
                                Anda belum memiliki alamat tersimpan. Tambah alamat baru untuk melanjutkan proses pengiriman.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsAddAddressModalOpen(true)}
                            className="h-16 md:h-14 bg-neutral-base-900 text-white px-8 md:px-12 rounded-full font-black text-[14px] md:text-[15px] uppercase tracking-widest shadow-xl shadow-neutral-base-900/10 hover:bg-neutral-base-800 transition-all flex items-center gap-3 group/btn"
                        >
                            <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" />
                            Tambah Alamat Baru
                        </button>
                    </div>
                ) : (
                    <div className="bg-neutral-base-50/30 rounded-xl md:rounded-[32px] p-4 md:p-8 border border-neutral-base-100/60 flex flex-col items-center justify-center text-center gap-6 md:gap-8 min-h-[240px]">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-[24px] bg-white border border-neutral-base-100 flex items-center justify-center shadow-sm">
                            <Truck className="w-6 h-6 md:w-8 md:h-8 text-neutral-base-200" />
                        </div>
                        <div className="flex flex-col gap-1 md:gap-2">
                            <p className="text-[12px] md:text-[13px] font-bold text-neutral-base-400">Silahkan pilih alamat pengiriman Anda</p>
                        </div>
                        <button
                            onClick={() => setIsSelectionModalOpen(true)}
                            className="h-16 md:h-14 bg-amber-800 text-white px-8 md:px-12 rounded-full font-black text-[14px] md:text-[15px] uppercase tracking-widest shadow-xl shadow-amber-800/10 hover:bg-amber-900 transition-all flex items-center gap-3"
                        >
                            Pilih Alamat
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
