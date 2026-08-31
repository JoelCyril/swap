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

export async function analyzeItemPhotoWithAI(imageUrl: string): Promise<ItemAnalysisResult> {
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
    // Fetch the image as arrayBuffer to send to Gemini
    const res = await fetch(imageUrl);
    const buffer = await res.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");
    const mimeType = res.headers.get("content-type") || "image/jpeg";

    const prompt = `You are an AI assistant for SWAP (the UAE barter & item trade marketplace).
Analyze this uploaded item photo carefully. Identify the exact item, brand, and type.
Available categories: ${CATEGORIES.join(", ")}.
Available conditions: ${CONDITIONS.join(", ")}.

Respond ONLY with valid JSON in this exact schema without markdown backticks:
{
  "name": "Exact Brand and Model of the item (e.g. Sony WH-1000XM4 Wireless Headphones)",
  "category": "One of the available categories",
  "condition": "One of the available conditions",
  "description": "2-3 crisp sentences describing the item features, appearance, and value.",
  "suggested_looking_for": "What a typical trader might want in exchange (e.g. iPad, Gaming setup, or Smartphone)"
}`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Image,
                mimeType,
              },
            },
          ],
        },
      ],
    });

    const text = response.text?.trim() || "";
    const cleanJson = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleanJson);

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
  const client = getAIClient();

  const fallbackCalculate = (): TradeFairnessResult => {
    // Condition weights
    const condWeight: Record<string, number> = {
      "Brand New": 1.0,
      "Like New": 0.85,
      "Good": 0.7,
      "Fair": 0.5,
    };

    const targetVal = condWeight[params.targetListing.condition] || 0.7;
    const offeredVal = params.offeredItems.reduce((acc, item) => acc + (condWeight[item.condition] || 0.7), 0);

    const ratio = offeredVal / Math.max(0.1, targetVal);
    let score = Math.min(100, Math.round(ratio * 75));
    if (score < 40) score = 45;
    if (score > 98) score = 95;

    let verdict: TradeFairnessResult["verdict"] = "Balanced Swap";
    if (ratio > 1.3) verdict = "Slight Advantage to You";
    else if (ratio < 0.75) verdict = "Favorable to Partner";

    return {
      score,
      verdict,
      summary: `Trade includes ${params.offeredItems.length} offered item(s) in ${params.offeredItems.map(i => i.condition).join(", ")} condition for "${params.targetListing.title}".`,
      advice: verdict === "Balanced Swap" ? "Fair and balanced trade proposal." : "Review item conditions and details before finalizing meetup.",
    };
  };

  if (!client) {
    return fallbackCalculate();
  }

  try {
    const prompt = `You are the Fair Trade AI adjudicator for SWAP (the UAE barter & trading marketplace).
Evaluate the fairness of this trade proposal based on secondhand market parity in the UAE.

Target Listing being requested:
- Title: ${params.targetListing.title}
- Category: ${params.targetListing.category}
- Condition: ${params.targetListing.condition}
- Description: ${params.targetListing.description || "N/A"}

Items Offered in exchange (${params.offeredItems.length} items):
${params.offeredItems.map((i, idx) => `${idx + 1}. "${i.name}" (${i.category}, Condition: ${i.condition})`).join("\n")}

Respond ONLY with valid JSON in this exact format without markdown backticks:
{
  "score": 85,
  "verdict": "Balanced Swap", // Choose one: "Balanced Swap" | "Slight Advantage to You" | "Favorable to Partner" | "Value Imbalance"
  "summary": "1-2 sentences explaining why this swap is or isn't balanced in the UAE market.",
  "advice": "1 practical sentence advising either trader on how to make the deal smoother."
}`;

    const res = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = res.text?.trim() || "";
    const cleanJson = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      score: typeof parsed.score === "number" ? Math.max(10, Math.min(100, parsed.score)) : 85,
      verdict: parsed.verdict || "Balanced Swap",
      summary: parsed.summary || "Balanced swap based on UAE marketplace categories.",
      advice: parsed.advice || "Verify item functionality during public safe-zone meetup.",
    };
  } catch (err) {
    console.error("[AI] Error evaluating trade fairness:", err);
    return fallbackCalculate();
  }
}
