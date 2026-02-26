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
        wallet: ["user", "wallet"] as const,
        addresses: ["user", "addresses"] as const,
    },
    payments: {
        methods: ["payment-methods"] as const,
    },
    shipping: {
        couriers: ["couriers"] as const,
    }
};
