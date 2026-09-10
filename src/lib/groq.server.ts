// Groq API integration for SWAP UAE
// Model: openai/gpt-oss-120b (fast, accurate UAE secondhand goods valuation)

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function getGroqKey(): string | undefined {
  return process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
}

// In-memory cache for AED valuations to prevent redundant calls
const aedValueCache = new Map<string, number>();

// Known UAE secondhand baselines to ensure fast and rock-solid valuations
const LOCAL_AED_BASELINES: Array<{ match: RegExp; minAed: number; maxAed: number }> = [
  // Gaming Handhelds & Consoles
  { match: /\b(3ds\s*xl|new\s*3ds|3ds|2ds\s*xl|2ds)\b/i, minAed: 600, maxAed: 850 },
  { match: /\b(nintendo\s*switch\s*oled|switch\s*oled)\b/i, minAed: 800, maxAed: 1100 },
  { match: /\b(nintendo\s*switch|switch\s*lite)\b/i, minAed: 450, maxAed: 750 },
  { match: /\b(ps5|playstation\s*5)\b/i, minAed: 1400, maxAed: 1800 },
  { match: /\b(ps4\s*pro|ps4|playstation\s*4)\b/i, minAed: 450, maxAed: 750 },
  { match: /\b(xbox\s*series\s*x)\b/i, minAed: 1300, maxAed: 1700 },
  { match: /\b(xbox\s*series\s*s)\b/i, minAed: 650, maxAed: 850 },
  { match: /\b(steam\s*deck|rog\s*ally)\b/i, minAed: 1200, maxAed: 1800 },
  { match: /\b(ps\s*vita|psp)\b/i, minAed: 350, maxAed: 600 },
  // Phones & Flagships
  { match: /\b(iphone\s*1[456]\s*pro\s*max)\b/i, minAed: 2600, maxAed: 3800 },
  { match: /\b(iphone\s*1[3456]|iphone\s*1[345]\s*pro)\b/i, minAed: 1500, maxAed: 2700 },
  { match: /\b(iphone\s*1[12]|iphone\s*se)\b/i, minAed: 750, maxAed: 1400 },
  { match: /\b(macbook\s*(pro|air))\b/i, minAed: 1800, maxAed: 4500 },
  { match: /\b(ipad\s*(pro|air)?)\b/i, minAed: 900, maxAed: 2500 },
  // Audio & Tech
  { match: /\b(airpods\s*pro|airpods\s*max)\b/i, minAed: 450, maxAed: 1200 },
  { match: /\b(airpods|galaxy\s*buds)\b/i, minAed: 200, maxAed: 450 },
  { match: /\b(earbuds|earphones|headphones)\b/i, minAed: 50, maxAed: 200 },
  // Low-cost accessories
  { match: /\b(led\s*(bulb|light|remote|strip)?|remote\s*control|bulb)\b/i, minAed: 15, maxAed: 35 },
  { match: /\b(phone\s*case|cover|screen\s*protector|cable|charger|adapter|stand)\b/i, minAed: 15, maxAed: 40 },
  { match: /\b(t-?shirt|mug|keychain|sticker|cap|hat)\b/i, minAed: 15, maxAed: 50 },
];

export function getLocalHeuristicAed(name: string, condition: string = "Good"): number {
  const n = (name || "").toLowerCase();
  for (const b of LOCAL_AED_BASELINES) {
    if (b.match.test(n)) {
      const mid = Math.round((b.minAed + b.maxAed) / 2);
      const condFactor =
        condition === "Brand New" || condition === "New" ? 1.15 : condition === "Fair" ? 0.75 : 1.0;
      return Math.round(mid * condFactor);
    }
  }
  // Generic fallback based on category or default
  return 120;
}

export interface TradeFairnessResponse {
  target_aed: number;
  offered_total_aed: number;
  score: number; // 0 to 100
  verdict: "Balanced Swap" | "Slight Advantage to You" | "Favorable to Partner" | "Highly Unbalanced";
  summary: string;
  advice: string;
}

/**
 * Call Groq chat completion with JSON mode
 */
export async function callGroqChat(messages: any[], model = "openai/gpt-oss-120b"): Promise<string | null> {
  const apiKey = getGroqKey();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[Groq] API responded with status ${res.status}: ${await res.text().catch(() => "")}`);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.warn("[Groq] Call failed or timed out:", e);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Evaluate trade fairness in AED using Groq
 */
export async function evaluateTradeFairnessWithGroq(params: {
  targetListing: {
    title: string;
    category: string;
    condition: string;
    description?: string;
  };
  offeredItems: Array<{
    name: string;
    category: string;
    condition: string;
    description?: string;
  }>;
}): Promise<TradeFairnessResponse> {
  const targetLocalAed = getLocalHeuristicAed(params.targetListing.title, params.targetListing.condition);
  const offeredLocalAed = params.offeredItems.reduce(
    (acc, it) => acc + getLocalHeuristicAed(it.name, it.condition),
    0
  );

  const apiKey = getGroqKey();

  if (apiKey) {
    const prompt = `You are an expert appraiser for SWAP UAE (UAE item barter platform).
Assess fair secondhand market value in UAE Dirhams (AED) for:
TARGET ITEM: "${params.targetListing.title}" (Category: ${params.targetListing.category}, Condition: ${params.targetListing.condition})
OFFERED BUNDLE (${params.offeredItems.length} items):
${params.offeredItems.map((i, idx) => `${idx + 1}. "${i.name}" (Category: ${i.category}, Condition: ${i.condition})`).join("\n")}

Note realistic UAE secondhand pricing (e.g. Dubizzle UAE):
- Handheld consoles (e.g. Nintendo 3DS, 3DS XL, Switch): typically 550 - 900 AED in UAE.
- Consoles (PS5/Xbox Series X): 1300 - 1800 AED.
- Basic lights, LED remotes, cables, phone covers: 15 - 35 AED.
- Earbuds (generic): 35 - 80 AED.

Return JSON:
{
  "target_aed": number,
  "offered_total_aed": number,
  "score": number, // parity 0 to 100
  "verdict": "Balanced Swap" | "Slight Advantage to You" | "Favorable to Partner" | "Highly Unbalanced",
  "summary": "1-2 sentence explanation stating the estimated AED values of both sides and whether it is fair",
  "advice": "1 actionable sentence advising user on next step"
}`;

    const content = await callGroqChat([
      {
        role: "system",
        content: "You are a professional secondhand goods appraiser for SWAP UAE. Provide realistic AED valuations and strict trade fairness analysis.",
      },
      { role: "user", content: prompt },
    ]);

    if (content) {
      try {
        const parsed = JSON.parse(content);
        const targetAed = Number(parsed.target_aed) || targetLocalAed;
        const offeredAed = Number(parsed.offered_total_aed) || offeredLocalAed;

        // Calculate rigorous parity ratio
        const minVal = Math.min(targetAed, offeredAed);
        const maxVal = Math.max(1, Math.max(targetAed, offeredAed));
        const ratio = minVal / maxVal; // 0 to 1.0

        let score = Math.round(ratio * 100);
        let verdict = parsed.verdict || "Balanced Swap";

        if (ratio < 0.4) {
          verdict = "Highly Unbalanced";
          score = Math.max(5, Math.min(35, score));
        } else if (ratio < 0.7) {
          verdict = targetAed > offeredAed ? "Favorable to Partner" : "Slight Advantage to You";
          score = Math.max(40, Math.min(69, score));
        } else if (ratio < 0.85) {
          verdict = targetAed > offeredAed ? "Favorable to Partner" : "Slight Advantage to You";
          score = Math.max(70, Math.min(84, score));
        } else {
          verdict = "Balanced Swap";
          score = Math.max(85, Math.min(99, score));
        }

        return {
          target_aed: targetAed,
          offered_total_aed: offeredAed,
          score,
          verdict,
          summary: parsed.summary || `Target item is valued ~${targetAed} AED, offered bundle is ~${offeredAed} AED.`,
          advice: parsed.advice || (score < 50 ? "Consider balancing the value difference with additional items." : "Good trade match!"),
        };
      } catch (e) {
        console.warn("[Groq] Failed to parse trade fairness response:", e);
      }
    }
  }

  // Robust Local Fallback using heuristic AED
  const minVal = Math.min(targetLocalAed, offeredLocalAed);
  const maxVal = Math.max(1, Math.max(targetLocalAed, offeredLocalAed));
  const ratio = minVal / maxVal;
  const score = Math.round(ratio * 100);

  let verdict: TradeFairnessResponse["verdict"] = "Balanced Swap";
  let summary = "";
  let advice = "";

  if (ratio < 0.4) {
    verdict = "Highly Unbalanced";
    summary = `Large value gap: target is ~${targetLocalAed} AED, while offered items are ~${offeredLocalAed} AED.`;
    advice = "Do not accept as is. Add more items to balance the trade.";
  } else if (ratio < 0.75) {
    verdict = targetLocalAed > offeredLocalAed ? "Favorable to Partner" : "Slight Advantage to You";
    summary = `Target is valued around ~${targetLocalAed} AED vs ~${offeredLocalAed} AED offered.`;
    advice = targetLocalAed > offeredLocalAed ? "Consider adding an accessory to bridge the difference." : "Favorable swap for you.";
  } else {
    verdict = "Balanced Swap";
    summary = `Equitable trade. Target (~${targetLocalAed} AED) and offered bundle (~${offeredLocalAed} AED) are in a similar value tier.`;
    advice = "Great trade match! Proceed with meetup coordination.";
  }

  return {
    target_aed: targetLocalAed,
    offered_total_aed: offeredLocalAed,
    score: Math.max(5, Math.min(99, score)),
    verdict,
    summary,
    advice,
  };
}

/**
 * Batch estimate item AED values for smart matching
 */
export async function batchEstimateAedValues(
  items: Array<{ id: string; name: string; category?: string; condition?: string }>
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const toFetch: Array<{ id: string; name: string; category?: string; condition?: string }> = [];

  for (const it of items) {
    const cacheKey = `${it.name.toLowerCase().trim()}::${it.condition || "good"}`;
    if (aedValueCache.has(cacheKey)) {
      result.set(it.id, aedValueCache.get(cacheKey)!);
    } else {
      toFetch.push(it);
    }
  }

  if (toFetch.length === 0) return result;

  // Check if we have Groq API key
  const apiKey = getGroqKey();
  if (apiKey && toFetch.length > 0) {
    const prompt = `Estimate the realistic secondhand market value in UAE Dirhams (AED) for each item:
${toFetch.map((it) => `- id: "${it.id}", name: "${it.name}", condition: "${it.condition || "Good"}", category: "${it.category || "General"}"`).join("\n")}

Return JSON:
{
  "valuations": [
    { "id": "string", "aed": number }
  ]
}`;

    const content = await callGroqChat([
      {
        role: "system",
        content:
          "You are an expert appraiser for SWAP UAE. Estimate realistic secondhand market values in UAE Dirhams (AED) for secondhand items (e.g. Nintendo 3DS ~700-800 AED, LED bulbs ~20 AED).",
      },
      { role: "user", content: prompt },
    ]);

    if (content) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.valuations)) {
          for (const v of parsed.valuations) {
            if (v && v.id && typeof v.aed === "number") {
              const it = toFetch.find((i) => i.id === v.id);
              if (it) {
                const cacheKey = `${it.name.toLowerCase().trim()}::${it.condition || "good"}`;
                aedValueCache.set(cacheKey, v.aed);
                result.set(v.id, v.aed);
              }
            }
          }
        }
      } catch (e) {
        console.warn("[Groq] Batch valuation parsing failed:", e);
      }
    }
  }

  // For any remaining items, fill with local heuristic
  for (const it of toFetch) {
    if (!result.has(it.id)) {
      const val = getLocalHeuristicAed(it.name, it.condition);
      const cacheKey = `${it.name.toLowerCase().trim()}::${it.condition || "good"}`;
      aedValueCache.set(cacheKey, val);
      result.set(it.id, val);
    }
  }

  return result;
}
