export interface MessageMeta {
  reactions: Record<string, string[]>;
  edited_at: string | null;
  attachment_urls: string[];
}

export const META_REACTIONS_PREFIX = "__meta__:reactions:";
export const META_EDITED_AT_PREFIX = "__meta__:edited_at:";

/**
 * Parses embedded reaction and edited metadata from attachment_urls,
 * or combines them with native column data if present.
 * Also ensures any __meta__: entries are stripped from attachment_urls.
 */
export function parseMessageMeta<T extends Record<string, any>>(row: T): T & MessageMeta {
  if (!row || typeof row !== "object") return row as any;

  let reactions: Record<string, string[]> =
    row.reactions && typeof row.reactions === "object" ? { ...row.reactions } : {};
  let edited_at: string | null = row.edited_at || null;
  const cleanAttachments: string[] = [];

  const rawUrls: string[] = Array.isArray(row.attachment_urls) ? row.attachment_urls : [];
  for (const u of rawUrls) {
    if (typeof u === "string") {
      if (u.startsWith(META_REACTIONS_PREFIX)) {
        try {
          const parsed = JSON.parse(u.slice(META_REACTIONS_PREFIX.length));
          if (parsed && typeof parsed === "object") {
            reactions = { ...reactions, ...parsed };
          }
        } catch {
          // ignore malformed metadata
        }
      } else if (u.startsWith(META_EDITED_AT_PREFIX)) {
        edited_at = u.slice(META_EDITED_AT_PREFIX.length);
      } else {
        cleanAttachments.push(u);
      }
    }
  }

  return {
    ...row,
    reactions,
    edited_at,
    attachment_urls: cleanAttachments,
  };
}

/**
 * Encodes reactions and edited_at into attachment_urls array while preserving
 * real attachment URLs and keeping only one meta entry per category.
 */
export function encodeMessageMeta(
  existingAttachmentUrls: string[] = [],
  meta: {
    reactions?: Record<string, string[]>;
    edited_at?: string | null;
  }
): string[] {
  const result: string[] = [];

  // Retain all real media attachments and meta tags not being updated
  for (const u of existingAttachmentUrls) {
    if (typeof u === "string") {
      if (u.startsWith(META_REACTIONS_PREFIX)) {
        if (meta.reactions === undefined) {
          result.push(u);
        }
      } else if (u.startsWith(META_EDITED_AT_PREFIX)) {
        if (meta.edited_at === undefined) {
          result.push(u);
        }
      } else {
        result.push(u);
      }
    }
  }

  if (meta.reactions !== undefined) {
    result.push(`${META_REACTIONS_PREFIX}${JSON.stringify(meta.reactions)}`);
  }

  if (meta.edited_at !== undefined && meta.edited_at !== null) {
    result.push(`${META_EDITED_AT_PREFIX}${meta.edited_at}`);
  }

  return result;
}
