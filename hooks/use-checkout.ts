"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useAddresses, Address } from "@/hooks/use-addresses";

export function useCheckout() {
    const searchParams = useSearchParams();
    const selectedIds = useMemo(() =>
        searchParams.get("ids")?.split(",").map(id => parseInt(id)) || [],
        [searchParams]
    );

    const [cartItems, setCartItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
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
    const [orderResult, setOrderResult] = useState<{ orderId: string, total: number } | null>(null);
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

    const packingFee = 2000;

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

    const fetchCart = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/cart");
            const data = await response.json();
            let items = data.items || [];
            if (selectedIds.length > 0) {
                items = items.filter((item: any) => selectedIds.includes(item.id));
            }
            setCartItems(items);
            const total = items.reduce((acc: number, item: any) => acc + (Number(item.harga || 0) * Number(item.qty || 0)), 0);
            const weight = items.reduce((acc: number, item: any) => acc + (Number(item.berat || 0) * Number(item.qty || 0)), 0);
            setTotalAmount(total);
            setTotalWeight(weight);
        } catch (error) {
            toast.error("Gagal mengambil data keranjang");
        } finally {
            setIsLoading(false);
        }
    }, [selectedIds]);

    const fetchWallet = async () => {
        try {
            const response = await fetch("/api/user/wallet");
            const data = await response.json();
            setWalletBalance(data.balance || 0);
        } catch (error) {
            console.error("Fetch Wallet Error:", error);
        }
    };

    const fetchPaymentMethods = async () => {
        setIsLoadingPayments(true);
        try {
            const response = await fetch("/api/payment-methods");
            const data = await response.json();
            setPaymentMethods(data || []);
        } catch (error) {
            console.error("Fetch Payment Methods Error:", error);
        } finally {
            setIsLoadingPayments(false);
        }
    };

    const fetchCouriers = async () => {
        setIsLoadingCouriers(true);
        try {
            const response = await fetch("/api/couriers");
            const data = await response.json();
            setCouriers(data || []);
        } catch (error) {
            console.error("Fetch Couriers Error:", error);
        } finally {
            setIsLoadingCouriers(false);
        }
    };

    const fetchShippingCost = useCallback(async () => {
        if (!shippingForm.courier || !shippingForm.kecamatan || totalWeight === 0) return;
        setIsLoadingShipping(true);
        try {
            const response = await fetch("/api/shipping", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    destination: shippingForm.kecamatan,
                    weight: totalWeight,
                    courier: shippingForm.courier
                })
            });
            const data = await response.json();
            if (data.rajaongkir?.results?.[0]?.costs) {
                const costs = data.rajaongkir.results[0].costs;
                setShippingOptions(costs);
                if (costs.length > 0) {
                    const firstService = costs[0];
                    setShippingPrice(firstService.cost[0].value);
                    setShippingForm(prev => ({ ...prev, service: firstService.service }));
                }
            }
        } catch (error) {
            console.error("Fetch Shipping Error:", error);
            toast.error("Gagal memuat biaya pengiriman");
        } finally {
            setIsLoadingShipping(false);
        }
    }, [shippingForm.courier, shippingForm.kecamatan, totalWeight]);

    useEffect(() => {
        fetchShippingCost();
    }, [fetchShippingCost]);

    useEffect(() => {
        fetchCart();
        fetchWallet();
        fetchPaymentMethods();
        fetchCouriers();
    }, [fetchCart]);

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
        if (newQty > (stock || 999)) {
            toast.error(`Stok tidak mencukupi (Maks. ${stock})`);
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
            await fetchCart();
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
                await fetchCart();
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
                setOrderResult({ orderId: data.orderId, total: data.totalAmount });
                setLastOrderedItems([...cartItems]);
                refreshCart();
                toast.success("Pesanan berhasil dibuat!");
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                toast.error(data.message || "Gagal membuat pesanan");
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
