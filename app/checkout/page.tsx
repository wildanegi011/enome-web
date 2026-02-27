"use client";

import { Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/store/Navbar";
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
        handleSelectAddress, updateQuantity, removeItem, applyVoucher, submitOrder, formatPrice,
        setShippingOptions, setVoucherData
    } = useCheckout();

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
                                formatPrice={formatPrice}
                            />

                            {/* 2. Shipping Section Wrapper */}
                            <div className="flex flex-col gap-4 md:gap-6 bg-white border border-neutral-base-100 p-4 md:p-8 rounded-xl md:rounded-[32px] shadow-sm">
                                <AddressSection
                                    addresses={addresses}
                                    shippingForm={shippingForm}
                                    setShippingForm={setShippingForm}
                                    isSelectionModalOpen={isSelectionModalOpen}
                                    setIsSelectionModalOpen={setIsSelectionModalOpen}
                                    isAddAddressModalOpen={isAddAddressModalOpen}
                                    setIsAddAddressModalOpen={setIsAddAddressModalOpen}
                                    handleSelectAddress={handleSelectAddress}
                                />

                                <div className="h-px bg-neutral-base-50 my-1 md:my-2" />

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
                                />

                                <div className="h-px bg-neutral-base-50 my-1 md:my-2" />

                                <DropshipperSection
                                    isDropshipper={isDropshipper}
                                    setIsDropshipper={setIsDropshipper}
                                    dropshipperForm={dropshipperForm}
                                    setDropshipperForm={setDropshipperForm}
                                />
                            </div>

                            {/* 4. Payment Method */}
                            <PaymentSection
                                remainingBill={remainingBill}
                                useWallet={useWallet}
                                isLoadingPayments={isLoadingPayments}
                                paymentMethods={paymentMethods}
                                paymentMethod={paymentMethod}
                                setPaymentMethod={setPaymentMethod}
                            />
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
