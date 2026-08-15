import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  listAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "@/lib/announcements.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { uploadFileTo } from "@/lib/upload";
import { ImageCropper } from "@/components/ImageCropper";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo, handle } from "@/lib/db-types";
import { toast } from "sonner";
import { Megaphone, Send, Upload, X, Trash2, ShieldCheck } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Community announcements — SWAP" },
      {
        name: "description",
        content: "News, updates and safety notices from the SWAP team for the whole swapping community.",
      },
      { property: "og:title", content: "Community announcements — SWAP" },
      { property: "og:description", content: "News and updates from the SWAP team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listAnnouncements);
  const createFn = useServerFn(createAnnouncement);
  const deleteFn = useServerFn(deleteAnnouncement);
  const meFn = useServerFn(getMyProfile);

  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    localStorage.setItem("announcements-seen-at", String(Date.now()));
    window.dispatchEvent(new Event("announcements-seen"));
  }, []);


  const { data: posts, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => listFn(),
  });
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => meFn(),
    enabled: signedIn,
  });
  const isAdmin = !!me?.roles?.includes("admin");

  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [queue, setQueue] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const post = useMutation({
    mutationFn: () => createFn({ data: { body: body.trim(), image_urls: images } }),
    onSuccess: () => {
      setBody("");
      setImages([]);
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement posted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  async function uploadCropped(file: File) {
    setUploading(true);
    try {
      const url = await uploadFileTo("listing-images", file);
      setImages((prev) => [...prev, url]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {queue.length > 0 && (
        <ImageCropper
          key={queue[0].name + queue.length}
          file={queue[0]}
          aspect={4 / 3}
          title="Crop photo"
          onCancel={() => setQueue((q) => q.slice(1))}
          onDone={async (f) => {
            setQueue((q) => q.slice(1));
            await uploadCropped(f);
          }}
        />
      )}
      <Navbar />
      <main className="mx-auto w-full max-w-[800px] flex-1 px-6 py-10">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-md">
            <Megaphone className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-4xl font-black">Community announcements</h1>
            <p className="mt-1 text-muted-foreground">Updates from the SWAP team.</p>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-8 rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card">
            <p className="text-xs font-black uppercase tracking-wider text-primary">Post an announcement</p>
            <textarea
              rows={3}
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share news with the community…"
              className="mt-3 w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
            />
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {images.map((url) => (
                  <div key={url} className="relative aspect-square overflow-hidden rounded-xl border-2 border-primary/20">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary/30 px-4 py-2 text-xs font-black uppercase tracking-wider text-primary hover:bg-primary-soft">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []).slice(0, 6 - images.length);
                    e.target.value = "";
                    setQueue((q) => [...q, ...files]);
                  }}
                />
                <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Add photo"}
              </label>
              <button
                type="button"
                disabled={post.isPending || uploading || (!body.trim() && images.length === 0)}
                onClick={() => post.mutate()}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-md transition hover:shadow-glow disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> {post.isPending ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !posts || posts.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-card p-10 text-center text-muted-foreground">
              No announcements yet. Check back soon!
            </div>
          ) : (
            posts.map((p: any) => (
              <article key={p.id} className="rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card">
                <header className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-white text-sm font-black text-white shadow"
                    style={{ backgroundColor: p.author?.avatar_url ? "transparent" : p.author?.avatar_color ?? "#888" }}
                  >
                    {p.author?.avatar_url ? (
                      <img src={p.author.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      p.author?.display_name?.[0]?.toUpperCase() ?? "S"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-bold">{p.author ? handle(p.author) : "SWAP team"}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-foreground">
                        <ShieldCheck className="h-3 w-3" /> Admin
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Delete this announcement?")) remove.mutate(p.id);
                      }}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-destructive transition hover:bg-destructive/10"
                      aria-label="Delete announcement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </header>

                {p.body && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{p.body}</p>}

                {p.image_urls?.length > 0 && (
                  <div className={`mt-3 grid gap-2 ${p.image_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                    {p.image_urls.map((url: string) => (
                      <img
                        key={url}
                        src={url}
                        alt=""
                        loading="lazy"
                        className="w-full rounded-2xl border-2 border-primary/10 object-cover"
                      />
                    ))}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
