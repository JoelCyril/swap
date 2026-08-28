import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  getOffer,
  respondToOffer,
  reviseOfferItems,
  confirmTradeCompletion,
  confirmItemsReceived,
  toggleListingItem,
} from "@/lib/offers.functions";



import { listOwnerInventory } from "@/lib/items.functions";
import { listMessages, sendMessage, markMessagesRead } from "@/lib/messages.functions";
import {
  listMeetupProposals,
  proposeMeetup,
  respondMeetup,
  confirmMeetupSafety,
} from "@/lib/meetups.functions";
import { getTermsStatus } from "@/lib/terms.functions";
import { uploadFileTo } from "@/lib/upload";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo, handle } from "@/lib/db-types";
import {
  Send,
  Check,
  X,
  MapPin,
  Calendar,
  Clock,
  Hourglass,
  ArrowRightLeft,
  Package,
  ShieldCheck,
  Plus,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/offers/$id")({
  head: () => ({
    meta: [
      { title: "Offer — SWAP" },
      { name: "description", content: "Chat about a swap and agree a meetup." },
      { property: "og:title", content: "Offer — SWAP" },
      { property: "og:description", content: "Chat and coordinate a swap." },
    ],
  }),
  component: OfferDetail,
});

type Img = {
  src: string | null;
  emoji?: string;
  name: string;
  removed?: boolean;
  id?: string;
  to?: { kind: "item" | "listing"; id: string };
  canRemove?: boolean;
};

function OfferDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const get = useServerFn(getOffer);
  const respond = useServerFn(respondToOffer);
  const revise = useServerFn(reviseOfferItems);
  const confirmComplete = useServerFn(confirmTradeCompletion);
  const confirmReceived = useServerFn(confirmItemsReceived);
  const toggleListed = useServerFn(toggleListingItem);



  const list = useServerFn(listMessages);
  const markRead = useServerFn(markMessagesRead);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingChan = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentTyping = useRef(0);
  const send = useServerFn(sendMessage);
  const listProposals = useServerFn(listMeetupProposals);
  const propose = useServerFn(proposeMeetup);
  const respondProp = useServerFn(respondMeetup);
  const confirmSafety = useServerFn(confirmMeetupSafety);

  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [guardianAsk, setGuardianAsk] = useState(false);
  const [guardianOk, setGuardianOk] = useState(false);
  const [inventoryOf, setInventoryOf] = useState<{ id: string; label: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const termsFn = useServerFn(getTermsStatus);
  const { data: terms } = useQuery({ queryKey: ["terms-status"], queryFn: () => termsFn() });
  const isMinor = typeof terms?.age === "number" && terms.age < 18;

  const { data: offer } = useQuery({ queryKey: ["offer", id], queryFn: () => get({ data: { id } }) });
  const { data: messages } = useQuery({
    queryKey: ["messages", id],
    queryFn: () => list({ data: { offer_id: id } }),
    refetchInterval: 4000,
  });
  const { data: proposals } = useQuery({
    queryKey: ["meetup-proposals", id],
    queryFn: () => listProposals({ data: { offer_id: id } }),
    enabled: offer?.status === "accepted" || offer?.status === "completed",
    refetchInterval: 5000,
  });

  const viewerId = (offer as { viewer_id?: string } | undefined)?.viewer_id;

  useEffect(() => {
    const channel = supabase
      .channel(`offer-${id}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (!payload || payload.userId === viewerId) return;
        setOtherTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setOtherTyping(false), 3000);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `offer_id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["messages", id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "meetup_proposals", filter: `offer_id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["meetup-proposals", id] });
        qc.invalidateQueries({ queryKey: ["offer", id] });
      })
      .subscribe();
    typingChan.current = channel;
    return () => {
      typingChan.current = null;
      supabase.removeChannel(channel);
    };
  }, [id, qc, viewerId]);

  // Mark the other side's messages as read whenever we see them.
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const unread = (messages as { sender_id: string; read_at: string | null }[]).some(
      (m) => m.sender_id !== viewerId && !m.read_at,
    );
    if (unread) markRead({ data: { offer_id: id } }).catch(() => {});
  }, [messages, viewerId, id, markRead]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, proposals]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["offer", id] });
    qc.invalidateQueries({ queryKey: ["offers"] });
    qc.invalidateQueries({ queryKey: ["meetup-proposals", id] });
  };

  const respondMut = useMutation({
    mutationFn: (action: "accept" | "decline" | "waitlist" | "withdraw" | "complete") =>
      respond({ data: { id, action } }),
    onSuccess: () => {
      invalidateAll();
      toast.success("Updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const reviseMut = useMutation({
    mutationFn: (ids: string[]) => revise({ data: { id, offered_item_ids: ids } }),
    onSuccess: (_result, ids) => {
      qc.setQueryData(["offer", id], (old: any) => {
        if (!old) return old;
        const next = { ...old };
        const currentKey = isTo ? "recipient_item_ids" : "offered_item_ids";
        const currentListKey = isTo ? "recipient_items" : "items";
        const base = [...((old[currentListKey] ?? []) as any[]), ...((isTo ? (old.items ?? []) : (old.recipient_items ?? [])) as any[])];
        const byId = new Map(base.map((it: any) => [it.id, it]));
        next[currentKey] = ids;
        next[currentListKey] = ids.map((id) => byId.get(id)).filter(Boolean);
        return next;
      });
      invalidateAll();
      setAddOpen(false);
      toast.success("Your side of the trade was updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const listedMut = useMutation({
    mutationFn: (removed: boolean) => toggleListed({ data: { id, removed } }),
    onSuccess: () => {
      invalidateAll();
      toast.success("Your side of the trade was updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const completeMut = useMutation({
    mutationFn: () => confirmComplete({ data: { id } }),
    onSuccess: (r: any) => {
      invalidateAll();
      toast.success(
        r?.both ? "Trade marked completed — now confirm you received the items" : "Waiting on the other side to confirm",
      );
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const receivedMut = useMutation({
    mutationFn: () => confirmReceived({ data: { id } }),
    onSuccess: (r: any) => {
      invalidateAll();
      toast.success(r?.both ? "Swap complete" : "Receipt confirmed — waiting on the other side");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });



  const safetyMut = useMutation({
    mutationFn: (pid: string) => confirmSafety({ data: { id: pid } }),
    onSuccess: () => invalidateAll(),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const sendMut = useMutation({
    mutationFn: async () => {
      let urls: string[] = [];
      if (files.length) {
        setUploading(true);
        try {
          urls = await Promise.all(files.map((f) => uploadFileTo("listing-images", f)));
        } finally {
          setUploading(false);
        }
      }
      return send({ data: { offer_id: id, body: text.trim(), attachment_urls: urls } });
    },
    onSuccess: () => {
      setText("");
      setFiles([]);
      qc.invalidateQueries({ queryKey: ["messages", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Message not sent"),
  });

  if (!offer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="p-8 text-center text-muted-foreground">Loading offer…</div>
      </div>
    );
  }

  const myId = offer.viewer_id;
  const isTo = offer.to_user === myId;
  const other = isTo ? offer.from_profile : offer.to_profile;
  const canAct = offer.status === "pending";
  const accepted = offer.status === "accepted";
  const chatOpen = accepted || offer.status === "completed";

  const items = (offer.items ?? []) as any[];
  const removedItems = ((offer as any).removed_items ?? []) as any[];
  const recipientItems = ((offer as any).recipient_items ?? []) as any[];
  const removedRecipientItems = ((offer as any).removed_recipient_items ?? []) as any[];
  const confirmedProposal = (proposals ?? []).find(
    (p: any) =>
      p.status === "accepted" &&
      ((p.safety_confirmed_by ?? []) as string[]).includes(offer.from_user) &&
      ((p.safety_confirmed_by ?? []) as string[]).includes(offer.to_user),
  );
  const acceptedProposal = (proposals ?? []).find((p: any) => p.status === "accepted");
  const pendingProposal = (proposals ?? []).find((p: any) => p.status === "pending");

  const completeConfirmed = (((offer as any).complete_confirmed_by ?? []) as string[]).filter(Boolean);
  const receivedConfirmed = (((offer as any).received_confirmed_by ?? []) as string[]).filter(Boolean);
  const iConfirmedComplete = completeConfirmed.includes(myId as string);
  const iConfirmedReceived = receivedConfirmed.includes(myId as string);
  const bothReceived =
    receivedConfirmed.includes(offer.from_user) && receivedConfirmed.includes(offer.to_user);

  const statusLabel =
    offer.status === "completed"
      ? bothReceived
        ? "Completed"
        : "Awaiting item receipt"
      : offer.status === "accepted"
        ? confirmedProposal
          ? "Meetup confirmed"
          : "Negotiating"
        : offer.status;


  const toImgs = (list: any[], removed: any[], mine: boolean): Img[] => [
    ...list.map((it) => ({
      id: it.id,
      src: it.image_urls?.[0] ?? null,
      emoji: it.image_emoji,
      name: it.name,
      to: { kind: "item" as const, id: it.id as string },
      canRemove: mine && accepted,
    })),
    ...removed.map((it) => ({
      id: it.id,
      src: it.image_urls?.[0] ?? null,
      emoji: it.image_emoji,
      name: it.name,
      removed: true,
      to: { kind: "item" as const, id: it.id as string },
    })),
  ];

  const listingRemoved = Boolean((offer as any).listing_removed);
  const listingImgs: Img[] = [
    {
      src: offer.listing?.image_urls?.[0] ?? null,
      emoji: offer.listing?.image_emoji ?? "📦",
      name: offer.listing?.title ?? "Listing unavailable",
      removed: listingRemoved,
      to: offer.listing?.id ? { kind: "listing" as const, id: offer.listing.id as string } : undefined,
      canRemove: isTo && accepted,
    },
  ];

  const offerItemMap = new Map(
    [...((offer.items ?? []) as any[]), ...((offer.recipient_items ?? []) as any[])].map((it: any) => [it.id, it]),
  );
  const senderIds = (((offer as any).offered_item_ids ?? []) as string[]).filter(Boolean);
  const recipientIds = (((offer as any).recipient_item_ids ?? []) as string[]).filter(Boolean);
  const senderItems = senderIds.map((id) => offerItemMap.get(id)).filter(Boolean);
  const recipientItemsSelected = recipientIds.map((id) => offerItemMap.get(id)).filter(Boolean);

  const senderImgs = toImgs(senderItems, removedItems, !isTo);
  const ownerExtraImgs = toImgs(recipientItemsSelected, removedRecipientItems, isTo);

  const giveImgs = isTo ? [...listingImgs, ...ownerExtraImgs] : senderImgs;
  const getImgs = isTo ? senderImgs : [...listingImgs, ...ownerExtraImgs];
  const myItemIds = isTo ? recipientIds : senderIds;
  const giveOwner = isTo ? offer.listing?.owner ?? offer.to_profile : offer.from_profile;
  const getOwner = isTo ? offer.from_profile : offer.listing?.owner ?? offer.to_profile;

  const removeImg = (img: Img) => {
    if (img.to?.kind === "listing") {
      listedMut.mutate(!listingRemoved);
      return;
    }
    if (!img.id) return;
    reviseMut.mutate(myItemIds.filter((i) => i !== img.id));
  };


  const timeline = [
    ...(messages ?? []).map((m: any) => ({ kind: "msg" as const, at: m.created_at, data: m })),
    ...(proposals ?? []).map((p: any) => ({ kind: "meetup" as const, at: p.created_at, data: p })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-[1300px] flex-1 px-4 py-6 sm:py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-black sm:text-2xl">Trade with {handle(other)}</h1>
            <p className="text-xs text-muted-foreground">
              Status: <span className="font-bold capitalize text-primary">{statusLabel}</span>
            </p>
          </div>
          <span
            className={`rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${
              !accepted || confirmedProposal
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {offer.status === "completed"
              ? bothReceived
                ? "Swap complete"
                : iConfirmedReceived
                  ? `Waiting on ${handle(other)} to confirm receipt`
                  : "Confirm you received the items"
              : !accepted
                ? offer.status
                : iConfirmedComplete
                  ? `Waiting on ${handle(other)} to confirm completion`
                  : confirmedProposal
                    ? "Meeting confirmed"
                    : "Negotiating — adjust items or propose a meetup"}
          </span>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,260px)]">
          {/* You give */}
          <SidePanel
            heading="You give"
            images={giveImgs}
            owner={giveOwner}
            onAdd={accepted ? () => setAddOpen(true) : undefined}
            onRemove={accepted ? removeImg : undefined}
          />




          {/* Chat */}
          <div className="flex min-w-0 flex-col overflow-hidden rounded-3xl border-2 border-primary/20 bg-card shadow-card h-[70vh] min-h-[420px] lg:h-[640px]">
            <div className="flex items-center gap-3 border-b border-border p-3">
              <div
                className="grid h-9 w-9 place-items-center overflow-hidden rounded-full text-white font-bold"
                style={{ backgroundColor: other?.avatar_color }}
              >
                {(other as any)?.avatar_url ? (
                  <img src={(other as any).avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  (other?.display_name || other?.username)?.[0]?.toUpperCase()
                )}
              </div>
              <p className="flex-1 text-sm font-bold">{handle(other)}</p>
              <span className="flex items-center gap-1 text-[10px] font-black uppercase text-primary">
                <ArrowRightLeft className="h-3 w-3" /> {statusLabel}
              </span>
            </div>

            {confirmedProposal && (
              <div className="border-b border-border bg-primary-soft px-4 py-2">
                <p className="text-[10px] font-black uppercase text-primary flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Confirmed meetup
                </p>
                <p className="text-sm font-semibold flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {confirmedProposal.place}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {new Date(confirmedProposal.meet_at).toLocaleString()}
                </p>
              </div>
            )}

            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
              {offer.message && (
                <div className="text-center">
                  <p className="inline-block rounded-2xl bg-primary-soft px-4 py-2 text-xs italic text-primary">
                    Initial message: "{offer.message}"
                  </p>
                </div>
              )}
              {timeline.map((entry) =>
                entry.kind === "msg" ? (
                  (() => {
                    const m = entry.data;
                    const mine = m.sender_id === myId;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                            mine ? "bg-gradient-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          {m.body && <p className="break-words">{m.body}</p>}
                          {((m as { attachment_urls?: string[] }).attachment_urls ?? []).length > 0 && (
                            <div className="mt-1 grid gap-1.5">
                              {((m as { attachment_urls?: string[] }).attachment_urls ?? []).map((u) =>
                                /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u) ? (
                                  <video key={u} src={u} controls className="max-h-56 w-full rounded-xl bg-black" />
                                ) : (
                                  <a key={u} href={u} target="_blank" rel="noreferrer">
                                    <img src={u} alt="attachment" className="max-h-56 w-full rounded-xl object-cover" />
                                  </a>
                                ),
                              )}
                            </div>
                          )}

                          <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {timeAgo(m.created_at)}
                            {mine && <span className="ml-1">· {m.read_at ? "Seen" : "Delivered"}</span>}
                          </p>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <MeetupCard
                    key={entry.data.id}
                    p={entry.data}
                    myId={myId}
                    fromUser={offer.from_user}
                    toUser={offer.to_user}
                    onRespond={(action) =>
                      respondProp({ data: { id: entry.data.id, action } })
                        .then(invalidateAll)
                        .catch((e) => toast.error(e instanceof Error ? e.message : "Failed"))
                    }
                    onSafety={() => safetyMut.mutate(entry.data.id)}
                  />
                ),
              )}
              {timeline.length === 0 && !chatOpen && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  Chat unlocks once the offer is accepted.
                </p>
              )}
              {otherTyping && chatOpen && (
                <p className="text-[11px] italic text-muted-foreground">{handle(other)} is typing…</p>
              )}
              {timeline.length === 0 && chatOpen && (
                <p className="py-8 text-center text-xs text-muted-foreground">Say hello and coordinate your swap.</p>
              )}
            </div>

            <div className="border-t border-border p-3">
              {files.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <span
                      key={f.name + i}
                      className="inline-flex max-w-[160px] items-center gap-1 rounded-full bg-muted px-3 py-1 text-[11px]"
                    >
                      <span className="truncate">{f.name}</span>
                      <button type="button" onClick={() => setFiles((prev) => prev.filter((_, x) => x !== i))} aria-label="Remove">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (text.trim() || files.length) sendMut.mutate();
                }}
                className="flex gap-2"
              >
                <label
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-primary/20 text-primary ${
                    chatOpen ? "cursor-pointer hover:bg-primary-soft" : "opacity-50"
                  }`}
                  title="Attach photos or videos"
                >
                  <Paperclip className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    disabled={!chatOpen}
                    className="hidden"
                    onChange={(e) => {
                      const picked = Array.from(e.target.files ?? [])
  .slice(0, 4)
  .filter((file) => {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error(`${file.name} is not a supported image or video`);
      return false;
    }

    if (isImage && file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name} is over 10 MB`);
      return false;
    }

    if (isVideo && file.size > 25 * 1024 * 1024) {
      toast.error(`${file.name} is over 25 MB`);
      return false;
    }

    return true;
  });

setFiles((prev) => [...prev, ...picked].slice(0, 4));
                      e.target.value = "";
                    }}
                  />
                </label>
                <input
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    const now = Date.now();
                    if (chatOpen && now - lastSentTyping.current > 1500) {
                      lastSentTyping.current = now;
                      typingChan.current?.send({ type: "broadcast", event: "typing", payload: { userId: viewerId } });
                    }
                  }}
                  placeholder={chatOpen ? "Type a message…" : "Chat locked until the offer is accepted"}
                  maxLength={2000}
                  disabled={!chatOpen}
                  className="min-w-0 flex-1 rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatOpen || (!text.trim() && !files.length) || sendMut.isPending || uploading}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* You get */}
          <div className="min-w-0 space-y-3">
          <SidePanel
            heading="You get"
            images={getImgs}
            owner={getOwner}
            onViewInventory={() =>
              setInventoryOf(
                isTo
                  ? { id: offer.from_user, label: handle(offer.from_profile) }
                  : { id: offer.to_user, label: handle(offer.to_profile) },
              )
            }
          />
          {accepted && (
            <ProposeMeetup
              disabledReason={null}
              label={acceptedProposal || pendingProposal ? "Propose a change" : "Propose meetup"}
              onPropose={(p) =>
                propose({ data: { offer_id: id, ...p } })
                  .then(() => {
                    invalidateAll();
                    toast.success("Proposal sent");
                  })
                  .catch((e) => toast.error(e instanceof Error ? e.message : "Failed"))
              }
            />
          )}
          </div>

        </div>

        {/* Actions */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {canAct && isTo && (
            <>
              <button
                onClick={() => (isMinor ? setGuardianAsk(true) : respondMut.mutate("accept"))}
                disabled={respondMut.isPending}
                className="flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-2.5 text-sm font-black uppercase text-primary-foreground shadow-glow"
              >
                <Check className="h-4 w-4" /> Accept
              </button>
              <button
                onClick={() => respondMut.mutate("waitlist")}
                disabled={respondMut.isPending}
                className="flex items-center justify-center gap-2 rounded-full border-2 border-yellow-500/40 py-2.5 text-sm font-black uppercase text-yellow-700 hover:bg-yellow-50"
              >
                <Hourglass className="h-4 w-4" /> Waitlist
              </button>
              <button
                onClick={() => respondMut.mutate("decline")}
                disabled={respondMut.isPending}
                className="flex items-center justify-center gap-2 rounded-full border-2 border-destructive/30 py-2.5 text-sm font-black uppercase text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" /> Decline
              </button>
            </>
          )}
          {canAct && !isTo && (
            <button
              onClick={() => respondMut.mutate("withdraw")}
              disabled={respondMut.isPending}
              className="flex items-center justify-center gap-2 rounded-full border-2 border-muted-foreground/30 py-2.5 text-sm font-black uppercase text-muted-foreground hover:bg-muted"
            >
              Withdraw offer
            </button>
          )}
          {offer.status === "waitlisted" && isTo && (
            <>
              <button
                onClick={() => (isMinor ? setGuardianAsk(true) : respondMut.mutate("accept"))}
                className="flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-2.5 text-sm font-black uppercase text-primary-foreground"
              >
                <Check className="h-4 w-4" /> Accept now
              </button>
              <button
                onClick={() => respondMut.mutate("decline")}
                className="flex items-center justify-center gap-2 rounded-full border-2 border-destructive/30 py-2.5 text-sm font-black uppercase text-destructive"
              >
                <X className="h-4 w-4" /> Decline
              </button>
            </>
          )}

          {accepted && (
            <>
              <button
                onClick={() => completeMut.mutate()}
                disabled={iConfirmedComplete || completeMut.isPending}
                className="flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-2.5 text-sm font-black uppercase text-primary-foreground disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {iConfirmedComplete ? "Completion confirmed" : "Mark trade completed"}
              </button>
              <button
                onClick={() => {
                  if (confirm(isTo ? "Reject this swap? The listing goes back to active." : "Withdraw from this swap?"))
                    respondMut.mutate(isTo ? "decline" : "withdraw");
                }}
                className="flex items-center justify-center gap-2 rounded-full border-2 border-destructive/30 py-2.5 text-sm font-black uppercase text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" /> {isTo ? "Reject offer" : "Withdraw"}
              </button>
            </>
          )}
          {offer.status === "completed" && !bothReceived && (
            <button
              onClick={() => receivedMut.mutate()}
              disabled={iConfirmedReceived || receivedMut.isPending}
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-2.5 text-sm font-black uppercase text-primary-foreground disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {iConfirmedReceived ? "Receipt confirmed" : "I received the items"}
            </button>
          )}
        </div>

        {(accepted || (offer.status === "completed" && !bothReceived)) && (
          <div className="mt-4 space-y-3">
            <p className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary-soft/40 p-4 text-center text-xs font-semibold text-muted-foreground">
              {offer.status === "completed"
                ? `Trade marked completed. Both sides must confirm receipt — you: ${
                    iConfirmedReceived ? "Confirmed" : "Pending"
                  } · ${handle(other)}: ${receivedConfirmed.includes(other?.id as string) ? "Confirmed" : "Pending"}`
                : `Completion needs both sides — you: ${iConfirmedComplete ? "Confirmed" : "Pending"} · ${handle(other)}: ${
                    completeConfirmed.includes(other?.id as string) ? "Confirmed" : "Pending"
                  }`}
            </p>
          </div>
        )}


      </main>

      {inventoryOf && (
        <InventoryModal
          ownerId={inventoryOf.id}
          label={inventoryOf.label}
          onClose={() => setInventoryOf(null)}
        />
      )}

      {addOpen && (
        <AddItemsModal
          ownerId={myId as string}
          selected={myItemIds}
          pending={reviseMut.isPending}
          onClose={() => setAddOpen(false)}
          onSave={(ids) => reviseMut.mutate(ids)}
        />
      )}



      {guardianAsk && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card">
            <h2 className="font-display text-xl font-black">Parental permission required</h2>
            <label className="mt-4 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={guardianOk}
                onChange={(e) => setGuardianOk(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span>
                By checking this box, you confirm that you have obtained permission from a parent or legal guardian to
                participate in this trade.
              </span>
            </label>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setGuardianAsk(false);
                  setGuardianOk(false);
                }}
                className="flex-1 rounded-full border-2 border-primary/30 py-2.5 text-xs font-black uppercase text-primary"
              >
                Cancel
              </button>
              <button
                disabled={!guardianOk || respondMut.isPending}
                onClick={() => {
                  setGuardianAsk(false);
                  setGuardianOk(false);
                  respondMut.mutate("accept");
                }}
                className="flex-1 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase text-primary-foreground disabled:opacity-50"
              >
                Confirm &amp; accept
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

function SidePanel({
  heading,
  images,
  owner,
  onViewInventory,
  onAdd,
  onRemove,
}: {
  heading: string;
  images: Img[];
  owner: { username: string; display_name: string } | null | undefined;
  onViewInventory?: () => void;
  onAdd?: () => void;
  onRemove?: (img: Img) => void;
}) {

  return (
    <section className="min-w-0 rounded-3xl border-2 border-primary/20 bg-card p-4 shadow-card">
      <p className="mb-3 text-center text-[11px] font-black uppercase tracking-wider text-primary">{heading}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {images.length === 0 && (
          <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-dashed border-primary/30 text-xs text-muted-foreground">
            None
          </div>
        )}
        {images.map((img, i) => {
          const tile = (
            <div
              className={`relative grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border-2 bg-primary-soft text-3xl ${
                img.removed ? "border-destructive/50 opacity-60" : "border-primary/20"
              }`}
            >
              {img.src ? (
                <img src={img.src} alt={img.name} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-8 w-8 text-primary/50" />
              )}
              {img.removed && (
                <span className="absolute inset-0 grid place-items-center bg-destructive/20 text-destructive">
                  <X className="h-8 w-8" />
                </span>
              )}
            </div>
          );
          return (
            <div key={img.id ?? i} className="relative w-20">
              {img.to ? (
                img.to.kind === "item" ? (
                  <Link to="/items/$id" params={{ id: img.to.id }} title={`View ${img.name}`}>
                    {tile}
                  </Link>
                ) : (
                  <Link to="/listings/$id" params={{ id: img.to.id }} title={`View ${img.name}`}>
                    {tile}
                  </Link>
                )
              ) : (
                tile
              )}
              {onRemove && img.canRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(img)}
                  title={img.removed ? "Add back to the trade" : "Remove from the trade"}
                  aria-label={img.removed ? `Add ${img.name} back to the trade` : `Remove ${img.name} from the trade`}
                  className={`absolute -right-1.5 -top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full border-2 border-card text-white shadow-card ${
                    img.removed ? "bg-primary" : "bg-destructive"
                  }`}
                >
                  {img.removed ? <Plus className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                </button>
              )}
              <p
                className={`mt-1 truncate text-xs font-semibold ${
                  img.removed ? "text-destructive line-through" : ""
                }`}
              >
                {img.name}
              </p>
            </div>
          );
        })}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            title="Add an item from your inventory"
            aria-label="Add an item from your inventory"
            className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary-soft"
          >
            <Plus className="h-7 w-7" />
          </button>
        )}
      </div>

      {owner && (
        <Link
          to="/profile/$username"
          params={{ username: owner.username }}
          className="mt-2 block text-center text-xs font-medium text-primary hover:underline"
        >
          {handle(owner)}
        </Link>
      )}
      {onViewInventory && (
        <button
          onClick={onViewInventory}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary/30 py-2 text-[11px] font-black uppercase text-primary hover:bg-primary-soft"
        >
          <Package className="h-3.5 w-3.5" /> View inventory
        </button>
      )}
    </section>
  );
}

function MeetupCard({
  p,
  myId,
  fromUser,
  toUser,
  onRespond,
  onSafety,
}: {
  p: any;
  myId: string | null;
  fromUser: string;
  toUser: string;
  onRespond: (action: "accept" | "reject" | "cancel") => void;
  onSafety: () => void;
}) {
  const mine = p.proposed_by === myId;
  const confirmedBy = ((p.safety_confirmed_by ?? []) as string[]).filter(Boolean);
  const bothSafe = confirmedBy.includes(fromUser) && confirmedBy.includes(toUser);
  const iConfirmed = myId ? confirmedBy.includes(myId) : false;
  const statusColor =
    p.status === "accepted"
      ? bothSafe
        ? "border-primary/40 bg-primary-soft"
        : "border-yellow-500/40 bg-yellow-50"
      : p.status === "pending"
        ? "border-yellow-500/40 bg-yellow-50"
        : "border-border bg-muted";

  return (
    <div className={`rounded-2xl border-2 p-3 text-sm ${statusColor}`}>
      <p className="flex items-center gap-1 text-[10px] font-black uppercase text-muted-foreground">
        <Calendar className="h-3 w-3" />
        Meetup {p.status === "accepted" && !bothSafe ? "awaiting safety confirmation" : p.status}
      </p>
      <p className="mt-1 flex items-center gap-1 font-bold">
        <MapPin className="h-3 w-3" /> {p.place}
      </p>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" /> {new Date(p.meet_at).toLocaleString()}
      </p>
      {p.note && <p className="mt-1 text-xs italic">"{p.note}"</p>}

      {p.status === "pending" && (
        <div className="mt-2 flex gap-2">
          {mine ? (
            <button
              onClick={() => onRespond("cancel")}
              className="flex-1 rounded-full border border-muted-foreground/30 px-3 py-1 text-xs font-bold text-muted-foreground"
            >
              Cancel
            </button>
          ) : (
            <>
              <button
                onClick={() => onRespond("accept")}
                className="flex-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
              >
                Accept
              </button>
              <button
                onClick={() => onRespond("reject")}
                className="flex-1 rounded-full border border-destructive/40 px-3 py-1 text-xs font-bold text-destructive"
              >
                Reject
              </button>
            </>
          )}
        </div>
      )}

      {p.status === "accepted" && (
        <div className="mt-2 space-y-2">
          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              checked={iConfirmed}
              disabled={iConfirmed}
              onChange={() => onSafety()}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              I will only meet in a public place and I am responsible for my own safety during this trade.
            </span>
          </label>
          <div className="flex flex-wrap gap-3 text-[11px] font-bold">
            <span className={confirmedBy.includes(fromUser) ? "text-primary flex items-center gap-1" : "text-muted-foreground flex items-center gap-1"}>
              <span className={`h-1.5 w-1.5 rounded-full ${confirmedBy.includes(fromUser) ? "bg-primary" : "bg-muted-foreground/40"}`} />
              Sender {confirmedBy.includes(fromUser) ? "Confirmed" : "Pending"}
            </span>
            <span className={confirmedBy.includes(toUser) ? "text-primary flex items-center gap-1" : "text-muted-foreground flex items-center gap-1"}>
              <span className={`h-1.5 w-1.5 rounded-full ${confirmedBy.includes(toUser) ? "bg-primary" : "bg-muted-foreground/40"}`} />
              Recipient {confirmedBy.includes(toUser) ? "Confirmed" : "Pending"}
            </span>
          </div>
          {bothSafe && (
            <p className="flex items-center gap-1 text-xs font-black uppercase text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Confirmed
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ProposeMeetup({
  label,
  disabledReason,
  onPropose,
}: {
  label: string;
  disabledReason: string | null;
  onPropose: (p: { place: string; meet_at: string; note: string }) => void;
}) {
  const [place, setPlace] = useState("");
  const [meetAt, setMeetAt] = useState("");
  const [note, setNote] = useState("");

  return (
    <div className="space-y-2 rounded-2xl border-2 border-primary/20 bg-card p-4">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
        <Calendar className="h-4 w-4 text-primary" /> {label}
      </p>
      <input
        value={place}
        onChange={(e) => setPlace(e.target.value)}
        placeholder="Public place (e.g. Dubai Mall entrance)"
        className="w-full rounded-lg border-2 border-primary/20 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary"
      />
      <input
        type="datetime-local"
        value={meetAt}
        onChange={(e) => setMeetAt(e.target.value)}
        className="w-full rounded-lg border-2 border-primary/20 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note"
        rows={2}
        maxLength={500}
        className="w-full resize-none rounded-lg border-2 border-primary/20 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary"
      />
      <button
        disabled={!!disabledReason}
        onClick={() => {
          if (!place || !meetAt) return toast.error("Place and time required");
          onPropose({ place, meet_at: new Date(meetAt).toISOString(), note });
          setPlace("");
          setMeetAt("");
          setNote("");
        }}
        className="w-full rounded-full bg-gradient-primary py-2 text-xs font-black uppercase text-primary-foreground disabled:opacity-50"
      >
        Send proposal
      </button>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function InventoryModal({
  ownerId,
  label,
  onClose,
}: {
  ownerId: string;
  label: string;
  onClose: () => void;
}) {
  const fn = useServerFn(listOwnerInventory);
  const { data } = useQuery({
    queryKey: ["owner-inventory", ownerId],
    queryFn: () => fn({ data: { owner_id: ownerId } }),
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = (data ?? []) as any[];

  return (
    <Modal onClose={onClose}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-black">{label}'s inventory</h2>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>
      {rows.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No public items.</p>}
      <div className="space-y-2">
        {rows.map((it) => (
          <div key={it.id} className="rounded-2xl border-2 border-primary/20 p-3">
            <button onClick={() => setOpenId(openId === it.id ? null : it.id)} className="flex w-full items-center gap-3 text-left">
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft text-2xl">
                {it.image_urls?.[0] ? (
                  <img src={it.image_urls[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  it.image_emoji
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{it.name}</p>
                <p className="text-[10px] uppercase text-muted-foreground">
                  {it.category} · {it.condition}
                </p>
              </div>
            </button>
            {openId === it.id && (
              <div className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                <p>{it.description || "No description."}</p>
                {it.image_urls?.length > 1 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                    {it.image_urls.slice(1).map((u: string) => (
                      <img key={u} src={u} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
                <Link to="/items/$id" params={{ id: it.id }} className="mt-2 inline-block font-bold text-primary hover:underline">
                  Open full item page
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}

function AddItemsModal({
  ownerId,
  selected,
  pending,
  onClose,
  onSave,
}: {
  ownerId: string;
  selected: string[];
  pending: boolean;
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const fn = useServerFn(listOwnerInventory);
  const { data } = useQuery({
    queryKey: ["owner-inventory", ownerId],
    queryFn: () => fn({ data: { owner_id: ownerId } }),
  });
  const [ids, setIds] = useState<string[]>(selected);
  const rows = useMemo(() => (data ?? []) as any[], [data]);

  useEffect(() => {
    setIds(selected);
  }, [selected]);

  return (
    <Modal onClose={onClose}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-black">Update your side</h2>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Tick items from your inventory to add them to your side of the trade, or untick to take them out.
      </p>
      <div className="space-y-2">
        {rows.map((it) => {
          const on = ids.includes(it.id);
          return (
            <label
              key={it.id}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 ${
                on ? "border-primary bg-primary-soft" : "border-primary/20"
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => setIds(on ? ids.filter((x) => x !== it.id) : [...ids, it.id])}
                className="h-4 w-4 accent-primary"
              />
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft text-xl">
                {it.image_urls?.[0] ? (
                  <img src={it.image_urls[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  it.image_emoji
                )}
              </div>
              <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${!on && selected.includes(it.id) ? "text-destructive line-through" : ""}`}>
                {it.name}
              </span>
            </label>
          );
        })}
        {rows.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No items available.</p>}
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={onClose} className="flex-1 rounded-full border-2 border-primary/30 py-2.5 text-xs font-black uppercase text-primary">
          Cancel
        </button>
        <button
          disabled={ids.length === 0 || pending}
          onClick={() => onSave(ids)}
          className="flex-1 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase text-primary-foreground disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
