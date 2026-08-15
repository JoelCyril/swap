import { supabase } from "@/integrations/supabase/client";

const LONG_LIVED_SECONDS = 60 * 60 * 24 * 365 * 20; // 20 years

export async function uploadFileTo(bucket: "avatars" | "listing-images", file: File): Promise<string> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) throw new Error("Not signed in");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${uid}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (up.error) throw up.error;
  const signed = await supabase.storage.from(bucket).createSignedUrl(path, LONG_LIVED_SECONDS);
  if (signed.error || !signed.data) throw signed.error ?? new Error("Failed to sign URL");
  return signed.data.signedUrl;
}
