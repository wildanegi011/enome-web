"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
    Pagination as ShadcnPagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export default function Pagination({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    className,
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("ellipsis-start");

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (i !== 1 && i !== totalPages) pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push("ellipsis-end");
            if (totalPages > 1) pages.push(totalPages);
        }
        return pages;
    };

    return (
        <ShadcnPagination className={className}>
            <PaginationContent className="gap-2">
                <PaginationItem>
                    <PaginationPrevious
                        onClick={(e) => {
                            e.preventDefault();
                            onPageChange(Math.max(1, currentPage - 1));
                        }}
                        className={cn(
                            "h-11 px-4 rounded-xl border-neutral-base-100 cursor-pointer",
                            currentPage === 1 && "opacity-30 pointer-events-none"
                        )}
                    />
                </PaginationItem>

                {getPageNumbers().map((page, i) => (
                    <PaginationItem key={i}>
                        {page === "ellipsis-start" || page === "ellipsis-end" ? (
                            <span className="flex w-11 h-11 items-center justify-center text-neutral-base-400">
                                <PaginationEllipsis />
                            </span>
                        ) : (
                            <PaginationLink
                                isActive={currentPage === page}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onPageChange(page as number);
                                }}
                                className={cn(
                                    "w-11 h-11 rounded-xl transition-all cursor-pointer",
                                    currentPage === page
                                        ? "bg-neutral-base-900 text-white"
                                        : "hover:bg-neutral-base-50"
                                )}
                            >
                                {page}
                            </PaginationLink>
                        )}
                    </PaginationItem>
                ))}

                <PaginationItem>
                    <PaginationNext
                        onClick={(e) => {
                            e.preventDefault();
                            onPageChange(Math.min(totalPages, currentPage + 1));
                        }}
                        className={cn(
                            "h-11 px-4 rounded-xl border-neutral-base-100 cursor-pointer",
                            currentPage === totalPages && "opacity-30 pointer-events-none"
                        )}
                    />
                </PaginationItem>
            </PaginationContent>
        </ShadcnPagination>
    );
}
