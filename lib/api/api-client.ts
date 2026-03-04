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
            errorMessage = errorData.message || errorData.pesan || errorMessage;
        } catch (e) {
            // Fallback if not JSON
        }
        throw new Error(errorMessage);
    }

    // Handle empty response or 204 No Content
    if (res.status === 204 || res.headers.get("content-length") === "0") {
        return {} as T;
    }

    try {
        const text = await res.text();
        return text ? JSON.parse(text) : ({} as T);
    } catch (e) {
        return {} as T;
    }
}
