export const queryKeys = {
    products: {
        all: ["products"] as const,
        detail: (id: string) => ["product", id] as const,
        newArrivals: ["products", "new-arrivals"] as const,
        highlights: ["products", "highlights"] as const,
    },
    categories: {
        all: ["categories"] as const,
    },
    colors: {
        all: ["colors"] as const,
    },
    sizes: {
        all: ["sizes"] as const,
    },
    cart: {
        all: ["cart"] as const,
        count: ["cart", "count"] as const,
        item: (id: number) => ["cart", id] as const,
    },
    user: {
        wallet: {
            balance: ["user", "wallet", "balance"] as const,
            history: ["user", "wallet", "history"] as const,
        },
        addresses: ["user", "addresses"] as const,
        orders: ["user", "orders"] as const,
        orderDetail: (id: string) => ["user", "order-detail", id] as const,
        profile: ["user", "profile"] as const,
        wishlist: {
            all: ["user", "wishlist"] as const,
            details: ["user", "wishlist", "details"] as const,
        },
    },
    payments: {
        methods: ["payment-methods"] as const,
    },
    shipping: {
        couriers: ["couriers"] as const,
    }
};
