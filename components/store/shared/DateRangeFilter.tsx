"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface DatePreset {
    id: string;
    label: string;
    getRange: () => DateRange;
}

interface DateRangeFilterProps {
    dateRange: DateRange | undefined;
    onSelect: (range: DateRange | undefined) => void;
    presets: DatePreset[];
    placeholder?: string;
    className?: string;
}

const DateRangeFilter = ({ dateRange, onSelect, presets, placeholder = "Pilih Tanggal", className }: DateRangeFilterProps) => {
    const [open, setOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const handlePresetSelect = (preset: DatePreset) => {
        onSelect(preset.getRange());
        setOpen(false);
    };

    const handleDateSelect = (range: DateRange | undefined) => {
        onSelect(range);
        if (range?.from && range?.to) {
            setOpen(false);
        }
    };

    const isAnyPresetMatched = presets.some(p => {
        const r = p.getRange();
        return r.from?.toDateString() === dateRange?.from?.toDateString() &&
            r.to?.toDateString() === dateRange?.to?.toDateString();
    });

    const trigger = (
        <Button
            variant="outline"
            className={cn(
                "h-12 px-5 rounded-2xl border-neutral-base-100 text-[12px] font-bold gap-3 bg-neutral-base-50/30 md:bg-white shadow-none w-full sm:min-w-[240px] sm:w-auto justify-start text-left focus:ring-4 focus:ring-neutral-base-900/5 transition-all outline-none hover:bg-neutral-base-50",
                !dateRange && "text-neutral-base-400"
            )}
        >
            <CalendarIcon className="w-4 h-4 text-neutral-base-300 mr-1" />
            <span className="truncate flex-1">
                {dateRange?.from ? (
                    dateRange.to ? (
                        <>
                            {format(dateRange.from, "dd MMM yyyy", { locale: id })} -{" "}
                            {format(dateRange.to, "dd MMM yyyy", { locale: id })}
                        </>
                    ) : (
                        format(dateRange.from, "dd MMM yyyy", { locale: id })
                    )
                ) : (
                    <span>{placeholder}</span>
                )}
            </span>
            <ChevronRight className={cn("w-4 h-4 text-neutral-base-300 transition-transform", open && "rotate-90")} />
        </Button>
    );

    const PresetsList = ({ isMobile = false }: { isMobile?: boolean }) => (
        <div className={cn(
            "flex flex-col",
            isMobile ? "px-6 py-4 bg-neutral-base-50/50" : "p-4 min-w-[200px] border-r border-neutral-base-50 bg-neutral-base-50/50"
        )}>
            <div className="flex items-center justify-between mb-3 px-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-base-300">Pilih Cepat</p>
                {!isMobile && dateRange && (
                    <button
                        onClick={() => {
                            const defaultPreset = presets.find(p => p.id === "3months");
                            onSelect(defaultPreset ? defaultPreset.getRange() : undefined);
                            setOpen(false);
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors"
                    >
                        Reset
                    </button>
                )}
            </div>
            <div className={cn(
                "gap-2",
                isMobile ? "flex overflow-x-auto pb-2 no-scrollbar scroll-smooth" : "flex flex-col flex-1"
            )}>
                {presets.map((preset) => {
                    const r = preset.getRange();
                    const isActive = r.from?.toDateString() === dateRange?.from?.toDateString() &&
                        r.to?.toDateString() === dateRange?.to?.toDateString();
                    return (
                        <button
                            key={preset.id}
                            onClick={() => handlePresetSelect(preset)}
                            className={cn(
                                "text-left px-4 py-2.5 rounded-2xl text-[12px] font-bold transition-all whitespace-nowrap border",
                                isActive
                                    ? "bg-neutral-base-900 border-neutral-base-900 text-white shadow-lg shadow-neutral-base-900/20"
                                    : isMobile
                                        ? "bg-white border-neutral-base-100 text-neutral-base-500 hover:border-neutral-base-900/20"
                                        : "bg-transparent border-transparent text-neutral-base-500 hover:bg-white hover:text-neutral-base-900 hover:pl-5"
                            )}
                        >
                            {preset.label}
                        </button>
                    );
                })}

                <div className={cn(
                    "text-left px-4 py-2.5 rounded-2xl text-[12px] font-bold transition-all whitespace-nowrap border shrink-0",
                    !isAnyPresetMatched && dateRange?.from
                        ? "bg-neutral-base-100/50 border-neutral-base-200 text-neutral-base-900"
                        : "bg-white/50 border-dashed border-neutral-base-200 text-neutral-base-300 pointer-events-none"
                )}>
                    {isMobile ? "Kustom" : "Pilih Kustom"}
                </div>
            </div>
        </div>
    );

    if (isDesktop) {
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    {trigger}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-neutral-base-100 shadow-2xl flex flex-row" align="end">
                    <PresetsList />
                    <div className="flex flex-col bg-white">
                        <div className="p-3">
                            <CalendarComponent
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={handleDateSelect}
                                numberOfMonths={1}
                                disabled={(date) => date > new Date()}
                                className="p-2"
                                captionLayout="dropdown"
                                startMonth={new Date(2020, 0)}
                                endMonth={new Date()}
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {trigger}
            </DrawerTrigger>
            <DrawerContent className="p-0 rounded-t-[40px] overflow-hidden border-none shadow-2xl">
                <div className="max-h-[92vh] overflow-y-auto no-scrollbar bg-white">
                    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-neutral-base-50 px-6 py-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <DrawerTitle className="text-[18px] font-bold text-neutral-base-900 tracking-tight">Pilih Tanggal</DrawerTitle>
                            <p className="text-[11px] font-bold text-neutral-base-400">
                                {dateRange?.from ? (
                                    <span className="text-neutral-base-900">
                                        {format(dateRange.from, "dd MMM yyyy", { locale: id })}
                                        {dateRange.to && ` — ${format(dateRange.to, "dd MMM yyyy", { locale: id })}`}
                                    </span>
                                ) : (
                                    "Silakan pilih rentang waktu"
                                )}
                            </p>
                        </div>
                        {dateRange && (
                            <button
                                onClick={() => {
                                    const defaultPreset = presets.find(p => p.id === "3months");
                                    onSelect(defaultPreset ? defaultPreset.getRange() : undefined);
                                    setOpen(false);
                                }}
                                className="h-10 px-4 rounded-xl bg-rose-50 text-rose-500 text-[11px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    <PresetsList isMobile />

                    <div className="p-4 flex justify-center">
                        <div className="bg-neutral-base-50/30 p-4 rounded-[32px] border border-neutral-base-100/50 shadow-sm w-full flex justify-center">
                            <CalendarComponent
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from || new Date()}
                                selected={dateRange}
                                onSelect={handleDateSelect}
                                numberOfMonths={1}
                                disabled={(date) => date > new Date()}
                                className="p-0 scale-105"
                                captionLayout="dropdown"
                                startMonth={new Date(2020, 0)}
                                endMonth={new Date()}
                            />
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default DateRangeFilter;
