"use client";

import React from "react";
import { formatDate } from "@/lib/date-utils";

interface FormattedDateProps {
    date: Date | string | number | null | undefined;
    options?: Intl.DateTimeFormatOptions;
    className?: string;
    fallback?: string;
    showWib?: boolean;
}

/**
 * A shared component to display dates consistently using the global Jakarta timezone.
 * Eliminates the need to manually specify timeZone: "Asia/Jakarta" in every component.
 * 
 * @example
 * <FormattedDate date={order.createdAt} options={{ day: 'numeric', month: 'long' }} />
 */
export const FormattedDate = ({
    date,
    options = {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    },
    className,
    fallback = "-",
    showWib = false
}: FormattedDateProps) => {
    if (!date) return <span className={className}>{fallback}</span>;

    try {
        let formatted = formatDate(date, options).replace(',', ' •');
        if (showWib) formatted += " WIB";
        return <span className={className}>{formatted}</span>;
    } catch (error) {
        console.error("FormattedDate error:", error);
        return <span className={className}>{fallback}</span>;
    }
};

export default FormattedDate;
