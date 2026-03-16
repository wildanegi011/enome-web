/**
 * useFlashSaleTimer Hook
 *
 * Mengelola countdown timer untuk flash sale.
 * - Auto-start interval saat flash sale aktif
 * - Auto-cleanup interval saat unmount
 * - Handle parsing timezone (WIB / UTC)
 *
 * @example
 * const { timeLeft, formatTime } = useFlashSaleTimer(true, "2025-12-31T23:59:59+07:00");
 * // timeLeft = { days: 5, hours: 12, minutes: 30, seconds: 15 }
 * // formatTime(5) = "05"
 */

import { useState, useEffect, useCallback } from "react";
import { parseJakarta } from "@/lib/date-utils";

/** Struktur waktu sisa untuk countdown */
export interface FlashSaleTimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export function useFlashSaleTimer(
    isOnFlashSale?: boolean,
    flashSaleEndTime?: string
) {
    const [timeLeft, setTimeLeft] = useState<FlashSaleTimeLeft | null>(null);

    useEffect(() => {
        if (!isOnFlashSale || !flashSaleEndTime) return;

        const endTime = parseJakarta(flashSaleEndTime).getTime();

        /** Kalkulasi selisih waktu dari sekarang ke endTime */
        const calculateTimeLeft = (): FlashSaleTimeLeft => {
            const now = new Date().getTime();
            const difference = endTime - now;

            if (difference <= 0)
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor(
                    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                ),
                minutes: Math.floor(
                    (difference % (1000 * 60 * 60)) / (1000 * 60)
                ),
                seconds: Math.floor((difference % (1000 * 60)) / 1000),
            };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(
            () => setTimeLeft(calculateTimeLeft()),
            1000
        );
        return () => clearInterval(timer);
    }, [isOnFlashSale, flashSaleEndTime]);

    /** Format angka jadi 2 digit (misal: 5 → "05") */
    const formatTime = useCallback(
        (time: number) => time.toString().padStart(2, "0"),
        []
    );

    return { timeLeft, formatTime };
}
