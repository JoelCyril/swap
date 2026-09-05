import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "./image-compression";

const LONG_LIVED_SECONDS = 60 * 60 * 24 * 365 * 20; // 20 years

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const ALLOWED_VIDEO_TYPES = new Map([
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
]);

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_MAX_BYTES = 25 * 1024 * 1024;

function allowedTypesFor(bucket: "avatars" | "listing-images") {
  if (bucket === "avatars") return ALLOWED_IMAGE_TYPES;
  return new Map([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]);
}

function maxBytesFor(bucket: "avatars" | "listing-images", mimeType: string) {
  if (bucket === "avatars") return AVATAR_MAX_BYTES;
  if (mimeType.startsWith("video/")) return VIDEO_MAX_BYTES;
  return IMAGE_MAX_BYTES;
}

export async function uploadFileTo(bucket: "avatars" | "listing-images", file: File): Promise<string> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) throw new Error("Not signed in");

  const allowedTypes = allowedTypesFor(bucket);
  const ext = allowedTypes.get(file.type);

  if (!ext) {
    throw new Error("Unsupported file type");
  }

  const maxBytes = maxBytesFor(bucket, file.type);

  if (file.size > maxBytes) {
    throw new Error(
      file.type.startsWith("video/")
        ? "Video must be 25 MB or smaller"
        : bucket === "avatars"
          ? "Image must be 5 MB or smaller"
          : "Image must be 10 MB or smaller",
    );
  }

  // 1. Auto-compress image to WebP (95%+ bandwidth reduction)
  let uploadFile = file;
  if (file.type.startsWith("image/") && file.type !== "image/gif") {
    try {
      uploadFile = await compressImage(file, {
        maxWidth: bucket === "avatars" ? 480 : 1280,
        maxHeight: bucket === "avatars" ? 480 : 1280,
        quality: bucket === "avatars" ? 0.85 : 0.82,
      });
    } catch (e) {
      console.warn("Client image compression fallback:", e);
      uploadFile = file;
    }
  }

  const finalExt = uploadFile.type === "image/webp" ? "webp" : ext;
  const path = `${uid}/${crypto.randomUUID()}.${finalExt}`;

  // 2. Upload with 1-Year immutable caching so browsers cache locally
  const up = await supabase.storage.from(bucket).upload(path, uploadFile, {
    cacheControl: "31536000, public, immutable",
    upsert: false,
    contentType: uploadFile.type,
  });

  if (up.error) throw up.error;

  // 3. Return the Vercel edge-cached URL (cached globally for 1 year, 0 egress on repeat views)
  return `https://swapuae.com/media/${bucket}/${path}`;
}
