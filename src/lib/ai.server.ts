import { GoogleGenAI } from "@google/genai";
import { CATEGORIES, CONDITIONS, type ItemCategory, type ItemCondition } from "./db-types";

const geminiApiKey = process.env.GEMINI_API_KEY;

let aiClient: GoogleGenAI | null = null;

function getAIClient() {
  if (!geminiApiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
  }
  return aiClient;
}

export interface ItemAnalysisResult {
  name: string;
  category: ItemCategory;
  condition: ItemCondition;
  description: string;
  suggested_looking_for?: string;
}

export async function analyzeItemPhotoWithAI(params: {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
}): Promise<ItemAnalysisResult> {
  const client = getAIClient();

  if (!client) {
    return {
      name: "Item",
      category: "Electronics",
      condition: "Good",
      description: "Great quality item in good condition, ready for trade in the UAE.",
      suggested_looking_for: "Open to fair trades or tech items",
    };
  }

  try {
    let base64Data = params.imageBase64 || "";
    let mime = params.mimeType || "image/jpeg";

    if (!base64Data && params.imageUrl) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      try {
        const res = await fetch(params.imageUrl, { signal: controller.signal });
        const buffer = await res.arrayBuffer();
        base64Data = Buffer.from(buffer).toString("base64");
        mime = res.headers.get("content-type") || "image/jpeg";
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (!base64Data) {
      throw new Error("No image data provided for analysis");
    }

    const prompt = `Analyze this item photo for UAE trade marketplace (SWAP).
Categories: ${CATEGORIES.join(", ")}.
Conditions: ${CONDITIONS.join(", ")}.

Output JSON:
{
  "name": "Item brand and model name",
  "category": "Category",
  "condition": "Condition",
  "description": "Short 1-2 sentence description highlighting key features",
  "suggested_looking_for": "1-2 items trader might want in exchange"
}`;

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mime,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 50 },
        maxOutputTokens: 300,
        temperature: 0.1,
      },
    });

    const text = response.text?.trim() || "{}";
    const parsed = JSON.parse(text);

    const validCategory = CATEGORIES.includes(parsed.category) ? parsed.category : "Electronics";
    const validCondition = CONDITIONS.includes(parsed.condition) ? parsed.condition : "Good";

    return {
      name: parsed.name || "Item",
      category: validCategory as ItemCategory,
      condition: validCondition as ItemCondition,
      description: parsed.description || "",
      suggested_looking_for: parsed.suggested_looking_for || "",
    };
  } catch (err) {
    console.error("[AI] Error analyzing item image with Gemini:", err);
    return {
      name: "Item",
      category: "Electronics",
      condition: "Good",
      description: "Great quality item ready for trade in the UAE.",
      suggested_looking_for: "Open to fair trades",
    };
  }
}

export interface TradeFairnessResult {
  score: number; // 0 to 100
  verdict: "Balanced Swap" | "Slight Advantage to You" | "Favorable to Partner" | "Value Imbalance";
  summary: string;
  advice: string;
}

// Market valuation weights
const CATEGORY_TIER_POINTS: Record<string, number> = {
  "Phones & Tablets": 450,
  "Laptops & Computers": 550,
  "Gaming & Consoles": 400,
  "Cameras & Optics": 380,
  "Audio & Tech": 280,
  "Electronics": 320,
  "Watches & Jewelry": 350,
  "Fashion & Apparel": 180,
  "Sports & Outdoors": 200,
  "Home & Appliances": 220,
  "Musical Instruments": 300,
  "Toys & Collectibles": 160,
  "Books & Hobbies": 100,
  "Other": 150,
};

const HIGH_TIER_KEYWORDS = [
  "iphone", "macbook", "ipad", "ps5", "playstation", "xbox", "rtx", "sony",
  "nintendo switch", "dji", "canon", "nikon", "rolex", "apple watch", "galaxy", "bose"
];

export function estimateItemTradePoints(item: { name: string; category: string; condition: string }): number {
  let basePoints = CATEGORY_TIER_POINTS[item.category] || 200;

  const nameLower = (item.name || "").toLowerCase();
  for (const kw of HIGH_TIER_KEYWORDS) {
    if (nameLower.includes(kw)) {
      basePoints *= 1.35;
      break;
    }
  }

  const condMultipliers: Record<string, number> = {
    "Brand New": 1.15,
    "Like New": 0.95,
    "Good": 0.75,
    "Fair": 0.50,
  };

  return Math.round(basePoints * (condMultipliers[item.condition] || 0.75));
}

export async function evaluateTradeFairnessAI(params: {
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
}): Promise<TradeFairnessResult> {
  const targetPoints = estimateItemTradePoints({
    name: params.targetListing.title,
    category: params.targetListing.category,
    condition: params.targetListing.condition,
  });

  const offeredPoints = params.offeredItems.reduce(
    (acc, it) => acc + estimateItemTradePoints({ name: it.name, category: it.category, condition: it.condition }),
    0,
  );

  const ratio = offeredPoints / Math.max(1, targetPoints);

  // Parity percentage
  let score = 100 - Math.round(Math.abs(1.0 - ratio) * 50);
  score = Math.max(30, Math.min(99, score));

  let verdict: TradeFairnessResult["verdict"] = "Balanced Swap";
  let summary = "";
  let advice = "";

  if (ratio >= 0.85 && ratio <= 1.25) {
    verdict = "Balanced Swap";
    summary = `Equitable trade. ${params.offeredItems.length} offered item(s) matches the market tier of "${params.targetListing.title}".`;
    advice = "Great barter match! Proceed with meetup coordination.";
  } else if (ratio > 1.25) {
    verdict = "Slight Advantage to You";
    summary = `The offered bundle holds higher estimated market value than "${params.targetListing.title}".`;
    advice = "Very favorable proposal for you.";
  } else {
    verdict = "Favorable to Partner";
    summary = `The requested item ("${params.targetListing.title}") holds higher estimated value than the offered item(s).`;
    advice = "Consider adding an accessory or item to balance the trade.";
  }

  return {
    score,
    verdict,
    summary,
    advice,
  };
}
