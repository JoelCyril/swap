import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";

/**
 * Given a free-text area the user typed and the distinct listing locations,
 * return the locations that are in or near that area (AI-assisted).
 * Falls back to plain substring matching when AI is unavailable.
 */
export const matchNearbyAreas = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        area: z.string().min(2).max(80),
        locations: z.array(z.string().max(120)).max(120),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const area = data.area.trim();
    const locations = Array.from(new Set(data.locations.filter(Boolean)));
    const normalize = (value: string) =>
      value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    const distance = (a: string, b: string) => {
      const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
      for (let i = 1; i <= a.length; i += 1) {
        let diagonal = previous[0];
        previous[0] = i;
        for (let j = 1; j <= b.length; j += 1) {
          const above = previous[j];
          previous[j] = Math.min(
            previous[j] + 1,
            previous[j - 1] + 1,
            diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
          );
          diagonal = above;
        }
      }
      return previous[b.length];
    };
    const close = (left: string, right: string) => {
      const a = normalize(left);
      const b = normalize(right);
      if (!a || !b) return false;
      if (a.includes(b) || b.includes(a)) return true;
      const aWords = a.split(" ");
      const bWords = b.split(" ");
      return aWords.some((first) =>
        bWords.some((second) => {
          const maxLength = Math.max(first.length, second.length);
          return maxLength >= 4 && distance(first, second) <= Math.max(1, Math.floor(maxLength * 0.3));
        }),
      );
    };
    const fallback = locations.filter((location) => close(location, area));
    if (!locations.length) return { matches: [] as string[] };

    const key = process.env["AI_GATEWAY_API_KEY"];
    const baseURL = process.env["AI_GATEWAY_BASE_URL"];
    if (!key || !baseURL) return { matches: fallback };

    try {
      const { createAiGatewayProvider } = await import("./ai-gateway.server");
      const gateway = createAiGatewayProvider(key, baseURL);
      const { output } = await generateText({
        model: gateway("google/gemini-2.5-flash-lite"),
        output: Output.object({ schema: z.object({ matches: z.array(z.string()) }) }),
        system:
          "You know United Arab Emirates geography. The user area may be misspelled or abbreviated — match it to the closest real area. Given a user's area and a list of listing locations, return only the listing locations that are the same as, inside, adjacent to, or within a short drive of the user's area. Copy the location strings exactly as given. Return an empty list if none are nearby.",
        prompt: `User area: ${area}\nListing locations:\n${locations.map((l) => `- ${l}`).join("\n")}`,
      });
      const valid = (output?.matches ?? []).filter((m) => locations.includes(m));
      return { matches: valid.length ? valid : fallback };
    } catch {
      return { matches: fallback };
    }
  });
