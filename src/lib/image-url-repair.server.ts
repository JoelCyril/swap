export function toCachedImageUrl(
  url: string | null | undefined,
  bucket: "listing-images" | "avatars" = "listing-images",
): string | null | undefined {
  if (!url || typeof url !== "string") return url;

  // If already routed through /media/ edge cache
  if (url.includes(`/media/${bucket}/`)) return url;

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
    // Route through Vercel's global edge cache with 1-year immutable caching
    return `https://swapuae.com/media/${bucket}/${decodeURIComponent(rawPath)}`;
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
