"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { userApi } from "@/lib/api/user-api";
import { CONFIG } from "@/lib/config";
import { usePusher } from "@/hooks/use-pusher";
import { toast } from "sonner";
import { PaymentSuccessToast } from "@/components/store/shared/PaymentSuccessToast";

interface UsePaymentVerificationReturn {
    timeLeft: number | null;
    isVerifying: boolean;
    isTimeout: boolean;
    isSuccess: boolean;
    startVerification: () => void;
    statusOrder: string | null;
    statusTagihan: string | null;
}

export function usePaymentVerification(
    orderId: string,
    initialStatus: string,
    onSuccess?: () => void,
    options: { 
        silent?: boolean,
        initialStatusOrder?: string | null,
        timeoutMins?: number
    } = {}
): UsePaymentVerificationReturn {
    const { silent = false, initialStatusOrder = null, timeoutMins: propTimeoutMins } = options;
    const storageKey = `verify_start_${orderId}`;
    const timeoutKey = `verify_timeout_${orderId}`;
    const syncEventName = `payment_verify_sync_${orderId}`;

    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isTimeout, setIsTimeout] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusOrder, setStatusOrder] = useState<string | null>(initialStatusOrder);
    const [statusTagihan, setStatusTagihan] = useState<string | null>(initialStatus);

    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Helper to broadcast state changes to other components in the same tab
    const broadcastSync = useCallback((type: "start" | "success" | "timeout") => {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent(syncEventName, { detail: { type } }));
        }
    }, [syncEventName]);

    // Integrate Pusher for real-time updates
    const handlePusherEvent = useCallback((data: any) => {
        // Log for debugging (can be removed later)
        console.log("Pusher event received in hook:", data);
        
        if (String(data.orderId) === String(orderId)) {
            const sOrder = data.statusOrder?.toUpperCase();
            const sTagihan = data.statusTagihan?.toUpperCase();

            if (sOrder) setStatusOrder(sOrder);
            if (sTagihan) setStatusTagihan(sTagihan);
            
            if (sTagihan === "BAYAR" || sTagihan === "SUDAH BAYAR" || (sOrder && sOrder !== "OPEN" && sOrder !== "UNPAID")) {
                if (!isSuccess) {
                    setIsSuccess(true);
                    setIsVerifying(false);
                    setIsTimeout(false);
                    setTimeLeft(0);
                    localStorage.removeItem(storageKey);
                    localStorage.removeItem(timeoutKey);
                    broadcastSync("success");
                    
                    if (!silent && (sTagihan === "BAYAR" || sTagihan === "SUDAH BAYAR")) {
                        const title = data.title || "Pembayaran Berhasil!";
                        const message = data.message || "Pesanan Anda sedang diproses.";
                        toast.custom(() => (
                            <PaymentSuccessToast title={title} message={message} />
                        ), {
                            duration: 5000,
                        });
                    }
                    
                    if (onSuccess) onSuccess();
                }
            }
        }
    }, [orderId, isSuccess, storageKey, timeoutKey, broadcastSync, onSuccess]);

    usePusher("my-channel", "my-event", handlePusherEvent);

    const checkStatus = useCallback(async () => {
        if (document.visibilityState !== "visible") return;

        try {
            const response = await userApi.getOrderDetail(orderId);
            const sOrder = response?.order?.statusOrder?.toUpperCase();
            const sTagihan = response?.order?.statusTagihan?.toUpperCase();
            const serverTimeout = response?.paymentVerificationTimeout;

            if (sOrder) setStatusOrder(sOrder);
            if (sTagihan) setStatusTagihan(sTagihan);

            // If we don't have a timeLeft yet (e.g. just started or refreshed), 
            // use the server's suggested timeout or fallback
            if (timeLeft === null && !isSuccess && !isTimeout) {
                const timeoutMins = serverTimeout || CONFIG.PAYMENT_VERIFICATION_TIMEOUT_MINS;
                const storedStart = localStorage.getItem(storageKey);
                if (storedStart) {
                    const startTime = parseInt(storedStart, 10);
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    const remaining = (timeoutMins * 60) - elapsed;
                    setTimeLeft(remaining > 0 ? remaining : 0);
                } else if (isVerifying) {
                    setTimeLeft(timeoutMins * 60);
                }
            }

            if (sTagihan === "BAYAR" || sTagihan === "SUDAH BAYAR" || (sOrder && sOrder !== "OPEN" && sOrder !== "UNPAID")) {
                if (!isSuccess) {
                    setIsSuccess(true);
                    setIsVerifying(false);
                    setTimeLeft(0);
                    localStorage.removeItem(storageKey);
                    localStorage.removeItem(timeoutKey);
                    broadcastSync("success");
                    if (!silent && (sTagihan === "BAYAR" || sTagihan === "SUDAH BAYAR")) {
                        toast.custom(() => (
                            <PaymentSuccessToast 
                                title="Pembayaran Terdeteksi!" 
                                message="Pesanan Anda sedang diproses." 
                            />
                        ), {
                            duration: 5000,
                        });
                    }
                    if (onSuccess) onSuccess();
                }
                return true;
            }
        } catch (error) {
            console.error("Polling error:", error);
        }
        return false;
    }, [orderId, storageKey, timeoutKey, onSuccess, isSuccess, timeLeft, isTimeout, isVerifying, broadcastSync]);

    const handleTimeout = useCallback(async () => {
        // Final Check at 0 seconds
        const found = await checkStatus();
        if (!found) {
            setIsTimeout(true);
            setIsVerifying(true); // Keep UI in "verifying" style but show timeout message

            // Persist timeout state so it remains after refresh
            localStorage.setItem(timeoutKey, "true");
            localStorage.removeItem(storageKey);
            broadcastSync("timeout");
        }
    }, [checkStatus, storageKey, timeoutKey, broadcastSync]);

    const startVerification = useCallback(() => {
        localStorage.setItem(storageKey, Date.now().toString());
        localStorage.removeItem(timeoutKey); // Clear previous timeout if any
        
        const finalTimeoutMins = propTimeoutMins || CONFIG.PAYMENT_VERIFICATION_TIMEOUT_MINS;
        setTimeLeft(finalTimeoutMins * 60);
        setIsVerifying(true);
        setIsTimeout(false);
        setIsSuccess(false);
        broadcastSync("start");
        if (!silent) {
            toast.info("Memulai verifikasi otomatis. Mohon tunggu...");
        }
        // Initial check immediately
        checkStatus();
    }, [storageKey, timeoutKey, checkStatus, broadcastSync]);

    // Listen for storage events (cross-tab sync)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === storageKey) {
                if (e.newValue) {
                    // Verification started in another tab
                    const startTime = parseInt(e.newValue, 10);
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    const finalTimeoutMins = propTimeoutMins || CONFIG.PAYMENT_VERIFICATION_TIMEOUT_MINS;
                    const remaining = (finalTimeoutMins * 60) - elapsed;

                    if (remaining > 0) {
                        setRemainingTime(remaining);
                    }
                } else {
                    // Storage cleared in another tab (success or manually)
                    // We'll let the custom event or polling handle the state change if needed,
                    // but usually clearing means success or reset.
                }
            }
        };

        const setRemainingTime = (time: number) => {
            setTimeLeft(time);
            setIsVerifying(true);
            setIsTimeout(false);
            setIsSuccess(false);
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [storageKey]);

    // Listen for custom sync events (same-tab multi-component sync)
    useEffect(() => {
        const handleSync = (e: any) => {
            const { type } = e.detail;
            if (type === "start") {
                const storedStart = localStorage.getItem(storageKey);
                if (storedStart) {
                    const startTime = parseInt(storedStart, 10);
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    const finalTimeoutMins = propTimeoutMins || CONFIG.PAYMENT_VERIFICATION_TIMEOUT_MINS;
                    const remaining = (finalTimeoutMins * 60) - elapsed;
                    setTimeLeft(remaining > 0 ? remaining : 0);
                    setIsVerifying(true);
                    setIsTimeout(false);
                    setIsSuccess(false);
                }
            } else if (type === "success") {
                setIsSuccess(true);
                setIsVerifying(false);
                setIsTimeout(false);
                setTimeLeft(0);
            } else if (type === "timeout") {
                setIsTimeout(true);
                setIsVerifying(true);
            }
        };

        window.addEventListener(syncEventName, handleSync);
        return () => window.removeEventListener(syncEventName, handleSync);
    }, [syncEventName, storageKey]);

    // Initial state setup from localStorage
    useEffect(() => {
        const isBelumBayar = initialStatus === "BELUM BAYAR" || initialStatus === "UNPAID";
        if (!isBelumBayar) return;

        if (localStorage.getItem(timeoutKey)) {
            setIsVerifying(true);
            setIsTimeout(true);
            return;
        }

        const storedStart = localStorage.getItem(storageKey);
        if (storedStart) {
            const startTime = parseInt(storedStart, 10);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const finalTimeoutMins = propTimeoutMins || CONFIG.PAYMENT_VERIFICATION_TIMEOUT_MINS;
            const remaining = (finalTimeoutMins * 60) - elapsed;

            if (remaining > 0) {
                setTimeLeft(remaining);
                setIsVerifying(true);
                setIsTimeout(false);
            } else {
                handleTimeout();
            }
        }
    }, [initialStatus, storageKey, timeoutKey, handleTimeout]);

    // Timer Effect
    useEffect(() => {
        if (!isVerifying || timeLeft === null || isTimeout || isSuccess) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev !== null && prev > 1) return prev - 1;

                // When reaches 1 -> 0, trigger timeout handler (which includes final check)
                handleTimeout();
                return 0;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isVerifying, timeLeft, isTimeout, isSuccess, handleTimeout]);

    // Polling Effect - Removed periodic 30s polling per user request
    // Status is only checked manually at start and automatically at timeout (end of countdown)
    useEffect(() => {
        // Transitional Success: Once payment is detected, we poll briefly (every 5s)
        // until the statusOrder changes from OPEN to PROSES PACKING, so the user
        // can see the final "Processed" stage before redirection.
        const isTransitionalSuccess = isSuccess && statusOrder === "OPEN";

        if (!isTransitionalSuccess) {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            return;
        }

        if (!pollingIntervalRef.current) {
            pollingIntervalRef.current = setInterval(checkStatus, 5000);
        }

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [isSuccess, checkStatus, statusOrder]);

    return {
        timeLeft,
        isVerifying,
        isTimeout,
        isSuccess,
        startVerification,
        statusOrder,
        statusTagihan
    };
}
