"use client";

import { CartItem as CartItemType } from "@/lib/api/cart-api";
import OrderList from "@/components/store/shared/OrderList";

interface CartListProps {
    items: CartItemType[];
    selectedIds: number[];
    onToggleSelect: (id: number) => void;
    onUpdateQuantity: (id: number, qty: number, stock: number) => void;
    onUpdateNotes: (id: number, notes: string) => void;
    onRemove: (id: number) => void;
}

export default function CartList({
    items,
    selectedIds,
    onToggleSelect,
    onUpdateQuantity,
    onUpdateNotes,
    onRemove,
}: CartListProps) {
    return (
        <OrderList
            items={items}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onUpdateQuantity={onUpdateQuantity}
            onUpdateNotes={onUpdateNotes}
            onRemove={onRemove}
            variant="cart"
        />
    );
}
