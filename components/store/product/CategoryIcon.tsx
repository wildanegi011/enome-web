"use client";

import React from "react";
import * as FaIcons from "react-icons/fa";
import * as GiIcons from "react-icons/gi";
import * as MdIcons from "react-icons/md";
import * as PiIcons from "react-icons/pi";
import * as LiaIcons from "react-icons/lia";
import * as LuIcons from "react-icons/lu";
import { Box, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryIconProps {
    iconName?: string | null;
    className?: string;
    strokeWidth?: number;
}

/**
 * CategoryIcon Component
 * 
 * Dinamis merender React Icons berdasarkan nama string dari database.
 * Mendukung set: Fa (FontAwesome), Gi (Game Icons), Md (Material Design), Pi (Phosphor), Lia (Icons8).
 * Fallback ke Lucide Box icon jika tidak ditemukan.
 */
export const CategoryIcon = ({ iconName, className, strokeWidth = 2 }: CategoryIconProps) => {
    if (!iconName) {
        return <Box className={cn("w-4 h-4", className)} strokeWidth={strokeWidth} />;
    }

    // Helper to find icon in various sets
    const getIcon = (name: string) => {
        if (name.startsWith("Fa")) return (FaIcons as any)[name];
        if (name.startsWith("Gi")) return (GiIcons as any)[name];
        if (name.startsWith("Md")) return (MdIcons as any)[name];
        if (name.startsWith("Pi")) return (PiIcons as any)[name];
        if (name.startsWith("Lia")) return (LiaIcons as any)[name];
        if (name.startsWith("Lu")) return (LuIcons as any)[name];

        // Fallback search in all sets if prefix doesn't match standard
        return (FaIcons as any)[name] ||
            (MdIcons as any)[name] ||
            (GiIcons as any)[name] ||
            (PiIcons as any)[name] ||
            (LiaIcons as any)[name] ||
            (LuIcons as any)[name];
    };

    const IconComponent = getIcon(iconName);

    if (!IconComponent) {
        // Jika tidak ditemukan di React Icons, cek apakah itu class FontAwesome lama (misal: "fa fa-tshirt")
        if (iconName.includes("fa-")) {
            // Kita bisa mencoba mapping manual atau sekedar fallback
            return <Box className={cn("w-4 h-4", className)} strokeWidth={strokeWidth} />;
        }
        return <Box className={cn("w-4 h-4", className)} strokeWidth={strokeWidth} />;
    }

    return <IconComponent className={cn("w-4 h-4", className)} />;
};
