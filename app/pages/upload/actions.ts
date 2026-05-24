"use server";

export interface VideoEvent {
    isDangerous: boolean;
    timestamp: string;
    description: string;
}

export async function detectEvents(
    base64Image: string,
    timeLabel: string = "00:00"
): Promise<{ events: VideoEvent[]; rawResponse: string; error?: string }> {
    if (!base64Image) {
        return { events: [], rawResponse: "", error: "No image data provided" };
    }

    try {
        // Determine the base URL for internal API calls
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                        "http://localhost:3000";

        const response = await fetch(`${baseUrl}/api/analyze-frame`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageData: base64Image, timeLabel }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[detectEvents] API error:", data.error);
            return {
                events: [],
                rawResponse: data.rawResponse || "",
                error: data.error || `HTTP ${response.status}`,
            };
        }

        return {
            events: data.events || [],
            rawResponse: data.rawResponse || "",
        };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[detectEvents] Fetch error:", msg);
        return { events: [], rawResponse: "", error: msg };
    }
}