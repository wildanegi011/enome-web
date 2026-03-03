export async function apiClient<T>(url: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
        ...((options?.body instanceof FormData) ? {} : { "Content-Type": "application/json" }),
        ...(options?.headers as Record<string, string>),
    };

    const res = await fetch(url, {
        ...options,
        headers,
    });

    if (!res.ok) {
        let errorMessage = "An error occurred while fetching the data.";
        try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // Fallback if not JSON
        }
        throw new Error(errorMessage);
    }

    return res.json();
}
