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

/**
 * Reverse geocodes GPS coordinates (lat, lon) into a verified UAE Emirate
 * and Area / Neighbourhood. If GPS is unavailable, falls back to IP/headers.
 */
export const detectLocationFromCoords = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    let lat = data?.latitude;
    let lon = data?.longitude;
    const { NEIGHBOURHOODS, emirateOf, EMIRATES, getEmirateFromCoords } = await import("./db-types");

    let detectedEmirate = lat !== undefined && lon !== undefined ? getEmirateFromCoords(lat, lon) : "Abu Dhabi";
    let detectedArea = "";
    let fullAddress = "";

    // If no coordinates provided (e.g. browser permission denied or desktop GPS unavailable),
    // read Vercel geolocation headers or IP geolocation service
    if (lat === undefined || lon === undefined) {
      try {
        const { getRequest } = await import("@tanstack/react-start/server");
        const req = getRequest();
        const vercelCity = req.headers.get("x-vercel-ip-city");
        const vercelRegion = req.headers.get("x-vercel-ip-country-region");
        const vercelLat = req.headers.get("x-vercel-ip-latitude");
        const vercelLon = req.headers.get("x-vercel-ip-longitude");

        if (vercelLat && vercelLon) {
          lat = parseFloat(vercelLat);
          lon = parseFloat(vercelLon);
        }

        if (vercelCity || vercelRegion) {
          const em = emirateOf(vercelRegion) || emirateOf(vercelCity);
          if (em) detectedEmirate = em;
          if (vercelCity) detectedArea = decodeURIComponent(vercelCity);
        }
      } catch (e) {
        console.warn("Could not read request headers for geo:", e);
      }

      // If still no coordinates, query IP geolocation lookup
      if (lat === undefined || lon === undefined) {
        try {
          const ipRes = await fetch("https://ipwho.is/", {
            headers: { "User-Agent": "SwapUAE/1.0" },
          });
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            if (ipData.success) {
              lat = ipData.latitude;
              lon = ipData.longitude;
              const em = emirateOf(ipData.region) || emirateOf(ipData.city);
              if (em) detectedEmirate = em;
              if (ipData.city) detectedArea = ipData.city;
            }
          }
        } catch (e) {
          console.warn("IP lookup fallback failed:", e);
        }
      }
    }

    // If we have coordinates, query reverse geocoders
    if (lat !== undefined && lon !== undefined) {
      // 1. BigDataCloud reverse geocode client (fast, no key required)
      try {
        const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
        const bdcRes = await fetch(bdcUrl, {
          headers: { "User-Agent": "SwapUAE/1.0 (https://swapuae.com)" },
        });
        if (bdcRes.ok) {
          const bdcData = await bdcRes.json();
          const principalSubdiv = bdcData.principalSubdivision || "";
          const locality =
            bdcData.locality ||
            bdcData.city ||
            bdcData.localityInfo?.administrative?.[3]?.name ||
            "";
          const subLocality =
            bdcData.localityInfo?.informative?.[0]?.name ||
            bdcData.localityInfo?.administrative?.[4]?.name ||
            "";

          const candidateArea = subLocality || locality || principalSubdiv;
          const candidateEmirate = principalSubdiv || locality;

          if (candidateEmirate) {
            const em = emirateOf(candidateEmirate) || emirateOf(candidateArea);
            if (em) detectedEmirate = em;
          }
          if (candidateArea && !candidateArea.toLowerCase().includes("emirate")) {
            detectedArea = candidateArea;
          }
        }
      } catch (e) {
        console.warn("BigDataCloud geocode failed:", e);
      }

      // 2. OpenStreetMap Nominatim for refined neighbourhood (English language)
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=en`;
        const nomRes = await fetch(nomUrl, {
          headers: { "User-Agent": "SwapUAE/1.0 (https://swapuae.com; contact@swapuae.com)" },
        });
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          const addr = nomData.address || {};
          const neighbourhood =
            addr.neighbourhood ||
            addr.suburb ||
            addr.residential ||
            addr.city_district ||
            addr.quarter ||
            addr.district ||
            addr.commercial ||
            addr.city ||
            addr.town ||
            "";
          const state = addr.state || addr.province || addr.city || "";

          const em = emirateOf(state) || emirateOf(neighbourhood) || emirateOf(nomData.display_name);
          if (em) detectedEmirate = em;
          if (neighbourhood) detectedArea = neighbourhood;
          if (nomData.display_name) fullAddress = nomData.display_name;
        }
      } catch (e) {
        console.warn("Nominatim geocode fallback failed:", e);
      }
    }

    if (!detectedArea) {
      detectedArea = detectedEmirate;
    }

    // Match against known NEIGHBOURHOODS
    const knownMatch = NEIGHBOURHOODS.find((n) => {
      const nLower = n.toLowerCase();
      const aLower = detectedArea.toLowerCase();
      return nLower === aLower || nLower.includes(aLower) || aLower.includes(nLower);
    });

    const finalEmirate = (EMIRATES.includes(detectedEmirate as any) ? detectedEmirate : "Dubai") as string;

    return {
      emirate: finalEmirate,
      location: knownMatch || detectedArea,
      isKnownNeighbourhood: Boolean(knownMatch),
      fullAddress: fullAddress || `${detectedArea}, ${finalEmirate}`,
    };
  });

