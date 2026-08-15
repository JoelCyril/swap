import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getMyProfile, updateMyProfile, deleteMyAccount } from "@/lib/profile.functions";
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  setInventoryPrivacy,
  listBlockedUsers,
  blockUser,
  unblockUser,
} from "@/lib/settings.functions";
import { EMIRATES } from "@/lib/db-types";
import { uploadFileTo } from "@/lib/upload";
import { toast } from "sonner";
import {
  Upload,
  User,
  Trash2,
  Image as ImageIcon,
  UserCircle,
  Bell,
  Lock,
  FileText,
  ArrowRight,
  X,
} from "lucide-react";
import { ImageCropper } from "@/components/ImageCropper";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SWAP" },
      { name: "description", content: "Update your SWAP profile, notifications and privacy." },
      { property: "og:title", content: "Settings — SWAP" },
      { property: "og:description", content: "Manage your SWAP profile, notifications and privacy." },
    ],
  }),
  component: SettingsPage,
});

type TabKey = "profile" | "notifications" | "privacy" | "terms";

const TABS: { key: TabKey; label: string; icon: typeof UserCircle }[] = [
  { key: "profile", label: "Profile", icon: UserCircle },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "privacy", label: "Account Privacy", icon: Lock },
  { key: "terms", label: "Terms of Conditions", icon: FileText },
];

const FALLBACK_COLOR = "oklch(0.75 0.15 55)";

function SettingsPage() {
  const [tab, setTab] = useState<TabKey>("profile");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          {/* Left panel */}
          <aside className="md:w-64 md:shrink-0">
            <p className="px-2 pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {"\n"}
            </p>
            <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
              {TABS.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition md:w-full ${
                      active
                        ? "border-2 border-primary/30 bg-primary-soft text-primary"
                        : "border-2 border-transparent text-foreground hover:bg-muted"
                    }`}
                  >
                    <t.icon className="h-5 w-5 shrink-0" />
                    <span className="whitespace-nowrap">{t.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <section className="min-w-0 flex-1">
            {tab === "profile" && <ProfileTab />}
            {tab === "notifications" && <NotificationsTab />}
            {tab === "privacy" && <PrivacyTab />}
            {tab === "terms" && <TermsTab />}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------- Profile ------------------------------- */

function ProfileTab() {
  const qc = useQueryClient();
  const me = useServerFn(getMyProfile);
  const update = useServerFn(updateMyProfile);
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => me() });

  const navigate = useNavigate();
  const deleteFn = useServerFn(deleteMyAccount);

  const [form, setForm] = useState({
    username: "",
    emirate: "",
    full_name: "",
    birthday: "",
    location: "",
    bio: "",
    avatar_url: null as string | null,
    banner_url: null as string | null,
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [pending, setPending] = useState<{ file: File; kind: "avatar" | "banner" } | null>(null);

  const del = useMutation({
    mutationFn: () => deleteFn({ data: { confirm: "DELETE" } }),
    onSuccess: async () => {
      await supabase.auth.signOut();
      qc.clear();
      toast.success("Account deleted");
      navigate({ to: "/listings", replace: true });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete account"),
  });

  useEffect(() => {
    if (data?.profile) {
      setForm({
        username: data.profile.username ?? "",
        emirate: (data.profile as { emirate?: string | null }).emirate ?? "",
        full_name: data.private?.full_name ?? "",
        birthday: data.private?.birthday ?? "",
        location: data.profile.location ?? "",
        bio: data.profile.bio ?? "",
        avatar_url: data.profile.avatar_url ?? null,
        banner_url: data.profile.banner_url ?? null,
      });
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: () =>
      update({
        data: {
          username: form.username.trim(),
          bio: form.bio,
          avatar_url: form.avatar_url,
          banner_url: form.banner_url,
          full_name: form.full_name.trim() || null,
          birthday: form.birthday || null,
          emirate: form.emirate || null,
          location: form.location.trim() || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated successfully");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  async function onPickAvatar(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image over 5 MB");
    setUploadingAvatar(true);
    try {
      const url = await uploadFileTo("avatars", file);
      setForm((f) => ({ ...f, avatar_url: url }));
      await update({ data: { avatar_url: url } });
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile picture updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function onPickBanner(file: File | null) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return toast.error("Image over 8 MB");
    setUploadingBanner(true);
    try {
      const url = await uploadFileTo("avatars", file);
      setForm((f) => ({ ...f, banner_url: url }));
      await update({ data: { banner_url: url } });
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile banner updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingBanner(false);
    }
  }

  return (
    <>
      {pending && (
        <ImageCropper
          key={pending.file.name + pending.kind}
          file={pending.file}
          aspect={pending.kind === "avatar" ? 1 : 3}
          title={pending.kind === "avatar" ? "Crop profile picture" : "Crop banner"}
          onCancel={() => setPending(null)}
          onDone={async (f) => {
            const kind = pending.kind;
            setPending(null);
            if (kind === "avatar") await onPickAvatar(f);
            else await onPickBanner(f);
          }}
        />
      )}
      <h1 className="font-display text-3xl font-black sm:text-4xl">Settings</h1>
      <p className="mt-2 text-muted-foreground">Update your public profile.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
        className="mt-6 space-y-4 rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card sm:p-6"
      >
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Profile picture</label>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <div
              className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-primary/20"
              style={{ backgroundColor: form.avatar_url ? "transparent" : FALLBACK_COLOR }}
            >
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-white" />
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary-soft">
              <Upload className="h-4 w-4" />
              {uploadingAvatar ? "Uploading…" : form.avatar_url ? "Change" : "Upload"}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPending({ file: f, kind: "avatar" });
                  e.target.value = "";
                }}
              />
            </label>
            {form.avatar_url && (
              <button
                type="button"
                onClick={async () => {
                  setForm((f) => ({ ...f, avatar_url: null }));
                  await update({ data: { avatar_url: null } });
                  qc.invalidateQueries({ queryKey: ["me"] });
                  toast.success("Profile picture removed");
                }}
                className="text-xs font-bold uppercase text-destructive hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Profile banner</label>
          <div className="mt-2 grid h-28 place-items-center overflow-hidden rounded-2xl border-2 border-primary/20 bg-primary-soft">
            {form.banner_url ? (
              <img src={form.banner_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-7 w-7 text-primary/50" />
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary-soft">
              <Upload className="h-4 w-4" />
              {uploadingBanner ? "Uploading…" : form.banner_url ? "Change" : "Upload"}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPending({ file: f, kind: "banner" });
                  e.target.value = "";
                }}
              />
            </label>
            {form.banner_url && (
              <button
                type="button"
                onClick={async () => {
                  setForm((f) => ({ ...f, banner_url: null }));
                  await update({ data: { banner_url: null } });
                  qc.invalidateQueries({ queryKey: ["me"] });
                  toast.success("Profile banner removed");
                }}
                className="text-xs font-bold uppercase text-destructive hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Username</label>
          <input
            required
            minLength={3}
            maxLength={20}
            pattern="[A-Za-z0-9_]+"
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value.replace(/[^A-Za-z0-9_]/g, "") })
            }
            className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Letters, numbers and underscores. Usernames are unique across SWAP.
          </p>
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Full name</label>
          <input
            maxLength={120}
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="e.g. Aisha Rahman"
            className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Date of birth</label>
          <input
            type="date"
            value={form.birthday}
            onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Emirate</label>
          <select
            value={form.emirate}
            onChange={(e) => setForm({ ...form, emirate: e.target.value })}
            className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm"
          >
            <option value="">Not set</option>
            {EMIRATES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">General location</label>
          <input
            maxLength={120}
            placeholder="e.g. Al Barsha"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Bio</label>
          <textarea
            rows={3}
            maxLength={500}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="mt-1 w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          disabled={mut.isPending}
          className="w-full rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50"
        >
          Save changes
        </button>
      </form>

      <section
        id="account"
        className="mt-6 rounded-3xl border-2 border-destructive/30 bg-card p-5 shadow-card sm:p-6"
      >
        <h2 className="flex items-center gap-2 font-display text-lg font-black text-destructive">
          <Trash2 className="h-5 w-5" /> Delete account
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This permanently removes your account, listings and inventory. This cannot be undone.
        </p>
        <button
          type="button"
          disabled={del.isPending}
          onClick={() => {
            if (window.confirm("Do you want to delete your account? This can't be undone."))
              del.mutate();
          }}
          className="mt-3 rounded-full border-2 border-destructive px-5 py-2 text-xs font-black uppercase tracking-wider text-destructive transition hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
        >
          {del.isPending ? "Deleting…" : "Delete my account"}
        </button>
      </section>
    </>
  );
}

/* ------------------------------ Shared UI ------------------------------ */

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-primary/10 py-4 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-bold">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border-2 transition disabled:opacity-50 ${
          checked ? "border-primary bg-primary" : "border-primary/30 bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card sm:p-6">
      <h2 className="font-display text-lg font-black">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

/* ---------------------------- Notifications ---------------------------- */

function NotificationsTab() {
  const qc = useQueryClient();
  const getFn = useServerFn(getNotificationPrefs);
  const setFn = useServerFn(updateNotificationPrefs);
  const { data } = useQuery({ queryKey: ["notification-prefs"], queryFn: () => getFn() });

  const mut = useMutation({
    mutationFn: (patch: Record<string, boolean>) => setFn({ data: patch }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-prefs"] });
      toast.success("Notification settings saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const prefs = data ?? { announcements: true, messages: true, saves: true, offers: true };

  return (
    <>
      <h1 className="font-display text-3xl font-black sm:text-4xl">Notifications</h1>
      <p className="mt-2 text-muted-foreground">Choose what SWAP notifies you about.</p>
      <div className="mt-6">
        <Card title="Push & in-app alerts">
          <Toggle
            label="Community announcements"
            hint="New posts from the SWAP team."
            checked={prefs.announcements}
            disabled={mut.isPending}
            onChange={(v) => mut.mutate({ announcements: v })}
          />
          <Toggle
            label="Messages"
            hint="Chat messages inside a trade."
            checked={prefs.messages}
            disabled={mut.isPending}
            onChange={(v) => mut.mutate({ messages: v })}
          />
          <Toggle
            label="Saves on my listings"
            hint="When someone saves one of your listings."
            checked={prefs.saves}
            disabled={mut.isPending}
            onChange={(v) => mut.mutate({ saves: v })}
          />
          <Toggle
            label="Offers & trade updates"
            hint="New offers, accepts, meetups and completions."
            checked={prefs.offers}
            disabled={mut.isPending}
            onChange={(v) => mut.mutate({ offers: v })}
          />
        </Card>
      </div>
    </>
  );
}

/* ------------------------------- Privacy ------------------------------- */

function PrivacyTab() {
  const qc = useQueryClient();
  const meFn = useServerFn(getMyProfile);
  const privacyFn = useServerFn(setInventoryPrivacy);
  const blockedFn = useServerFn(listBlockedUsers);
  const blockFn = useServerFn(blockUser);
  const unblockFn = useServerFn(unblockUser);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const { data: blocked } = useQuery({ queryKey: ["blocked-users"], queryFn: () => blockedFn() });
  const [username, setUsername] = useState("");

  const isPrivate = me?.profile?.inventory_default_visibility === "private";

  const privacy = useMutation({
    mutationFn: (v: boolean) => privacyFn({ data: { private: v } }),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["my-items"] });
      toast.success(v ? "Your inventory is now private" : "Your inventory is now public");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update privacy"),
  });

  const block = useMutation({
    mutationFn: () => blockFn({ data: { username } }),
    onSuccess: (r) => {
      setUsername("");
      qc.invalidateQueries({ queryKey: ["blocked-users"] });
      qc.invalidateQueries({ queryKey: ["blocked-ids"] });
      toast.success(`@${r.username} is now blocked`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not block that member"),
  });

  const unblock = useMutation({
    mutationFn: (id: string) => unblockFn({ data: { blocked_id: id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocked-users"] });
      qc.invalidateQueries({ queryKey: ["blocked-ids"] });
      toast.success("Member unblocked");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not unblock"),
  });

  return (
    <>
      <h1 className="font-display text-3xl font-black sm:text-4xl">Account privacy</h1>
      <p className="mt-2 text-muted-foreground">Control who can see your stuff.</p>

      <div className="mt-6 space-y-6">
        <Card title="Inventory visibility">
          <Toggle
            label="Make all inventory items private"
            hint="Nobody can browse your inventory on your profile. Items you put into a trade are still visible to the person you're swapping with."
            checked={!!isPrivate}
            disabled={privacy.isPending}
            onChange={(v) => privacy.mutate(v)}
          />
        </Card>

        <Card
          title="Blocked members"
          subtitle="Blocked members can't see your profile, listings or inventory — and you won't see theirs."
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^A-Za-z0-9_@]/g, ""))}
              placeholder="@username"
              maxLength={40}
              className="min-w-0 flex-1 rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled={!username.trim() || block.isPending}
              onClick={() => block.mutate()}
              className="rounded-full bg-gradient-primary px-5 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50"
            >
              {block.isPending ? "Blocking…" : "Block"}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {(blocked ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">You haven't blocked anyone.</p>
            )}
            {(blocked ?? []).map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-primary/15 bg-background px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full"
                    style={{ backgroundColor: b.user?.avatar_color ?? FALLBACK_COLOR }}
                  >
                    {b.user?.avatar_url ? (
                      <img src={b.user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <span className="truncate text-sm font-bold">@{b.user?.username ?? "member"}</span>
                </div>
                <button
                  type="button"
                  disabled={unblock.isPending}
                  onClick={() => unblock.mutate(b.blocked_id)}
                  className="inline-flex items-center gap-1 rounded-full border-2 border-primary/30 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-primary hover:bg-primary-soft disabled:opacity-50"
                >
                  <X className="h-3 w-3" /> Unblock
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

/* -------------------------------- Terms -------------------------------- */

function TermsTab() {
  return (
    <>
      <h1 className="font-display text-3xl font-black sm:text-4xl">Terms of Conditions</h1>
      <p className="mt-2 text-muted-foreground">The terms you accepted when joining SWAP.</p>
      <div className="mt-6 space-y-6">
        <Card title="Summary">
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>• SWAP is available to members aged 13 and above; under-18s need guardian permission.</li>
            <li>• SWAP connects traders but is never a party to a trade — you trade at your own risk.</li>
            <li>• Illegal, restricted, counterfeit, vape and smoking items may not be listed.</li>
            <li>• Harassment, profanity, spam and fraud can get your account banned.</li>
            <li>• Moderators may withhold or remove listings and suspend accounts.</li>
          </ul>
          <Link
            to="/terms"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow"
          >
            Read full terms <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </div>
    </>
  );
}
