export const MEDIA_CACHE_VERSION = "v2";

function appendCacheVersion(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("v")) {
      parsed.searchParams.set("v", MEDIA_CACHE_VERSION);
    }
    return parsed.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}v=${MEDIA_CACHE_VERSION}`;
  }
}

export function toCachedImageUrl(
  url: string | null | undefined,
  bucket: "listing-images" | "avatars" = "listing-images",
): string | null | undefined {
  if (!url || typeof url !== "string") return url;

  // If already routed through /media/ edge cache, ensure cache-busting version is attached
  if (url.includes(`/media/${bucket}/`)) {
    return appendCacheVersion(url);
  }

  // If it's a Supabase storage URL (either signed or public)
  const signMarker = `/storage/v1/object/sign/${bucket}/`;
  const publicMarker = `/storage/v1/object/public/${bucket}/`;

  let rawPath: string | null = null;
  if (url.includes(signMarker)) {
    rawPath = url.split(signMarker)[1]?.split("?")[0];
  } else if (url.includes(publicMarker)) {
    rawPath = url.split(publicMarker)[1]?.split("?")[0];
  }

  if (rawPath) {
    // Route through Vercel's global edge cache with cache-busting version
    return appendCacheVersion(`https://swapuae.com/media/${bucket}/${decodeURIComponent(rawPath)}`);
  }

  // If it's a raw relative storage path (e.g. "userId/filename.webp")
  if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("data:") && !url.startsWith("blob:")) {
    return appendCacheVersion(`https://swapuae.com/media/${bucket}/${decodeURIComponent(url)}`);
  }

  return url;
}

export function repairImageUrl(
  url: string | null | undefined,
  bucket: "listing-images" | "avatars" = "listing-images",
): string | null | undefined {
  return toCachedImageUrl(url, bucket);
}

export function repairImageUrls(
  urls: string[] | null | undefined,
  bucket: "listing-images" | "avatars" = "listing-images",
): string[] {
  if (!urls || !Array.isArray(urls)) return [];
  return urls.map((u) => toCachedImageUrl(u, bucket)).filter(Boolean) as string[];
}
