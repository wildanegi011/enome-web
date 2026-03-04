import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "enome_recent_searches";
const MAX_ITEMS = 6;

export function useRecentSearches() {
    const [searches, setSearches] = useState<string[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setSearches(JSON.parse(stored));
            }
        } catch {
            // ignore parse errors
        }
    }, []);

    const addSearch = useCallback((query: string) => {
        const trimmed = query.trim();
        if (!trimmed || trimmed.length < 2) return;

        setSearches((prev) => {
            const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
            const updated = [trimmed, ...filtered].slice(0, MAX_ITEMS);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const removeSearch = useCallback((query: string) => {
        setSearches((prev) => {
            const updated = prev.filter((s) => s !== query);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const clearAll = useCallback(() => {
        setSearches([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return { searches, addSearch, removeSearch, clearAll };
}
