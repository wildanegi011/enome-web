"use client";

import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
    DrawerFooter
} from "@/components/ui/drawer";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
    MapPin, Search, Loader2,
    User, Phone, Navigation2,
    Check, AlertCircle, X,
    ChevronsUpDown
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { m, AnimatePresence } from "framer-motion";
import { cn, joinAddress, toTitleCase } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface LocationResult {
    label: string;
    province: string;
    provinceId: string;
    city: string;
    cityId: string;
    subdistrict: string;
    subdistrictId: string;
}

interface Address {
    id: number;
    label: string;
    receiverName: string;
    phoneNumber: string;
    fullAddress: string;
    city: string;
    cityId?: string;
    province: string;
    provinceId?: string;
    district: string;
    districtId?: string;
    postalCode: string;
    shopName: string;
    kelurahan?: string;
    kelurahanName?: string;
    isPrimary: number;
    customerId?: string;
}

interface AddAddressModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Address | null;
    onSuccess?: (address: any) => void;
}

export default function AddAddressModal({ open, onOpenChange, initialData, onSuccess }: AddAddressModalProps) {
    const queryClient = useQueryClient();
    const mode = initialData ? "edit" : "add";
    const isMobile = useIsMobile();

    const [locationQuery, setLocationQuery] = useState("");
    const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [villageOpen, setVillageOpen] = useState(false);

    const [formData, setFormData] = useState({
        labelAlamat: "",
        namaPenerima: "",
        namaToko: "-",
        noHandphone: "",
        alamatLengkap: "",
        kelurahan: "",
        kelurahanName: "",
        kodePos: "",
        isPrimary: 0
    });

    useEffect(() => {
        if (initialData && open) {
            setFormData({
                labelAlamat: initialData.label,
                namaPenerima: initialData.receiverName,
                namaToko: initialData.shopName || "-",
                noHandphone: initialData.phoneNumber,
                alamatLengkap: initialData.fullAddress,
                kelurahan: initialData.kelurahan || "",
                kelurahanName: (initialData as any).kelurahanName || initialData.kelurahan || "",
                kodePos: initialData.postalCode,
                isPrimary: initialData.isPrimary === 1 ? 1 : 0
            });
            const locStr = joinAddress(initialData.province, initialData.city, initialData.district);
            setLocationQuery(locStr);

            // Fix: Initialize selectedLocation from initialData to prevent ID loss on edit
            if (initialData.provinceId && initialData.cityId && initialData.districtId) {
                setSelectedLocation({
                    label: locStr,
                    province: initialData.province,
                    provinceId: initialData.provinceId,
                    city: initialData.city,
                    cityId: initialData.cityId,
                    subdistrict: initialData.district,
                    subdistrictId: initialData.districtId
                });
            }
        } else if (!open) {
            resetForm();
        }
    }, [initialData, open]);

    const { data: locations = [], isLoading: isSearching } = useQuery({
        queryKey: ["locations", locationQuery],
        queryFn: async () => {
            if (locationQuery.length < 2) return [];
            const res = await fetch(`/api/locations?q=${encodeURIComponent(locationQuery)}`);
            if (!res.ok) throw new Error("Failed to fetch locations");
            const data = await res.json();
            return data.locations as LocationResult[];
        },
        enabled: locationQuery.length >= 2 && locationQuery !== (selectedLocation?.label || ""),
    });

    const { data: villages = [], isLoading: isLoadingVillages } = useQuery({
        queryKey: ["villages", selectedLocation?.subdistrictId],
        queryFn: async () => {
            if (!selectedLocation?.subdistrictId) return [];
            const res = await fetch(`/api/locations/villages?subdistrictId=${selectedLocation.subdistrictId}`);
            if (!res.ok) throw new Error("Failed to fetch villages");
            const data = await res.json();
            return data.villages as { villageId: number, villageName: string, zipCode: string }[];
        },
        enabled: !!selectedLocation?.subdistrictId,
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const method = mode === "edit" ? "PATCH" : "POST";
            const res = await fetch("/api/user/addresses", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mode === "edit" ? { id: initialData?.id, ...data } : data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || `Failed to ${mode} address`);
            }
            return res.json();
        },
        onSuccess: (data) => {
            const addressId = data.addressId || initialData?.id;
            toast.success(mode === "edit" ? "Alamat berhasil diperbarui" : "Alamat berhasil ditambahkan");
            queryClient.invalidateQueries({ queryKey: queryKeys.user.addresses });
            onOpenChange(false);

            if (onSuccess) {
                // Construct a full address object to pass back
                const fullAddr = {
                    id: addressId,
                    label: formData.labelAlamat,
                    receiverName: formData.namaPenerima,
                    shopName: formData.namaToko,
                    phoneNumber: formData.noHandphone,
                    fullAddress: formData.alamatLengkap,
                    kelurahan: formData.kelurahan,
                    kelurahanName: formData.kelurahanName,
                    postalCode: formData.kodePos,
                    isPrimary: formData.isPrimary,
                    province: selectedLocation?.province || initialData?.province || "",
                    provinceId: selectedLocation?.provinceId || initialData?.provinceId || "",
                    city: selectedLocation?.city || initialData?.city || "",
                    cityId: selectedLocation?.cityId || initialData?.cityId || "",
                    district: selectedLocation?.subdistrict || initialData?.district || "",
                    districtId: selectedLocation?.subdistrictId || initialData?.districtId || ""
                };
                onSuccess(fullAddr);
            }
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    const resetForm = () => {
        setFormData({
            labelAlamat: "",
            namaPenerima: "",
            namaToko: "-",
            noHandphone: "",
            alamatLengkap: "",
            kelurahan: "",
            kelurahanName: "",
            kodePos: "",
            isPrimary: 0
        });
        setLocationQuery("");
        setSelectedLocation(null);
    };

    const handleSelectLocation = (loc: LocationResult) => {
        setSelectedLocation(loc);
        setLocationQuery(loc.label);
        setShowResults(false);
        // Reset kelurahan and kodePos when location changes
        setFormData(prev => ({
            ...prev,
            kelurahan: "",
            kelurahanName: "",
            kodePos: ""
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedLocation && mode === "add") {
            toast.error("Silakan pilih lokasi (Provinsi, Kota, Kecamatan)");
            return;
        }

        const payload: any = { ...formData };

        if (selectedLocation) {
            payload.provinsi = selectedLocation.provinceId;
            payload.kota = selectedLocation.cityId;
            payload.kecamatan = selectedLocation.subdistrictId;
        }

        mutation.mutate(payload);
    };

    const headerTitle = mode === "edit" ? "Ubah Alamat" : "Alamat Baru";
    const headerDescription = mode === "edit" ? "Perbarui informasi pengiriman kamu" : "Kirim pesanan kamu ke lokasi yang tepat";

    const HeaderContent = (
        <div className="flex items-center gap-4 md:gap-5 text-left">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-[22px] bg-linear-to-br from-amber-50 to-orange-50 flex items-center justify-center shadow-sm border border-amber-100/50">
                <MapPin className="w-6 h-6 md:w-7 md:h-7 text-amber-800" />
            </div>
            <div>
                <h2 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-neutral-base-900 leading-tight">
                    {headerTitle}
                </h2>
                <p className="text-[12px] md:text-[13px] font-bold text-neutral-base-400 mt-0.5 md:mt-1">
                    {headerDescription}
                </p>
            </div>
        </div>
    );

    const FormContent = (
        <form id="address-form" onSubmit={handleSubmit} className="space-y-8 md:space-y-10 py-6 md:py-3">
            {/* Section: Contact Info */}
            <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                        <User className="w-4 h-4 text-amber-800" />
                    </div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-base-900">Informasi Kontak</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-base-500 ml-1">Nama Penerima <span className="text-red-500">*</span></Label>
                        <div className="relative group/input">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300 group-focus-within/input:text-amber-800 transition-colors" />
                            <Input
                                required
                                placeholder="Nama Lengkap"
                                value={formData.namaPenerima}
                                onChange={(e) => setFormData({ ...formData, namaPenerima: e.target.value })}
                                className="h-14 bg-neutral-base-50/30 border-neutral-base-100/60 rounded-[20px] pl-12 pr-6 font-bold text-[14px] focus:bg-white focus:border-amber-800 focus:ring-4 focus:ring-amber-50/50 transition-all placeholder:text-neutral-base-300"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-base-500 ml-1">No. Handphone <span className="text-red-500">*</span></Label>
                        <div className="relative group/input">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300 group-focus-within/input:text-amber-800 transition-colors" />
                            <Input
                                required
                                type="tel"
                                placeholder="0812..."
                                value={formData.noHandphone}
                                onChange={(e) => setFormData({ ...formData, noHandphone: e.target.value.replace(/\D/g, "") })}
                                className="h-14 bg-neutral-base-50/30 border-neutral-base-100/60 rounded-[20px] pl-12 pr-6 font-bold text-[14px] focus:bg-white focus:border-amber-800 focus:ring-4 focus:ring-amber-50/50 transition-all placeholder:text-neutral-base-300"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section: Address Details */}
            <div className="space-y-6 pt-4 border-t border-neutral-base-100/60 relative">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Navigation2 className="w-4 h-4 text-amber-800" />
                    </div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-base-900">Detail Alamat</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-base-500 ml-1">Label Alamat <span className="text-red-500">*</span></Label>
                        <Input
                            required
                            placeholder="Rumah, Kantor, dll"
                            value={formData.labelAlamat}
                            onChange={(e) => setFormData({ ...formData, labelAlamat: e.target.value })}
                            className="h-14 bg-neutral-base-50/30 border-neutral-base-100/60 rounded-[20px] px-6 font-bold text-[14px] focus:bg-white focus:border-amber-800 focus:ring-4 focus:ring-amber-50/50 transition-all placeholder:text-neutral-base-300"
                        />
                    </div>

                    <div className="hidden">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-base-500 ml-1">Nama Toko (Opsional)</Label>
                        <Input
                            placeholder="Nama Toko Anda"
                            value={formData.namaToko}
                            onChange={(e) => setFormData({ ...formData, namaToko: e.target.value })}
                            className="h-14 bg-neutral-base-50/30 border-neutral-base-100/60 rounded-[20px] px-6 font-bold text-[14px] focus:bg-white focus:border-amber-800 focus:ring-4 focus:ring-amber-50/50 transition-all placeholder:text-neutral-base-300"
                        />
                    </div>

                    <div className="md:col-span-2 space-y-2 relative">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-base-500 ml-1">Provinsi, Kota, Kecamatan <span className="text-red-500">*</span></Label>
                        <div className="relative group/location">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300 group-focus-within/location:text-amber-800 transition-colors" />
                            <Input
                                required
                                placeholder="Cari lokasi..."
                                value={locationQuery}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLocationQuery(val);
                                    setShowResults(true);
                                    if (val !== selectedLocation?.label) {
                                        setSelectedLocation(null);
                                        // Also reset kelurahan and kodePos when input is changed
                                        setFormData(prev => ({
                                            ...prev,
                                            kelurahan: "",
                                            kelurahanName: "",
                                            kodePos: ""
                                        }));
                                    }
                                }}
                                onFocus={() => setShowResults(true)}
                                className="h-14 bg-neutral-base-50/30 border-neutral-base-100/60 rounded-[20px] pl-12 pr-6 font-bold text-[14px] focus:bg-white focus:border-amber-800 focus:ring-4 focus:ring-amber-50/50 transition-all placeholder:text-neutral-base-300"
                            />
                            {isSearching && (
                                <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-amber-800" />
                            )}
                        </div>

                        <AnimatePresence>
                            {showResults && locationQuery.length >= 2 && locationQuery !== selectedLocation?.label && (
                                <m.div
                                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                    className="absolute z-100 w-full mt-2 bg-white border border-neutral-base-100 rounded-[24px] shadow-[0_12px_32px_rgba(0,0,0,0.12)] max-h-[220px] overflow-y-auto overflow-x-hidden no-scrollbar py-2"
                                >
                                    {locations.map((loc, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleSelectLocation(loc)}
                                            className="w-full px-6 py-3.5 text-left hover:bg-amber-50 transition-all flex items-center justify-between group border-b last:border-0 border-neutral-base-50/50"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-neutral-base-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                                    <Navigation2 className="w-3.5 h-3.5 text-neutral-base-400 group-hover:text-amber-800 transition-colors" />
                                                </div>
                                                <span className="text-[13px] font-bold text-neutral-base-900">{joinAddress(loc.subdistrict, loc.city, loc.province)}</span>
                                            </div>
                                            {selectedLocation?.subdistrictId === loc.subdistrictId && (
                                                <div className="w-5 h-5 rounded-full bg-amber-800 flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                    {locations.length === 0 && !isSearching && (
                                        <div className="p-10 text-center flex flex-col items-center gap-2">
                                            <AlertCircle className="w-6 h-6 text-neutral-base-200" />
                                            <p className="text-[12px] font-bold text-neutral-base-400">Lokasi tidak ditemukan</p>
                                        </div>
                                    )}
                                </m.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {selectedLocation && (
                            <m.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:col-span-2 space-y-2 overflow-hidden"
                            >
                                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-base-500 ml-1">Kelurahan / Desa <span className="text-red-500">*</span></Label>
                                <Popover open={villageOpen} onOpenChange={setVillageOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={villageOpen}
                                            className="w-full h-14 bg-neutral-base-50/30 border-neutral-base-100/60 rounded-[20px] px-6 font-bold text-[14px] justify-between hover:bg-neutral-base-50 transition-all border shadow-none"
                                        >
                                            <span className={cn(
                                                "line-clamp-1 text-left",
                                                !formData.kelurahan ? "text-neutral-base-300" : "text-neutral-base-900"
                                            )}>
                                                {formData.kelurahanName ? toTitleCase(formData.kelurahanName) : "Pilih Kelurahan / Desa"}
                                            </span>
                                            {isLoadingVillages ? (
                                                <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                                            ) : (
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-[24px] shadow-2xl border-neutral-base-100 bg-white" align="start">
                                        <Command className="rounded-[24px]">
                                            <CommandInput placeholder="Cari kelurahan..." className="h-12 border-none focus:ring-0" />
                                            <CommandList 
                                                className="max-h-[300px] overflow-y-auto"
                                                onWheel={(e) => e.stopPropagation()}
                                                onTouchStart={(e) => e.stopPropagation()}
                                                onTouchMove={(e) => e.stopPropagation()}
                                            >
                                                <CommandEmpty>Kelurahan tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {villages.map((v, i) => (
                                                        <CommandItem
                                                            key={i}
                                                            value={v.villageName}
                                                            onSelect={(currentValue) => {
                                                                const selected = villages.find(v => v.villageName === currentValue);
                                                                setFormData({
                                                                    ...formData,
                                                                    kelurahan: selected?.villageId.toString() || "",
                                                                    kelurahanName: currentValue,
                                                                    kodePos: selected?.zipCode || formData.kodePos
                                                                });
                                                                setVillageOpen(false);
                                                            }}
                                                            className="flex items-center justify-between py-3 px-4"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.kelurahanName === v.villageName ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <span className="text-[13px] font-bold text-neutral-base-900">
                                                                    {toTitleCase(v.villageName)}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] text-neutral-base-400 font-bold">{v.zipCode}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </m.div>
                        )}
                    </AnimatePresence>

                    <div className="md:col-span-2 space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-base-500 ml-1">Alamat Lengkap <span className="text-red-500">*</span></Label>
                        <Textarea
                            required
                            placeholder="Nama Jalan, No. Rumah, RT/RW, Patokan dsb."
                            value={formData.alamatLengkap}
                            onChange={(e) => setFormData({ ...formData, alamatLengkap: e.target.value })}
                            className="min-h-[120px] bg-neutral-base-50/30 border-neutral-base-100/60 rounded-[20px] p-6 font-bold text-[14px] focus:bg-white focus:border-amber-800 focus:ring-4 focus:ring-amber-50/50 transition-all placeholder:text-neutral-base-300 resize-none shadow-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-base-500 ml-1">Kode Pos <span className="text-red-500">*</span></Label>
                        <Input
                            required
                            placeholder="12345"
                            value={formData.kodePos}
                            onChange={(e) => setFormData({ ...formData, kodePos: e.target.value.replace(/\D/g, "") })}
                            className="h-14 bg-neutral-base-50/30 border-neutral-base-100/60 rounded-[20px] px-6 font-bold text-[14px] focus:bg-white focus:border-amber-800 focus:ring-4 focus:ring-amber-50/50 transition-all placeholder:text-neutral-base-300"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-neutral-base-50/50 p-5 rounded-[22px] border border-neutral-base-100/60 mt-1">
                        <div className="space-y-0.5">
                            <p className="text-[11px] font-black uppercase tracking-widest text-neutral-base-900">Alamat Utama</p>
                            <p className="text-[10px] font-bold text-neutral-base-400">Gunakan sebagai tujuan utama</p>
                        </div>
                        <Switch
                            checked={formData.isPrimary === 1}
                            onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: checked ? 1 : 0 })}
                            className="data-[state=checked]:bg-amber-800"
                        />
                    </div>
                </div>
            </div>
        </form>
    );

    const FooterContent = (
        <div className="flex flex-col sm:flex-row gap-4 pt-4 md:pt-6 pb-6 md:pb-0">
            <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-14 md:h-16 px-8 rounded-full font-black text-[11px] md:text-[12px] uppercase tracking-[0.2em] text-neutral-base-400 hover:text-neutral-base-900 hover:bg-neutral-base-50 transition-all order-2 sm:order-1"
            >
                Batal
            </Button>
            <Button
                type="submit"
                form="address-form"
                disabled={mutation.isPending}
                className="h-14 md:h-16 px-10 rounded-full bg-neutral-base-900 text-white font-black text-[11px] md:text-[12px] uppercase tracking-[0.2em] hover:bg-amber-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-neutral-base-900/10 flex-1 order-1 sm:order-2 disabled:opacity-50"
            >
                {mutation.isPending ? (
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Memproses...</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <span>{mode === "edit" ? "Perbarui Alamat" : "Simpan Alamat"}</span>
                    </div>
                )}
            </Button>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="h-[95dvh] p-0 bg-white rounded-t-[32px] border-none flex flex-col outline-hidden">
                    <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-neutral-base-100 mt-3" />
                    <DrawerHeader className="px-6 py-6 border-b border-neutral-base-50 text-left">
                        <DrawerTitle asChild>
                            {HeaderContent}
                        </DrawerTitle>
                        <DrawerDescription className="sr-only">
                            {headerDescription}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-10">
                        <style jsx global>{`
                            .no-scrollbar::-webkit-scrollbar { display: none; }
                            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                        `}</style>
                        {FormContent}
                        {FooterContent}
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-[720px] h-dvh sm:h-auto sm:max-h-[90vh] p-0 bg-white rounded-none sm:rounded-[32px] md:rounded-[40px] shadow-none sm:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border-none overflow-hidden flex flex-col outline-hidden">
                <DialogHeader className="px-6 md:px-10 py-6 md:py-8 border-b border-neutral-base-50 flex flex-row items-center justify-between shrink-0">
                    <div>
                        <DialogTitle asChild>
                            {HeaderContent}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            {headerDescription}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 md:px-10 pb-10">
                    <style jsx global>{`
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    `}</style>
                    {FormContent}
                    {FooterContent}
                </div>
            </DialogContent>
        </Dialog>
    );
}
