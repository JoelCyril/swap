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

import { evaluateTradeFairnessWithGroq, type TradeFairnessResponse } from "./groq.server";

export interface TradeFairnessResult {
  score: number; // 0 to 100
  verdict: "Balanced Swap" | "Slight Advantage to You" | "Favorable to Partner" | "Value Imbalance" | "Highly Unbalanced" | string;
  summary: string;
  advice: string;
  target_aed?: number;
  offered_total_aed?: number;
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
  const res = await evaluateTradeFairnessWithGroq(params);
  return {
    score: res.score,
    verdict: res.verdict,
    summary: res.summary,
    advice: res.advice,
    target_aed: res.target_aed,
    offered_total_aed: res.offered_total_aed,
  };
}

