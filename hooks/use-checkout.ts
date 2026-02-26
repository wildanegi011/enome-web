"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
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
    const queryClient = useQueryClient();
    const selectedIds = useMemo(() =>
        searchParams.get("ids")?.split(",").map(id => parseInt(id)) || [],
        [searchParams]
    );

    const [cartItems, setCartItems] = useState<any[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const { refreshCart } = useCart();

    // Shipping Form State
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
        kodePos: "",
        resi: "",
        catatan: "",
        service: "",
    });

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
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [isLoadingPayments, setIsLoadingPayments] = useState(false);

    // Order Result
    const [orderResult, setOrderResult] = useState<{
        orderId: string,
        total: number,
        paymentMethod?: string,
        uniqueCode?: number,
        bankAccount?: string,
        bankOwner?: string,
        bankName?: string,
        // Added breakdown fields for SuccessState:
        subtotal?: number,
        shippingPrice?: number,
        packingFee?: number,
        voucherDiscount?: number,
        walletDeduction?: number
    } | null>(null);
    const [lastOrderedItems, setLastOrderedItems] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVoucherLoading, setIsVoucherLoading] = useState(false);

    // Dynamic Options State
    const [couriers, setCouriers] = useState<any[]>([]);
    const [isLoadingCouriers, setIsLoadingCouriers] = useState(false);
    const [totalWeight, setTotalWeight] = useState(0);
    const [shippingOptions, setShippingOptions] = useState<any[]>([]);
    const [isLoadingShipping, setIsLoadingShipping] = useState(false);
    const [shippingPrice, setShippingPrice] = useState(0);

    const packingFee = CONFIG.PACKING_FEE;

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

    const isLoading = fetchCartQuery.isLoading;

    const fetchWalletQuery = useQuery({
        queryKey: queryKeys.user.wallet,
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

    useEffect(() => {
        if (fetchWalletQuery.data !== undefined) {
            setWalletBalance(fetchWalletQuery.data);
        }
    }, [fetchWalletQuery.data]);

    useEffect(() => {
        if (fetchPaymentMethodsQuery.data) {
            setPaymentMethods(fetchPaymentMethodsQuery.data);
        }
    }, [fetchPaymentMethodsQuery.data]);

    useEffect(() => {
        if (fetchCouriersQuery.data) {
            setCouriers(fetchCouriersQuery.data);
        }
    }, [fetchCouriersQuery.data]);

    const fetchShippingCost = useCallback(async () => {
        if (!shippingForm.kecamatan || totalWeight === 0) return;

        const cacheKey = `shippingCost_${shippingForm.kecamatan}_${totalWeight}`;
        const cachedStr = sessionStorage.getItem(cacheKey);

        const handleCosts = (costs: any[]) => {
            setShippingOptions(costs);
            if (costs.length > 0) {
                setShippingForm(prev => {
                    const exists = prev.service ? costs.find((c: any) => c.service === prev.service) : null;
                    if (exists) {
                        setShippingPrice(exists.cost[0].value);
                        return prev;
                    } else {
                        const firstService = costs[0];
                        setShippingPrice(firstService.cost[0].value);
                        return {
                            ...prev,
                            service: firstService.service,
                            courier: firstService.courierCode || prev.courier
                        };
                    }
                });
            }
        };

        if (cachedStr) {
            try {
                const costs = JSON.parse(cachedStr);
                handleCosts(costs);
                return; // Gunakan cache
            } catch (e) {
                console.error("Failed to parse cached shipping cost");
            }
        }

        setIsLoadingShipping(true);
        try {
            const data = await checkoutApi.getShippingCost({
                destination: shippingForm.kecamatan,
                weight: totalWeight,
                courier: "ALL"
            });
            if (data.rajaongkir?.results?.[0]?.costs) {
                const costs = data.rajaongkir.results[0].costs;
                sessionStorage.setItem(cacheKey, JSON.stringify(costs));
                handleCosts(costs);
            }
        } catch (error) {
            console.error("Fetch Shipping Error:", error);
            toast.error("Gagal memuat biaya pengiriman");
        } finally {
            setIsLoadingShipping(false);
        }
    }, [shippingForm.kecamatan, totalWeight]);

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

    // Auto-fill form when addresses are loaded
    useEffect(() => {
        if (addresses.length > 0 && shippingForm.addressId === 0) {
            const defaultAddr = addresses.find((a: Address) => a.isPrimary === 1) ||
                addresses.find((a: Address) => a.type === "Profile") ||
                addresses[0];

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
                    kodePos: defaultAddr.postalCode,
                }));
            }
        }
    }, [addresses, shippingForm.addressId]);

    // Auto-select payment method logic
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
            kota: addr.city || "",
            provinsi: addr.province || "",
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

    const submitOrder = async () => {
        if (!shippingForm.name || !shippingForm.phone || !shippingForm.address || !shippingForm.courier) {
            toast.error("Lengkapi data pengiriman");
            return;
        }
        if (!paymentMethod) {
            toast.error("Pilih metode pembayaran");
            return;
        }

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
                    resi: shippingForm.resi,
                    catatan: shippingForm.catatan,
                    isDropshipper,
                    dropshipper: isDropshipper ? dropshipperForm : null,
                    voucherCode: isVoucherApplied ? voucherCode : null,
                    voucherDiscount: voucherDiscount,
                    walletAmount: appliedWalletAmount,
                    addressId: shippingForm.addressId,
                    shippingPrice: shippingPrice
                })
            });

            const data = await response.json();
            if (response.ok) {
                setOrderResult({
                    orderId: data.orderId,
                    total: data.meta?.totalTagihan || data.totalAmount || (totalAmount + shippingPrice + packingFee - voucherDiscount - appliedWalletAmount),
                    paymentMethod: data.paymentMethod,
                    uniqueCode: data.uniqueCode,
                    bankAccount: data.bankAccount,
                    bankOwner: data.bankOwner,
                    bankName: data.bankName,
                    subtotal: data.subtotal || totalAmount,
                    shippingPrice: data.meta?.shippingCost || shippingPrice,
                    packingFee: data.meta?.packingFee || packingFee,
                    voucherDiscount: data.meta?.discountAmount || voucherDiscount,
                    walletDeduction: data.meta?.finalWalletAmount || appliedWalletAmount
                });
                setLastOrderedItems([...cartItems]);
                refreshCart();
                toast.success("Pesanan berhasil dibuat!");
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                // Jika gagal karena stok atau ketersediaan, refresh seluruh data keranjang
                // agar highlight merah dan info stok terbaru muncul di tiap item
                if (data.desc?.includes("stok") || data.desc?.includes("tersedia") || data.message?.includes("stok")) {
                    queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
                    // Scroll ke atas agar user langsung melihat item yang ditandai merah
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
                toast.error(data.desc || data.message || "Gagal membuat pesanan");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    return {
        cartItems, isLoading, totalAmount, totalWeight,
        shippingForm, setShippingForm,
        walletBalance, useWallet, setUseWallet, appliedWalletAmount,
        isDropshipper, setIsDropshipper, dropshipperForm, setDropshipperForm,
        specialNotes, setSpecialNotes,
        voucherCode, setVoucherCode, isVoucherApplied, setIsVoucherApplied, voucherDiscount, isVoucherLoading,
        addresses, isLoadingAddresses, isSelectionModalOpen, setIsSelectionModalOpen, isAddAddressModalOpen, setIsAddAddressModalOpen,
        paymentMethod, setPaymentMethod, paymentMethods, isLoadingPayments,
        orderResult, lastOrderedItems, isSubmitting,
        couriers, isLoadingCouriers, shippingOptions, setShippingOptions, isLoadingShipping, shippingPrice, setShippingPrice,
        packingFee, grandTotal, remainingBill,
        handleSelectAddress, updateQuantity, removeItem, applyVoucher, submitOrder, formatPrice, setVoucherData
    };
}
