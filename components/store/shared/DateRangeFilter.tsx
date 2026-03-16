"use client";

import React from "react";
import { formatDate } from "@/lib/date-utils";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

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
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "h-12 px-5 rounded-2xl border-neutral-base-100 text-[12px] font-bold gap-3 bg-neutral-base-50/30 md:bg-white shadow-none w-full sm:min-w-[200px] sm:w-auto justify-start text-left focus:ring-4 focus:ring-neutral-base-900/5 transition-all outline-none",
                        !dateRange?.from && "text-neutral-base-400",
                        className
                    )}
                >
                    <CalendarIcon className="w-4 h-4 text-neutral-base-300" />
                    <span>
                        {(() => {
                            if (!dateRange?.from) return placeholder;
                            const preset = presets.find(p => {
                                const r = p.getRange();
                                return r.from?.toDateString() === dateRange?.from?.toDateString() &&
                                    r.to?.toDateString() === dateRange?.to?.toDateString();
                            });
                            if (preset) return preset.label;
                            return dateRange.to
                                ? `${formatDate(dateRange.from, { day: "2-digit", month: "short" })} - ${formatDate(dateRange.to, { day: "2-digit", month: "short", year: "numeric" })}`
                                : formatDate(dateRange.from, { day: "2-digit", month: "short", year: "numeric" });
                        })()}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-neutral-base-100 shadow-2xl flex flex-col md:flex-row" align="end">
                <div className="p-4 border-b md:border-b-0 md:border-r border-neutral-base-50 bg-neutral-base-50/50 min-w-[180px] space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-base-300 mb-3 px-2">Pilihan Cepat</p>
                    {presets.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => onSelect(preset.getRange())}
                            className={cn(
                                "w-full text-left px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all",
                                presets.find(p => {
                                    const r = p.getRange();
                                    return r.from?.toDateString() === dateRange?.from?.toDateString() &&
                                        r.to?.toDateString() === dateRange?.to?.toDateString();
                                })?.id === preset.id
                                    ? "bg-neutral-base-900 text-white"
                                    : "text-neutral-base-500 hover:bg-white hover:text-neutral-base-900"
                            )}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
                <div className="p-2">
                    <CalendarComponent
                        mode="range"
                        selected={dateRange}
                        onSelect={onSelect}
                        numberOfMonths={1}
                        disabled={(date) => date > new Date()}
                        className="p-3"
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default DateRangeFilter;
