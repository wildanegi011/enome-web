"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/hooks/use-cart";
import { useAddresses, Address } from "@/hooks/use-addresses";
import { cartApi } from "@/lib/api/cart-api";
import { userApi } from "@/lib/api/user-api";
import { checkoutApi } from "@/lib/api/checkout-api";
import { queryKeys } from "@/lib/query-keys";
import CONFIG from "@/lib/config";

export function useCheckout() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const selectedIds = useMemo(() =>
        searchParams.get("ids")?.split(",").map(id => parseInt(id)) || [],
        [searchParams]
    );

    const [cartItems, setCartItems] = useState<any[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const { refreshCart } = useCart();

    const [shippingForm, setShippingForm] = useState({
        customerId: 0,
        name: "",
        phone: "",
        address: "",
        courier: "",
        addressId: 0,
        kelurahan: "",
        kecamatan: "",
        kota: "",
        provinsi: "",
        provinceId: "",
        cityId: "",
        districtId: "",
        kodePos: "",
        service: "",
        courierName: "",
        shippingPrice: 0,
        shippingType: "automated",
    });

    const [errors, setErrors] = useState<{
        address?: boolean;
        shipping?: boolean;
        payment?: boolean;
    }>({});

    const [walletBalance, setWalletBalance] = useState(0);
    const [useWallet, setUseWallet] = useState(false);

    // Dropshipper State
    const [isDropshipper, setIsDropshipper] = useState(false);
    const [dropshipperForm, setDropshipperForm] = useState({
        name: "",
        phone: "",
        address: ""
    });

    // Special Notes and Voucher
    const [specialNotes, setSpecialNotes] = useState("");
    const [voucherCode, setVoucherCode] = useState("");
    const [isVoucherApplied, setIsVoucherApplied] = useState(false);
    const [voucherData, setVoucherData] = useState<{
        nilai_voucher: number;
        tipe_voucher: string;
        maksimal_nominal_voucher_persen: number;
    } | null>(null);

    // Address Logic
    const { addresses, isLoading: isLoadingAddresses } = useAddresses();
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState("");
    const [paymentAccountName, setPaymentAccountName] = useState("");
    const [paymentAccountNumber, setPaymentAccountNumber] = useState("");
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [isLoadingPayments, setIsLoadingPayments] = useState(false);
    const [hasSetDefaultPayment, setHasSetDefaultPayment] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isVoucherLoading, setIsVoucherLoading] = useState(false);
    const [totalWeight, setTotalWeight] = useState(0);
    const [shippingOptions, setShippingOptions] = useState<any[]>([]);
    const [isLoadingShipping, setIsLoadingShipping] = useState(false);
    const [originName, setOriginName] = useState("");
    const [origin, setOrigin] = useState("");

    // Dynamic Options State
    const [couriers, setCouriers] = useState<any[]>([]);
    const [isLoadingCouriers, setIsLoadingCouriers] = useState(false);
    const shippingPrice = shippingForm.shippingPrice;
    const setShippingPrice = useCallback((price: number) => {
        setShippingForm(prev => ({ ...prev, shippingPrice: price }));
    }, []);

    // Subtotal and weight calculation is handled in the effect below fetchCartQuery definition

    const [packingFee, setPackingFee] = useState(CONFIG.PACKING_FEE);
    const [whatsappAdmin, setWhatsappAdmin] = useState("");

    // Fetch Config on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const config = await checkoutApi.getConfig(["biaya_packing", "packing_fee", "whatsapp_nomor", "kecamatan", "origin_name"]);
                const pFee = config.biaya_packing || config.packing_fee;
                if (pFee) {
                    const parsed = parseInt(pFee);
                    setPackingFee(!isNaN(parsed) ? parsed : CONFIG.PACKING_FEE);
                }
                if (config.whatsapp_nomor) setWhatsappAdmin(config.whatsapp_nomor);
                if (config.kecamatan) setOrigin(config.kecamatan);
                if (config.origin_name) setOriginName(config.origin_name);
            } catch (err) {
                console.error("Failed to fetch dynamic config:", err);
            }
        };
        fetchConfig();
    }, []);

    // Derived State
    const voucherDiscount = useMemo(() => {
        if (!isVoucherApplied || !voucherData) return 0;
        const type = voucherData.tipe_voucher?.toUpperCase();
        if (type === "NOMINAL") return voucherData.nilai_voucher;
        if (type === "PERSEN") {
            const discount = (totalAmount * voucherData.nilai_voucher) / 100;
            return voucherData.maksimal_nominal_voucher_persen > 0
                ? Math.min(discount, voucherData.maksimal_nominal_voucher_persen)
                : discount;
        }
        return 0;
    }, [isVoucherApplied, voucherData, totalAmount]);

    const grandTotal = totalAmount + shippingPrice + packingFee - voucherDiscount;
    const appliedWalletAmount = useWallet ? Math.min(walletBalance, grandTotal) : 0;
    const remainingBill = Math.max(0, grandTotal - appliedWalletAmount);

    const fetchCartQuery = useQuery({
        queryKey: queryKeys.cart.all,
        queryFn: cartApi.getCart,
    });

    // Total Weight calculation from items
    useEffect(() => {
        if (fetchCartQuery.data) {
            let items = fetchCartQuery.data.items || [];
            if (selectedIds.length > 0) {
                items = items.filter((item: any) => selectedIds.includes(item.id));
            }
            setCartItems(items);
            const total = items.reduce((acc: number, item: any) => acc + (Number(item.harga || 0) * Number(item.qty || 0)), 0);
            const weight = items.reduce((acc: number, item: any) => acc + (Number(item.berat || 0) * Number(item.qty || 0)), 0);
            setTotalAmount(total);
            setTotalWeight(weight);
        }
    }, [fetchCartQuery.data, selectedIds]);

    const isLoading = fetchCartQuery.isLoading;

    const fetchWalletQuery = useQuery({
        queryKey: queryKeys.user.wallet.balance,
        queryFn: userApi.getWalletBalance,
    });

    const fetchPaymentMethodsQuery = useQuery({
        queryKey: queryKeys.payments.methods,
        queryFn: checkoutApi.getPaymentMethods,
    });

    const fetchCouriersQuery = useQuery({
        queryKey: queryKeys.shipping.couriers,
        queryFn: checkoutApi.getCouriers,
    });

    useEffect(() => {
        if (fetchWalletQuery.data !== undefined) {
            setWalletBalance(fetchWalletQuery.data);
        }
    }, [fetchWalletQuery.data]);

    useEffect(() => {
        if (fetchPaymentMethodsQuery.data) {
            const methods = fetchPaymentMethodsQuery.data.methods || [];
            setPaymentMethods(methods);

            // Auto-select last used payment method if available and no method is currently selected
            // Use fuzzy matching to handle variations like "BCA" vs "Transfer Bank BCA"
            if (fetchPaymentMethodsQuery.data.lastUsed && !paymentMethod && !hasSetDefaultPayment) {
                const lastUsed = fetchPaymentMethodsQuery.data.lastUsed;
                const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
                const normalizedLastUsed = normalize(lastUsed);

                const found = methods.find((m: any) => {
                    const normalizedMethod = normalize(m.namaBank || "");
                    return normalizedMethod.includes(normalizedLastUsed) || normalizedLastUsed.includes(normalizedMethod);
                });

                if (found) {
                    setPaymentMethod(found.namaBank);
                    setPaymentAccountName(found.namaPemilik || "");
                    setPaymentAccountNumber(found.noRekening || "");
                    setHasSetDefaultPayment(true);
                }
            }
        }
    }, [fetchPaymentMethodsQuery.data]);

    useEffect(() => {
        if (fetchCouriersQuery.data) {
            setCouriers(fetchCouriersQuery.data);
        }
    }, [fetchCouriersQuery.data]);

    const fetchShippingCost = useCallback(async () => {
        if (!shippingForm.kecamatan || totalWeight === 0 || !origin) return;

        // Use districtId for shipping API if available, fallback to kecamatan string
        const destination = (shippingForm as any).districtId || shippingForm.kecamatan;
        const handleCosts = (costs: any[]) => {
            setShippingOptions(costs);
            if (costs.length > 0) {
                setShippingForm(prev => {
                    const exists = prev.service && prev.courier
                        ? costs.find((c: any) =>
                            c.service?.toLowerCase() === prev.service?.toLowerCase() &&
                            (c.courierCode?.toLowerCase() === prev.courier?.toLowerCase())
                        )
                        : null;

                    if (exists) {
                        return {
                            ...prev,
                            shippingPrice: exists.cost[0].value,
                            shippingType: exists.type || "automated"
                        };
                    } else {
                        const firstService = costs[0];
                        return {
                            ...prev,
                            service: firstService.service,
                            courier: firstService.courierCode || firstService.courierName || "Kurir",
                            courierName: firstService.courierName || firstService.courierCode || "Kurir",
                            shippingPrice: firstService.cost[0].value,
                            shippingType: firstService.type || "automated"
                        };
                    }
                });
            }
        };

        setIsLoadingShipping(true);
        try {
            const data = await checkoutApi.getShippingCost({
                origin: Number(origin),
                destination: Number(destination),
                weight: totalWeight,
                courier: couriers.map((c: any) => c.code).join(":"),
                price: "lowest"
            });
            if (data.rajaongkir?.results) {
                const results = data.rajaongkir.results;
                if (data.rajaongkir.originName) {
                    setOriginName(data.rajaongkir.originName);
                }
                if (data.rajaongkir.origin) {
                    setOrigin(data.rajaongkir.origin);
                }
                const allCosts = results.flatMap((r: any) =>
                    (r.costs || []).map((c: any) => ({
                        ...c,
                        courierCode: (r.code || r.name || "Kurir").toUpperCase(),
                        courierName: r.name || r.code || "Kurir"
                    }))
                ).sort((a: any, b: any) => (a.cost[0]?.value || 0) - (b.cost[0]?.value || 0));
                handleCosts(allCosts);
            }
        } catch (error) {
            console.error("Fetch Shipping Error:", error);
            toast.error("Gagal memuat biaya pengiriman");
        } finally {
            setIsLoadingShipping(false);
        }
    }, [shippingForm.kecamatan, (shippingForm as any).districtId, totalWeight, origin]);

    useEffect(() => {
        fetchShippingCost();
    }, [fetchShippingCost]);

    const refreshAll = useCallback(() => {
        fetchCartQuery.refetch();
        fetchWalletQuery.refetch();
        fetchPaymentMethodsQuery.refetch();
        fetchCouriersQuery.refetch();
    }, [fetchCartQuery, fetchWalletQuery, fetchPaymentMethodsQuery, fetchCouriersQuery]);

    useEffect(() => {
        // Force refresh cart on mount to avoid stale empty cache
        fetchCartQuery.refetch();
    }, []);

    // Sync form when selected address is updated in the addresses list (e.g., after editing in modal)
    useEffect(() => {
        if (shippingForm.addressId > 0 && addresses.length > 0) {
            const currentAddr = addresses.find((a: Address) => a.id === shippingForm.addressId);
            if (currentAddr) {
                // Check if any field has changed before updating to avoid loops
                const hasChanged =
                    shippingForm.name !== currentAddr.receiverName ||
                    shippingForm.phone !== currentAddr.phoneNumber ||
                    shippingForm.address !== currentAddr.fullAddress ||
                    shippingForm.provinsi !== currentAddr.province ||
                    shippingForm.kota !== currentAddr.city ||
                    shippingForm.kecamatan !== currentAddr.district ||
                    shippingForm.provinceId !== currentAddr.provinceId ||
                    shippingForm.cityId !== currentAddr.cityId ||
                    (shippingForm as any).districtId !== currentAddr.districtId ||
                    shippingForm.kodePos !== currentAddr.postalCode;

                if (hasChanged) {
                    setShippingForm(prev => ({
                        ...prev,
                        name: currentAddr.receiverName,
                        phone: currentAddr.phoneNumber,
                        address: currentAddr.fullAddress,
                        provinsi: currentAddr.province,
                        kota: currentAddr.city,
                        kecamatan: currentAddr.district,
                        provinceId: currentAddr.provinceId || "",
                        cityId: currentAddr.cityId || "",
                        districtId: currentAddr.districtId || currentAddr.district,
                        kodePos: currentAddr.postalCode,
                    }));
                }
            }
        }
    }, [addresses, shippingForm.addressId, shippingForm.name, shippingForm.phone, shippingForm.address, shippingForm.provinsi, shippingForm.kota, shippingForm.kecamatan, shippingForm.kodePos]);

    // Auto-fill form when addresses are loaded (initial load) - Strictly only for Primary addresses
    useEffect(() => {
        if (addresses.length > 0 && shippingForm.addressId === 0) {
            const defaultAddr = addresses.find((a: Address) => a.isPrimary === 1);

            if (defaultAddr) {
                setShippingForm(prev => ({
                    ...prev,
                    name: defaultAddr.receiverName,
                    phone: defaultAddr.phoneNumber,
                    address: defaultAddr.fullAddress,
                    addressId: defaultAddr.id,
                    customerId: parseInt(defaultAddr.customerId || "0"),
                    provinsi: defaultAddr.province,
                    kota: defaultAddr.city,
                    kecamatan: defaultAddr.district,
                    provinceId: defaultAddr.provinceId || "",
                    cityId: defaultAddr.cityId || "",
                    districtId: defaultAddr.districtId || defaultAddr.district,
                    kodePos: defaultAddr.postalCode,
                }));
            }
        }
    }, [addresses, shippingForm.addressId]);

    // Auto-sync payment account details when payment method changes
    useEffect(() => {
        if (paymentMethod && paymentMethods.length > 0) {
            const method = paymentMethods.find(m => m.namaBank === paymentMethod);
            if (method) {
                setPaymentAccountName(method.namaPemilik || "");
                setPaymentAccountNumber(method.noRekening || "");
            }
        } else if (paymentMethod === "wallet") {
            setPaymentAccountName("");
            setPaymentAccountNumber("");
        }
    }, [paymentMethod, paymentMethods]);

    useEffect(() => {
        if (useWallet && remainingBill === 0) {
            setPaymentMethod("wallet");
        } else if (paymentMethod === "wallet" && remainingBill > 0) {
            setPaymentMethod("");
        }
    }, [useWallet, remainingBill, paymentMethod]);

    const handleSelectAddress = (addr: Address) => {
        setShippingForm({
            ...shippingForm,
            name: addr.receiverName || "",
            customerId: parseInt(addr.customerId || "0"),
            phone: addr.phoneNumber || "",
            address: addr.fullAddress || "",
            addressId: addr.id || 0,
            kecamatan: addr.district || "",
            districtId: addr.districtId || addr.district,
            kota: addr.city || "",
            cityId: addr.cityId || "",
            provinsi: addr.province || "",
            provinceId: addr.provinceId || "",
            kodePos: addr.postalCode || "",
        });
        setIsSelectionModalOpen(false);
        toast.success("Alamat dipilih");
    };

    const updateQuantity = async (id: number, currentQty: number, delta: number, stock: number) => {
        const newQty = currentQty + delta;
        if (newQty < 1) return;

        // Hanya cek stok jika sedang menambah jumlah
        if (delta > 0 && newQty > (stock || 0)) {
            toast.error(`Stok tidak mencukupi (Maks. ${stock || 0})`);
            return;
        }

        const previousItems = [...cartItems];
        setCartItems(prev => prev.map(item => item.id === id ? { ...item, qty: newQty } : item));

        try {
            const response = await fetch(`/api/cart/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qty: newQty })
            });
            if (!response.ok) throw new Error("Failed to update");
            await fetchCartQuery.refetch();
            refreshCart();
        } catch (error) {
            setCartItems(previousItems);
            toast.error("Gagal memperbarui jumlah");
        }
    };

    const removeItem = async (id: number) => {
        try {
            const response = await fetch(`/api/cart/${id}`, { method: "DELETE" });
            if (response.ok) {
                toast.success("Barang dihapus dari keranjang");
                await fetchCartQuery.refetch();
                refreshCart();
            }
        } catch (error) {
            toast.error("Gagal menghapus barang");
        }
    };

    const updateNotes = async (id: number, notes: string) => {
        try {
            await cartApi.updateNotes(id, notes);
            await fetchCartQuery.refetch();
            refreshCart();
        } catch (error) {
            toast.error("Gagal memperbarui catatan");
        }
    };

    const removeAllItems = async () => {
        try {
            const response = await fetch("/api/cart", { method: "DELETE" });
            if (response.ok) {
                toast.success("Semua barang dihapus dari keranjang");
                await fetchCartQuery.refetch();
                refreshCart();
                // Redirect back to cart page after clearing
                window.location.href = "/cart";
            }
        } catch (error) {
            toast.error("Gagal mengosongkan keranjang");
        }
    };

    const applyVoucher = async () => {
        if (!voucherCode) return;
        setIsVoucherLoading(true);
        try {
            const body = {
                kode: voucherCode,
                subtotal: totalAmount,
                order_tipe: (searchParams.get("type") === "preorder") ? 2 : 1
            };
            const response = await fetch("/api/vouchers/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const result = await response.json();
            if (result.success === 1) {
                setVoucherData({
                    nilai_voucher: result.nilai_voucher,
                    tipe_voucher: result.tipe_voucher,
                    maksimal_nominal_voucher_persen: result.maksimal_nominal_voucher_persen
                });
                setIsVoucherApplied(true);
                toast.success("Voucher berhasil dipasang!");
            } else {
                toast.error(result.message || "Gagal memasang voucher");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsVoucherLoading(false);
        }
    };

    const validateCheckout = useCallback(() => {
        const newErrors: typeof errors = {};

        // 1. Address Validation
        const isAddressComplete = !!(
            shippingForm.name &&
            shippingForm.phone &&
            shippingForm.address &&
            shippingForm.kecamatan &&
            shippingForm.kota &&
            shippingForm.provinsi
        );
        if (!isAddressComplete) newErrors.address = true;

        // 2. Shipping Validation
        const isManual = shippingForm.shippingType === 'manual';
        if (!shippingForm.courier || !shippingForm.service || (!isManual && shippingForm.shippingPrice === 0)) {
            newErrors.shipping = true;
        }

        // 3. Payment Validation
        if (!paymentMethod) {
            newErrors.payment = true;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [shippingForm, shippingPrice, paymentMethod]);

    const initiateOrder = () => {
        const isValid = validateCheckout();

        if (!isValid) {
            toast.error("Lengkapi data yang masih kosong (ditandai merah)");
            return;
        }

        setIsConfirmOpen(true);
    };

    const completeOrder = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shipping: shippingForm,
                    payment: paymentMethod,
                    totalAmount: totalAmount,
                    specialNotes,
                    isDropshipper,
                    dropshipper: isDropshipper ? dropshipperForm : null,
                    voucherCode: isVoucherApplied ? voucherCode : null,
                    voucherDiscount: voucherDiscount,
                    walletAmount: appliedWalletAmount,
                    addressId: shippingForm.addressId,
                    shippingPrice: shippingPrice,
                    itemIds: selectedIds
                })
            });

            const data = await response.json();
            if (response.ok) {
                // Invalidate cart queries to ensure UI is updated
                queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
                queryClient.invalidateQueries({ queryKey: queryKeys.cart.count });
                window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: 0 } }));

                refreshCart();
                setIsSuccess(true);
                toast.success("Pesanan berhasil dibuat!");

                // Add a small delay for "smooth" transition
                await new Promise(resolve => setTimeout(resolve, 800));

                // Redirect to success page
                router.push(`/checkout/success?orderId=${encodeURIComponent(data.orderId)}`);
            } else {
                // Handle detailed stock/availability issues
                if (data.issues && data.issues.length > 0) {
                    const issueMessages = data.issues.map((issue: any) => issue.message);
                    toast.error(
                        <div className="flex flex-col gap-1">
                            <span className="font-bold">Gagal Membuat Pesanan</span>
                            <div className="text-[11px] opacity-80 flex flex-col gap-0.5">
                                {issueMessages.map((msg: string, i: number) => (
                                    <span key={i} className="block">• {msg}</span>
                                ))}
                            </div>
                        </div>,
                        { duration: 5000 }
                    );

                    queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                    // Fallback for other errors
                    const isStockError = data.desc?.toLowerCase().includes("stok") ||
                        data.desc?.toLowerCase().includes("tersedia") ||
                        data.message?.toLowerCase().includes("stok");

                    if (isStockError) {
                        queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                    toast.error(data.desc || data.message || "Gagal membuat pesanan");
                }
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsSubmitting(false);
        }
    };

    // const formatPrice = (price: number) => {
    //     return new Intl.NumberFormat("id-ID", {
    //         style: "currency",
    //         currency: "IDR",
    //         minimumFractionDigits: 0,
    //     }).format(price);
    // };

    return {
        cartItems, isLoading, totalAmount, totalWeight,
        shippingForm, setShippingForm,
        walletBalance, useWallet, setUseWallet, appliedWalletAmount,
        isDropshipper, setIsDropshipper, dropshipperForm, setDropshipperForm,
        specialNotes, setSpecialNotes,
        voucherCode, setVoucherCode, isVoucherApplied, setIsVoucherApplied, voucherDiscount, isVoucherLoading,
        addresses, isLoadingAddresses, isSelectionModalOpen, setIsSelectionModalOpen, isAddAddressModalOpen, setIsAddAddressModalOpen,
        paymentMethod, setPaymentMethod, paymentMethods, isLoadingPayments,
        isSubmitting, isSuccess, isConfirmOpen, setIsConfirmOpen,
        couriers, isLoadingCouriers, shippingOptions, setShippingOptions, isLoadingShipping, shippingPrice, setShippingPrice,
        errors, setErrors,
        packingFee, grandTotal, remainingBill, originName,
        paymentAccountName, paymentAccountNumber,
        setPaymentAccountName, setPaymentAccountNumber,
        handleSelectAddress, updateQuantity, removeItem, updateNotes, removeAllItems, applyVoucher,
        initiateOrder, completeOrder,
        setVoucherData,
        refreshShipping: fetchShippingCost
    };
}
