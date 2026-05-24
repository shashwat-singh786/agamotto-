import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
];


function getApiKey(): string {

  const key = (
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ""
  ).trim();
  return key;
}

const PROMPT = `You are a video analysis AI. Analyze this image frame carefully.

1. First, describe what is happening in the frame generally.
2. Then, determine if any of these situations are present:
   - Medical Emergencies (unconscious, seizures, choking)
   - Falls and Injuries
   - Distress Signals
   - Violence or Threats
   - Suspicious Activities

Respond ONLY with a valid JSON object in the following format. Do not use markdown blocks:
{
  "events": [
    {
      "description": "Detailed description of the action, people, and context visible in the frame",
      "isDangerous": false
    }
  ]
}

You MUST include exactly one event that summarizes the entire frame.
Set 'isDangerous' to true ONLY if you see a genuinely dangerous or suspicious situation.`;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiWithRetry(
  apiKey: string,
  base64Data: string,
  mimeType: string,
  maxRetries: number = 3
): Promise<{ text: string; model: string; error?: string }> {
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            { text: PROMPT },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 512,
      },
    };

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[analyze-frame] Model ${model}, attempt ${attempt + 1}/${maxRetries}`);

        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (resp.status === 429) {
          // Rate limited — parse retry delay if available, otherwise exponential backoff
          const errBody = await resp.text();
          console.warn(`[analyze-frame] Rate limited (429). Attempt ${attempt + 1}.`);

          // Try to extract retry delay from the response
          const retryMatch = errBody.match(/"retryDelay"\s*:\s*"(\d+)s"/);
          const waitSec = retryMatch ? parseInt(retryMatch[1]) : Math.min(5 * (attempt + 1), 30);

          console.log(`[analyze-frame] Waiting ${waitSec}s before retry...`);
          await sleep(waitSec * 1000);
          continue; // Retry same model
        }

        if (!resp.ok) {
          const errBody = await resp.text();
          console.error(`[analyze-frame] Model ${model} failed (${resp.status}):`, errBody.slice(0, 300));

          // Auth errors — stop immediately
          if (resp.status === 401 || resp.status === 403) {
            return {
              text: "",
              model,
              error: `API key invalid or unauthorized (${resp.status}). Check your GOOGLE_API_KEY.`,
            };
          }
          // 404 — try next model
          if (resp.status === 404) break;
          // Other errors — retry
          continue;
        }

        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!text) {
          console.warn("[analyze-frame] Empty response from API, retrying...");
          continue;
        }
        return { text, model };
      } catch (err) {
        console.error(`[analyze-frame] Fetch error (attempt ${attempt + 1}):`, err);
        await sleep(2000);
        continue;
      }
    }
  }

  return { text: "", model: "none", error: "All models/retries exhausted. You may have hit the free-tier rate limit. Wait a minute and try again." };
}

function extractJSON(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) return codeBlock[1].trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0].trim();
  return text.trim();
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GOOGLE_API_KEY is not set in .env.local. Get one from https://aistudio.google.com/apikey",
          events: [],
        },
        { status: 500 }
      );
    }

    const { imageData, timeLabel } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: "No image data provided", events: [] },
        { status: 400 }
      );
    }

    // Handle both raw base64 and data URLs
    let base64 = imageData;
    let mimeType = "image/jpeg";
    if (imageData.startsWith("data:")) {
      const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64 = match[2];
      } else {
        base64 = imageData.split(",")[1] || imageData;
      }
    }

    const result = await callGeminiWithRetry(apiKey, base64, mimeType);

    if (result.error) {
      return NextResponse.json(
        { error: result.error, events: [], rawResponse: "" },
        { status: 500 }
      );
    }

    const jsonStr = extractJSON(result.text);
    let events = [];
    try {
      const parsed = JSON.parse(jsonStr);
      events = (parsed.events || []).map(
        (ev: { description: string; isDangerous: boolean }) => ({
          timestamp: timeLabel || "00:00",
          description: ev.description,
          isDangerous: ev.isDangerous,
        })
      );
    } catch {
      events = [
        {
          timestamp: timeLabel || "00:00",
          description: "Frame analyzed — could not parse structured response",
          isDangerous: false,
        },
      ];
    }

    return NextResponse.json({
      events,
      rawResponse: result.text,
      model: result.model,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[analyze-frame] Unexpected error:", msg);
    return NextResponse.json({ error: msg, events: [] }, { status: 500 });
  }
}
