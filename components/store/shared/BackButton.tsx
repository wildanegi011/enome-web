"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
    className?: string;
    variant?: "default" | "outline" | "ghost" | "secondary";
    label?: string;
}

export default function BackButton({
    className,
    variant = "ghost",
    label = "Kembali"
}: BackButtonProps) {
    const router = useRouter();

    return (
        <Button
            onClick={() => router.back()}
            variant={variant}
            className={cn(
                "group flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-300",
                className
            )}
        >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-[12px] font-bold tracking-widest uppercase">{label}</span>
        </Button>
    );
}
