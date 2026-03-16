"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { WalletTransaction } from "@/lib/api/user-api";
import FormattedDate from "@/components/store/shared/FormattedDate";

interface WalletTransactionItemProps {
    tx: WalletTransaction;
}

const WalletTransactionItem = ({ tx }: WalletTransactionItemProps) => {
    const isCredit = tx.kredit > 0;
    const amount = isCredit ? tx.kredit : tx.debit;
    const Icon = isCredit ? ArrowUpRight : ArrowDownLeft;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-between p-4 md:p-6 hover:bg-neutral-base-50/50 transition-colors group"
        >
            <div className="flex items-center gap-3 md:gap-5 min-w-0">
                <div className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 md:group-hover:scale-110 shrink-0",
                    isCredit ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                )}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="space-y-0.5 md:space-y-1 overflow-hidden">
                    <p className="text-[14px] md:text-[15px] font-bold text-neutral-base-900 truncate pr-2">{tx.keterangan}</p>
                    <div className="flex items-center gap-1.5 text-neutral-base-400">
                        <Clock className="w-3 md:w-3.5 h-3 md:h-3.5" />
                        <p className="text-[11px] md:text-[12px] font-medium">
                            {tx.createdAt ? (
                                <FormattedDate
                                    date={tx.createdAt}
                                    options={{
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }}
                                />
                            ) : "-"}
                        </p>
                    </div>
                </div>
            </div>
            <div className="text-right shrink-0">
                <p className={cn(
                    "text-[14px] md:text-[16px] font-black  tracking-tight",
                    isCredit ? "text-red-600" : "text-emerald-600"
                )}>
                    {isCredit ? "-" : "+"}{formatCurrency(amount).replace("Rp", "").trim()}
                </p>
                <p className="text-[10px] md:text-[11px] text-neutral-base-300 font-bold uppercase tracking-wider">
                    Saldo: {formatCurrency(tx.saldo).replace("Rp", "").trim()}
                </p>
            </div>
        </motion.div>
    );
};

export default WalletTransactionItem;
