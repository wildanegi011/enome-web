"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Loader2, Check, ShoppingBag, MapPin, Truck, CreditCard, ChevronRight } from "lucide-react";
import clsx from "clsx";
import Breadcrumb from "@/components/store/shared/Breadcrumb";
import { useCheckout } from "@/hooks/use-checkout";

// Modular Components
import CartReview from "@/components/store/checkout/CartReview";
import AddressSection from "@/components/store/checkout/AddressSection";
import CourierSection from "@/components/store/checkout/CourierSection";
import PaymentSection from "@/components/store/checkout/PaymentSection";
import OrderSummary from "@/components/store/checkout/OrderSummary";
import dynamic from "next/dynamic";
const OrderConfirmation = dynamic(() => import("@/components/store/checkout/OrderConfirmation"), { ssr: false });
import { formatCurrency } from "@/lib/utils";

export default function CheckoutClient() {
    const {
        cartItems, isLoading, totalAmount, totalWeight,
        shippingForm, setShippingForm,
        walletBalance, useWallet, setUseWallet, appliedWalletAmount,
        isDropshipper, setIsDropshipper, dropshipperForm, setDropshipperForm,
        specialNotes, setSpecialNotes,
        voucherCode, setVoucherCode, isVoucherApplied, setIsVoucherApplied, voucherDiscount, isVoucherLoading,
        addresses, isLoadingAddresses, isSelectionModalOpen, setIsSelectionModalOpen, isAddAddressModalOpen, setIsAddAddressModalOpen,
        paymentMethod, setPaymentMethod, paymentMethodId, setPaymentMethodId, paymentMethods, isLoadingPayments,
        isSubmitting, isSuccess,
        shippingOptions, isLoadingShipping, shippingPrice, setShippingPrice,
        packingFee, grandTotal, remainingBill, originName,
        uniqueCode,
        paymentAccountName, paymentAccountNumber,
        handleSelectAddress, updateQuantity, removeItem, updateNotes, removeAllItems, applyVoucher, clearVoucher,
        initiateOrder, completeOrder,
        setVoucherData,
        isConfirmOpen, setIsConfirmOpen,
        errors, setErrors,
        refreshShipping,
    } = useCheckout();

    const addressRef = useRef<HTMLDivElement>(null);
    const shippingRef = useRef<HTMLDivElement>(null);
    const paymentRef = useRef<HTMLDivElement>(null);

    // Scroll to error effect
    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            const firstError = Object.keys(errors)[0];
            let targetRef: React.RefObject<HTMLDivElement | null> | null = null;

            if (firstError === "address") targetRef = addressRef;
            else if (firstError === "shipping") targetRef = shippingRef;
            else if (firstError === "payment") targetRef = paymentRef;

            if (targetRef?.current) {
                const yOffset = -150; // Account for sticky breadcrumb
                const y = targetRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: "smooth" });
            }
        }
    }, [errors]);

    if (isLoading && cartItems.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-800/20" />
            </div>
        );
    }

    return (
        <div className="selection:bg-amber-100 selection:text-amber-900 pb-10 md:pb-20">
            {/* Premium Header & Stepper Section */}
            <div className="bg-white border-b border-neutral-base-100/50 pt-3 md:pt-6 pb-2 sticky top-[70px] md:top-[80px] z-30 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 text-left">
                    <div className="mb-4 hidden md:block">
                        <Breadcrumb
                            items={[
                                { label: "Beranda", href: "/" },
                                { label: "Keranjang", href: "/cart" },
                                { label: "Checkout" }
                            ]}
                        />
                    </div>

                    {/* Modern Stepper */}
                    <div className="flex items-center justify-between max-w-2xl mx-auto mb-1 md:mb-2 relative">
                        {[
                            { id: "cart", label: "Keranjang", icon: ShoppingBag, step: 1 },
                            { id: "address", label: "Pengiriman", icon: MapPin, step: 2 },
                            { id: "payment", label: "Pembayaran", icon: CreditCard, step: 3 }
                        ].map((s, idx, arr) => {
                            const isActive = s.id === "cart" || (s.id === "address" && shippingForm.addressId) || (s.id === "payment" && paymentMethod);

                            return (
                                <div key={s.id} className="flex flex-col items-center relative z-10 flex-1">
                                    <div className={clsx(
                                        "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm border-2",
                                        isActive ? "bg-neutral-base-900 border-neutral-base-900 text-white" : "bg-white border-neutral-base-100 text-neutral-base-300"
                                    )}>
                                        {isActive ? <Check className="w-4 h-4 md:w-6 md:h-6" /> : <s.icon className="w-4 h-4 md:w-6 md:h-6" />}
                                    </div>
                                    <span className={clsx(
                                        "mt-1.5 md:mt-2 text-[9px] md:text-[11px] font-bold uppercase tracking-widest transition-colors duration-300",
                                        isActive ? "text-neutral-base-900" : "text-neutral-base-300"
                                    )}>
                                        {s.label}
                                    </span>

                                    {idx < arr.length - 1 && (
                                        <div className="absolute left-[calc(50%+18px)] md:left-[calc(50%+24px)] right-[-50%] top-4.5 md:top-6 h-[2px] bg-neutral-base-100 -z-10 overflow-hidden">
                                            <div
                                                className="h-full bg-neutral-base-900 transition-all duration-700 ease-out"
                                                style={{ width: isActive ? '100%' : '0%' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto pt-2 px-4">
                <AnimatePresence mode="wait">
                    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
                        {/* Main Checkout Form */}
                        <div className="flex-1 flex flex-col gap-4 md:gap-8 w-full min-w-0">
                            {/* 1. Cart Review */}
                            <m.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <CartReview
                                    items={cartItems}
                                    isLoading={isLoading}
                                    updateQuantity={updateQuantity}
                                    removeItem={removeItem}
                                    updateNotes={updateNotes}
                                    removeAllItems={removeAllItems}
                                    formatPrice={formatCurrency}
                                />
                            </m.div>

                            {/* 2. Address Section */}
                            <m.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="w-full"
                                ref={addressRef}
                                id="address-section"
                            >
                                <AddressSection
                                    addresses={addresses}
                                    shippingForm={shippingForm}
                                    setShippingForm={setShippingForm}
                                    isSelectionModalOpen={isSelectionModalOpen}
                                    setIsSelectionModalOpen={setIsSelectionModalOpen}
                                    isAddAddressModalOpen={isAddAddressModalOpen}
                                    setIsAddAddressModalOpen={setIsAddAddressModalOpen}
                                    handleSelectAddress={handleSelectAddress}
                                    hasError={errors?.address}
                                    onFieldChange={() => setErrors(prev => ({ ...prev, address: false }))}
                                />
                            </m.div>

                            {/* 3. Courier Section */}
                            <m.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="w-full"
                                ref={shippingRef}
                                id="shipping-section"
                            >
                                <CourierSection
                                    shippingForm={shippingForm}
                                    setShippingForm={setShippingForm}
                                    shippingOptions={shippingOptions}
                                    isLoadingShipping={isLoadingShipping}
                                    totalWeight={totalWeight}
                                    formatPrice={formatCurrency}
                                    hasError={errors?.shipping}
                                    onFieldChange={() => setErrors(prev => ({ ...prev, shipping: false }))}
                                    onRefresh={refreshShipping}
                                    originName={originName}
                                />
                            </m.div>

                            {/* 4. Payment Method */}
                            <m.div
                                ref={paymentRef}
                                id="payment-section"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <PaymentSection
                                    remainingBill={remainingBill}
                                    useWallet={useWallet}
                                    isLoadingPayments={isLoadingPayments}
                                    paymentMethods={paymentMethods}
                                    paymentMethod={paymentMethod}
                                    paymentMethodId={paymentMethodId}
                                    setPaymentMethod={setPaymentMethod}
                                    setPaymentMethodId={setPaymentMethodId}
                                    hasError={errors?.payment}
                                    onFieldChange={() => setErrors(prev => ({ ...prev, payment: false }))}
                                />
                            </m.div>
                        </div>

                        {/* Order Summary Sidebar */}
                        <OrderSummary
                            totalAmount={totalAmount}
                            shippingForm={shippingForm}
                            isLoadingShipping={isLoadingShipping}
                            shippingPrice={shippingPrice}
                            isVoucherApplied={isVoucherApplied}
                            voucherDiscount={voucherDiscount}
                            packingFee={packingFee}
                            uniqueCode={uniqueCode}
                            grandTotal={grandTotal}
                            useWallet={useWallet}
                            setUseWallet={setUseWallet}
                            walletBalance={walletBalance}
                            appliedWalletAmount={appliedWalletAmount}
                            voucherCode={voucherCode}
                            setVoucherCode={setVoucherCode}
                            setIsVoucherApplied={setIsVoucherApplied}
                            setVoucherData={setVoucherData}
                            applyVoucher={applyVoucher}
                            clearVoucher={clearVoucher}
                            isVoucherLoading={isVoucherLoading}
                            remainingBill={remainingBill}
                            isSubmitting={isSubmitting}
                            cartItemsCount={cartItems.length}
                            hasStockProblems={cartItems.some(item =>
                                item.isOnline === 0 ||
                                (item.stock !== undefined && (item.stock <= 0 || Number(item.qty) > item.stock))
                            )}
                            initiateOrder={initiateOrder}
                            formatPrice={formatCurrency}
                        />
                    </div>
                </AnimatePresence>
            </main>

            {/* Mobile Sticky Footer */}
            <AnimatePresence>
                {cartItems.length > 0 && (
                    <m.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-base-100 p-4 md:hidden z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] backdrop-blur-md"
                    >
                        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-neutral-base-400 uppercase tracking-widest leading-none mb-1">Total Tagihan</span>
                                <span className="text-[20px] font-bold text-neutral-base-900 tracking-tight tabular-nums">
                                    {formatCurrency(grandTotal)}
                                </span>
                            </div>
                            <button
                                disabled={isSubmitting || cartItems.length === 0 || cartItems.some(item =>
                                    item.isOnline === 0 ||
                                    (item.stock !== undefined && (item.stock <= 0 || Number(item.qty) > item.stock))
                                )}
                                onClick={initiateOrder}
                                className="h-12 px-6 bg-neutral-base-900 text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-neutral-base-900/10 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Bayar
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* Order Confirmation Modal/Drawer */}
            <OrderConfirmation
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={completeOrder}
                isSubmitting={isSubmitting}
                isSuccess={isSuccess}
                cartItems={cartItems}
                shippingForm={shippingForm}
                paymentMethod={paymentMethod}
                paymentAccountName={paymentAccountName}
                paymentAccountNumber={paymentAccountNumber}
                grandTotal={grandTotal}
                shippingPrice={shippingPrice}
                packingFee={packingFee}
                voucherDiscount={voucherDiscount}
                appliedWalletAmount={appliedWalletAmount}
                remainingBill={remainingBill}
                subtotal={totalAmount}
                uniqueCode={uniqueCode}
                formatPrice={formatCurrency}
            />
        </div>
    );
}
