/**
 * A resilient fetch wrapper tailored for Render Free Tier apps.
 * Features:
 * 1. 60-second fetch timeout (prevent browser hung indefinitely, give Render time to spin up).
 * 2. Automatic retries (default 3 times) with exponential backoff.
 */
export async function resilientFetch(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
    const timeoutSeconds = 60;

    for (let i = 0; i < retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

        try {
            const finalOptions: RequestInit = {
                ...options,
                signal: controller.signal
            };

            const response = await fetch(url, finalOptions);
            clearTimeout(timeoutId);

            if (response.ok) {
                return response;
            } else if (response.status >= 500 && i < retries - 1) {
                // Server error, possibly still booting up fully, wait and retry
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000 + 1000));
            } else {
                return response; // Return 4xx directly
            }
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (i === retries - 1) {
                throw error; // Throw on final attempt
            }
            // Wait before next attempt (2s, 4s, 8s)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000 + 1000));
        }
    }

    throw new Error("Max retries reached");
}
