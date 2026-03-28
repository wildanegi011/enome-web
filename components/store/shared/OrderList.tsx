"use client";

import { AnimatePresence, m } from "framer-motion";
import OrderItem, { OrderItemType } from "./OrderItem";

interface OrderListProps {
    items: OrderItemType[];
    variant?: "cart" | "checkout";
    selectedIds?: number[];
    onToggleSelect?: (id: number) => void;
    onUpdateQuantity: (id: number, qty: number, stock: number) => void;
    onUpdateNotes?: (id: number, notes: string) => void;
    onRemove: (id: number) => void;
    className?: string;
}

export default function OrderList({
    items,
    variant = "cart",
    selectedIds = [],
    onToggleSelect,
    onUpdateQuantity,
    onUpdateNotes,
    onRemove,
    className
}: OrderListProps) {
    return (
        <div className={className || "flex-1 w-full flex flex-col gap-2 md:gap-3 min-w-0"}>
            <AnimatePresence mode="popLayout">
                {items.map((item) => (
                    <m.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <OrderItem
                            item={item}
                            variant={variant}
                            isSelected={selectedIds.includes(item.id)}
                            onToggleSelect={onToggleSelect}
                            onUpdateQuantity={onUpdateQuantity}
                            onUpdateNotes={onUpdateNotes}
                            onRemove={onRemove}
                        />
                    </m.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
