"use client";

import { useEffect, useRef, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/store/Navbar";
import Breadcrumb from "@/components/store/Breadcrumb";
import { useCheckout } from "@/hooks/use-checkout";

// Modular Components
import CartReview from "@/components/store/checkout/CartReview";
import AddressSection from "@/components/store/checkout/AddressSection";
import CourierSection from "@/components/store/checkout/CourierSection";
import DropshipperSection from "@/components/store/checkout/DropshipperSection";
import PaymentSection from "@/components/store/checkout/PaymentSection";
import OrderSummary from "@/components/store/checkout/OrderSummary";
import SuccessState from "@/components/store/checkout/SuccessState";

function CheckoutContent() {
    const {
        cartItems, isLoading, totalAmount, totalWeight,
        shippingForm, setShippingForm,
        walletBalance, useWallet, setUseWallet, appliedWalletAmount,
        isDropshipper, setIsDropshipper, dropshipperForm, setDropshipperForm,
        voucherCode, setVoucherCode, isVoucherApplied, setIsVoucherApplied, voucherDiscount, isVoucherLoading,
        addresses, isLoadingAddresses, isSelectionModalOpen, setIsSelectionModalOpen, isAddAddressModalOpen, setIsAddAddressModalOpen,
        paymentMethod, setPaymentMethod, paymentMethods, isLoadingPayments,
        orderResult, lastOrderedItems, isSubmitting,
        couriers, isLoadingCouriers, shippingOptions, isLoadingShipping, shippingPrice, setShippingPrice,
        packingFee, grandTotal, remainingBill,
        handleSelectAddress, updateQuantity, removeItem, removeAllItems, applyVoucher, submitOrder, formatPrice,
        setShippingOptions, setVoucherData,
        errors, setErrors
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

    if (orderResult) {
        return (
            <div className="min-h-screen bg-neutral-base-50">
                <Navbar />
                <SuccessState
                    orderResult={orderResult}
                    lastOrderedItems={lastOrderedItems}
                    formatPrice={formatPrice}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-base-50 pb-10 md:pb-20">
            <Navbar />

            {/* Sticky Breadcrumb Section */}
            <div className="sticky top-[70px] md:top-[80px] z-30 bg-white/95 backdrop-blur-md border-b border-neutral-base-100">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Breadcrumb
                        items={[
                            { label: "Beranda", href: "/" },
                            { label: "Keranjang", href: "/cart" },
                            { label: "Checkout" }
                        ]}
                    />
                </div>
            </div>

            <main className="max-w-7xl mx-auto pt-4 md:pt-8 px-4">
                <AnimatePresence mode="wait">
                    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
                        {/* Main Checkout Form */}
                        <div className="flex-1 flex flex-col gap-4 md:gap-8 w-full min-w-0">
                            {/* 1. Cart Review */}
                            <CartReview
                                items={cartItems}
                                isLoading={isLoading}
                                updateQuantity={updateQuantity}
                                removeItem={removeItem}
                                removeAllItems={removeAllItems}
                                formatPrice={formatPrice}
                            />

                            {/* 2. Shipping Section Wrapper */}
                            <div className="flex flex-col gap-4 md:gap-6 bg-white border border-neutral-base-100 p-4 md:p-8 rounded-xl md:rounded-[32px] shadow-sm">
                                <div ref={addressRef} id="address-section">
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
                                </div>

                                <div className="h-px bg-neutral-base-50 my-1 md:my-2" />

                                <div ref={shippingRef} id="shipping-section">
                                    <CourierSection
                                        couriers={couriers}
                                        isLoadingCouriers={isLoadingCouriers}
                                        shippingForm={shippingForm}
                                        setShippingForm={setShippingForm}
                                        shippingOptions={shippingOptions}
                                        isLoadingShipping={isLoadingShipping}
                                        setShippingPrice={setShippingPrice}
                                        setShippingOptions={setShippingOptions}
                                        totalWeight={totalWeight}
                                        formatPrice={formatPrice}
                                        hasError={errors?.shipping}
                                        onFieldChange={() => setErrors(prev => ({ ...prev, shipping: false }))}
                                    />
                                </div>

                                <div className="h-px bg-neutral-base-50 my-1 md:my-2" />

                                <DropshipperSection
                                    isDropshipper={isDropshipper}
                                    setIsDropshipper={setIsDropshipper}
                                    dropshipperForm={dropshipperForm}
                                    setDropshipperForm={setDropshipperForm}
                                />
                            </div>

                            {/* 4. Payment Method */}
                            <div ref={paymentRef} id="payment-section">
                                <PaymentSection
                                    remainingBill={remainingBill}
                                    useWallet={useWallet}
                                    isLoadingPayments={isLoadingPayments}
                                    paymentMethods={paymentMethods}
                                    paymentMethod={paymentMethod}
                                    setPaymentMethod={setPaymentMethod}
                                    hasError={errors?.payment}
                                    onFieldChange={() => setErrors(prev => ({ ...prev, payment: false }))}
                                />
                            </div>
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
                            useWallet={useWallet}
                            setUseWallet={setUseWallet}
                            walletBalance={walletBalance}
                            appliedWalletAmount={appliedWalletAmount}
                            voucherCode={voucherCode}
                            setVoucherCode={setVoucherCode}
                            setIsVoucherApplied={setIsVoucherApplied}
                            setVoucherData={setVoucherData}
                            applyVoucher={applyVoucher}
                            isVoucherLoading={isVoucherLoading}
                            remainingBill={remainingBill}
                            isSubmitting={isSubmitting}
                            cartItemsCount={cartItems.length}
                            submitOrder={submitOrder}
                            formatPrice={formatPrice}
                        />
                    </div>
                </AnimatePresence>
            </main>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-neutral-base-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-800/20" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
