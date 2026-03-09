"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import Breadcrumb from "@/components/store/shared/Breadcrumb";
import { cn } from "@/lib/utils";

export type SortOption = "newest" | "price_asc" | "price_desc" | "name_asc";

interface ProductListHeaderProps {
    sortBy: SortOption;
    onSortChange: (value: SortOption) => void;
}

export default function ProductListHeader() {
    return (
        <div className="flex items-center justify-between py-6 font-montserrat">
            {/* Breadcrumbs */}
            <Breadcrumb
                items={[
                    { label: "Beranda", href: "/" },
                    { label: "Produk" }
                ]}
            />
        </div>
    );
}
