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
  reportItemsNotReceived,
} from "@/lib/offers.functions";
import { adminMarkTradeCompleted } from "@/lib/admin.functions";



import { listOwnerInventory } from "@/lib/items.functions";
import {
  listMessages,
  sendMessage,
  markMessagesRead,
  editMessage,
  reactToMessage,
} from "@/lib/messages.functions";
import { parseMessageMeta } from "@/lib/messages.meta";
import { extractProfileBadge } from "@/lib/badges";
import {
  listMeetupProposals,
  proposeMeetup,
  respondMeetup,
  confirmMeetupSafety,
} from "@/lib/meetups.functions";
import { getTermsStatus } from "@/lib/terms.functions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  Smile,
  Pencil,
  AlertTriangle,
  ChevronDown,
  Reply,
  Copy,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const EXTRA_EMOJIS = ["🔥", "👏", "🎉", "💯", "🤝", "😍", "🥳", "👀"];

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
  const reportNotReceived = useServerFn(reportItemsNotReceived);
  const adminMarkComplete = useServerFn(adminMarkTradeCompleted);

  const [notReceivedOpen, setNotReceivedOpen] = useState(false);
  const [complaintText, setComplaintText] = useState("");

  const list = useServerFn(listMessages);
  const markRead = useServerFn(markMessagesRead);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingChan = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentTyping = useRef(0);
  const send = useServerFn(sendMessage);
  const editMsg = useServerFn(editMessage);
  const reactMsg = useServerFn(reactToMessage);
  const listProposals = useServerFn(listMeetupProposals);
  const propose = useServerFn(proposeMeetup);
  const respondProp = useServerFn(respondMeetup);
  const confirmSafety = useServerFn(confirmMeetupSafety);

  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: string; body: string } | null>(null);
  const [activeReactionMenuMsgId, setActiveReactionMenuMsgId] = useState<string | null>(null);
  const [showExtraEmojisMsgId, setShowExtraEmojisMsgId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const [guardianAsk, setGuardianAsk] = useState(false);
  const [guardianOk, setGuardianOk] = useState(false);
  const [inventoryOf, setInventoryOf] = useState<{ id: string; label: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const termsFn = useServerFn(getTermsStatus);
  const { data: terms } = useQuery({ queryKey: ["terms-status"], queryFn: () => termsFn() });
  const isMinor = typeof terms?.age === "number" && terms.age < 18;

  const { data: offer, error: offerError, isPending: offerPending } = useQuery({
    queryKey: ["offer", id],
    queryFn: () => get({ data: { id } }),
  });

  const viewerId = (offer as { viewer_id?: string } | undefined)?.viewer_id;
  const isParticipant = !!offer && (viewerId === offer.from_user || viewerId === offer.to_user);

  const { data: messages } = useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      if (!isParticipant) return [];
      const serverMsgs = await list({ data: { offer_id: id } });
      const currentCache = qc.getQueryData<any[]>(["messages", id]);
      if (!Array.isArray(currentCache) || currentCache.length === 0) return serverMsgs;
      const cacheById = new Map(currentCache.map((m: any) => [m.id, m]));
      return (serverMsgs ?? []).map((sm: any) => {
        const cached = cacheById.get(sm.id);
        if (!cached) return sm;
        const smHasReactions = sm.reactions && Object.keys(sm.reactions).length > 0;
        return {
          ...sm,
          reactions: smHasReactions ? sm.reactions : (cached.reactions || sm.reactions),
          edited_at: sm.edited_at || cached.edited_at,
        };
      });
    },
    enabled: isParticipant,
    refetchInterval: isParticipant ? 4000 : false,
  });
  const { data: proposals } = useQuery({
    queryKey: ["meetup-proposals", id],
    queryFn: () => listProposals({ data: { offer_id: id } }),
    enabled: offer?.status === "accepted" || offer?.status === "completed",
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!isParticipant) return;
    const channel = supabase
      .channel(`offer-${id}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (!payload || payload.userId === viewerId) return;
        setOtherTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setOtherTyping(false), 3000);
      })
      .on("broadcast", { event: "message_reaction" }, ({ payload }) => {
        if (!payload) return;
        qc.setQueryData(["messages", id], (current: any) => {
          const messages = Array.isArray(current) ? current : [];
          return messages.map((m: any) =>
            m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m
          );
        });
      })
      .on("broadcast", { event: "message_edited" }, ({ payload }) => {
        if (!payload) return;
        qc.setQueryData(["messages", id], (current: any) => {
          const messages = Array.isArray(current) ? current : [];
          return messages.map((m: any) =>
            m.id === payload.messageId ? { ...m, body: payload.body, edited_at: payload.edited_at } : m
          );
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `offer_id=eq.${id}` }, (payload) => {
        qc.setQueryData(["messages", id], (current: any) => {
          const messages = Array.isArray(current) ? current : [];
          if (payload.eventType === "INSERT") {
            const message = parseMessageMeta(payload.new as any);
            return messages.some((item: any) => item.id === message.id) ? messages : [...messages, message];
          }
          if (payload.eventType === "UPDATE") {
            const updated = parseMessageMeta(payload.new as any);
            return messages.map((item: any) => {
              if (item.id !== updated.id) return item;
              const hasReactions = updated.reactions && Object.keys(updated.reactions).length > 0;
              return {
                ...item,
                ...updated,
                reactions: hasReactions ? updated.reactions : (item.reactions || updated.reactions),
                edited_at: updated.edited_at || item.edited_at,
              };
            });
          }
          if (payload.eventType === "DELETE") {
            return messages.filter((item: any) => item.id !== (payload.old as any)?.id);
          }
          return messages;
        });
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
  }, [id, qc, viewerId, isParticipant]);

  // Mark the other side's messages as read whenever we see them.
  useEffect(() => {
    if (!isParticipant || !messages || messages.length === 0) return;
    const unread = (messages as { sender_id: string; read_at: string | null }[]).some(
      (m) => m.sender_id !== viewerId && !m.read_at,
    );
    if (unread) markRead({ data: { offer_id: id } }).catch(() => {});
  }, [messages, viewerId, id, markRead, isParticipant]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, proposals]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["offer", id] });
    qc.invalidateQueries({ queryKey: ["offers"] });
    qc.invalidateQueries({ queryKey: ["my-offers"] });
    qc.invalidateQueries({ queryKey: ["pending-incoming-offers"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
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

  const adminCompleteMut = useMutation({
    mutationFn: () => adminMarkComplete({ data: { offerId: id } }),
    onSuccess: () => {
      invalidateAll();
      toast.success("Trade marked as completed by Admin");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to complete trade"),
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

  const notReceivedMut = useMutation({
    mutationFn: () => reportNotReceived({ data: { id, complaint: complaintText.trim() || undefined } }),
    onSuccess: (res: any) => {
      invalidateAll();
      setNotReceivedOpen(false);
      setComplaintText("");
      toast.success(res?.message || "Trade cancelled. Listing returned to browse feed.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to cancel trade"),
  });

  const safetyMut = useMutation({
    mutationFn: (pid: string) => confirmSafety({ data: { id: pid } }),
    onSuccess: () => invalidateAll(),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const sendMut = useMutation({
    mutationFn: async () => {
      return send({ data: { offer_id: id, body: text.trim(), attachment_urls: [], reply_to_id: replyTo?.id ?? null } });
    },
    onSuccess: (message: any) => {
      setText("");
      setReplyTo(null);
      // The server response is the newly-created message, so show it immediately
      // instead of waiting for the next poll or Realtime round trip.
      qc.setQueryData(["messages", id], (current: any) => {
        const messages = Array.isArray(current) ? current : [];
        return messages.some((item: any) => item.id === message.id) ? messages : [...messages, message];
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Message not sent"),
  });

  const editMut = useMutation({
    mutationFn: ({ message_id, body }: { message_id: string; body: string }) =>
      editMsg({ data: { message_id, body } }),
    onSuccess: (updated: any) => {
      setEditingMessage(null);
      setText("");
      qc.setQueryData(["messages", id], (current: any) => {
        const messages = Array.isArray(current) ? current : [];
        return messages.map((m: any) =>
          m.id === updated.id ? { ...m, body: updated.body, edited_at: updated.edited_at } : m,
        );
      });
      typingChan.current?.send({
        type: "broadcast",
        event: "message_edited",
        payload: { messageId: updated.id, body: updated.body, edited_at: updated.edited_at },
      });
      toast.success("Message edited");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to edit message"),
  });

  const reactMut = useMutation({
    mutationFn: ({ message_id, emoji }: { message_id: string; emoji: string }) =>
      reactMsg({ data: { message_id, emoji } }),
    onSuccess: (res: any) => {
      setActiveReactionMenuMsgId(null);
      setShowExtraEmojisMsgId(null);
      qc.setQueryData(["messages", id], (current: any) => {
        const messages = Array.isArray(current) ? current : [];
        return messages.map((m: any) =>
          m.id === res.message_id ? { ...m, reactions: res.reactions } : m,
        );
      });
      typingChan.current?.send({
        type: "broadcast",
        event: "message_reaction",
        payload: { messageId: res.message_id, reactions: res.reactions },
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to react"),
  });

  if (offerPending) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="p-8 text-center text-muted-foreground">Loading offer…</div>
      </div>
    );
  }

  if (offerError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-lg p-8 text-center">
          <h1 className="font-display text-2xl font-black">Could not load offer</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {offerError instanceof Error ? offerError.message : "Something went wrong while loading this offer."}
          </p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="p-8 text-center text-muted-foreground">Offer not found.</div>
      </div>
    );
  }

  const myId = offer.viewer_id;
  const isTo = offer.to_user === myId;
  const other = isTo ? offer.from_profile : offer.to_profile;
  const canAct = offer.status === "pending";
  const accepted = offer.status === "accepted";
  const chatOpen = offer.status !== "declined" && offer.status !== "withdrawn";

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
            <h1 className="font-display text-xl font-black sm:text-2xl">
              {isParticipant
                ? `Trade with ${handle(other)}`
                : `Trade: @${offer.from_profile?.username} ⇄ @${offer.to_profile?.username}`}
            </h1>
            <p className="text-xs text-muted-foreground">
              Status: <span className="font-bold capitalize text-primary">{statusLabel}</span>
            </p>
          </div>
          <span
            className={`rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-wider max-w-full text-center whitespace-normal leading-tight sm:whitespace-nowrap ${
              !accepted || confirmedProposal
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isParticipant ? (
              offer.status === "completed"
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
                      : "Negotiating — adjust items or propose a meetup"
            ) : (
              offer.status === "completed"
                ? "Trade completed"
                : offer.status === "accepted"
                  ? `In Progress (${completeConfirmed.length}/2 confirmed)`
                  : offer.status
            )}
          </span>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,260px)]">
          {/* Left panel (Offered items) */}
          <SidePanel
            heading={isParticipant ? "You give" : `@${offer.from_profile?.username || "Sender"}'s Offered Items`}
            images={isParticipant ? giveImgs : senderImgs}
            owner={isParticipant ? giveOwner : offer.from_profile}
            onAdd={isParticipant && accepted ? () => setAddOpen(true) : undefined}
            onRemove={isParticipant && accepted ? removeImg : undefined}
          />

          {/* Chat */}
          <div className="flex min-w-0 flex-col overflow-hidden rounded-3xl border-2 border-primary/20 bg-card shadow-card h-[70vh] min-h-[420px] lg:h-[640px]">
            <div className="flex items-center gap-3 border-b border-border p-3">
              {isParticipant ? (
                <>
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
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <Link
                      to="/profile/$username"
                      params={{ username: other?.username || "" }}
                      className="text-sm font-bold truncate hover:text-primary transition"
                    >
                      {handle(other)}
                    </Link>
                    {(() => {
                      const partnerBadge = extractProfileBadge((other as any)?.bio);
                      if (!partnerBadge) return null;
                      return (
                        <div
                          className="inline-flex items-center gap-1 rounded-full bg-black/85 backdrop-blur-md border border-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs shrink-0"
                          style={
                            partnerBadge.glowColor
                              ? {
                                  borderColor: partnerBadge.glowColor,
                                  boxShadow: `0 0 10px ${partnerBadge.glowColor}aa`,
                                }
                              : undefined
                          }
                          title={`${partnerBadge.name} - Awarded Profile Badge`}
                        >
                          {partnerBadge.imageUrl && (
                            <img
                              src={partnerBadge.imageUrl}
                              alt=""
                              className="h-3 w-3 rounded-full object-cover shrink-0"
                            />
                          )}
                          <span>{partnerBadge.name}</span>
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="flex items-center -space-x-2 shrink-0">
                    <div
                      className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white border-2 border-background"
                      style={{ backgroundColor: offer.from_profile?.avatar_color ?? "#059669" }}
                    >
                      {(offer.from_profile?.display_name || offer.from_profile?.username || "?")[0].toUpperCase()}
                    </div>
                    <div
                      className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white border-2 border-background"
                      style={{ backgroundColor: offer.to_profile?.avatar_color ?? "#3b82f6" }}
                    >
                      {(offer.to_profile?.display_name || offer.to_profile?.username || "?")[0].toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate text-xs sm:text-sm text-foreground">
                      @{offer.from_profile?.username} ⇄ @{offer.to_profile?.username}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Admin Trade Inspection</p>
                  </div>
                </div>
              )}
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

            {!isParticipant ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-card/40">
                <div className="h-16 w-16 rounded-3xl bg-primary/10 border-2 border-primary/20 text-primary flex items-center justify-center mb-4 shadow-sm">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="font-display text-lg font-black text-foreground">
                  Private Trade Chat
                </h3>
                <p className="mt-2 text-xs text-muted-foreground max-w-sm leading-relaxed">
                  Chat messages and private negotiation texts are strictly confidential between the trading parties (<strong>@{offer.from_profile?.username}</strong> & <strong>@{offer.to_profile?.username}</strong>).
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-3.5 py-1.5 text-[11px] font-bold text-muted-foreground border border-border/60">
                  <span>🔒</span> Text chat is hidden from administrators
                </div>
              </div>
            ) : (
              <div
                ref={scrollRef}
                onClick={() => {
                  setActiveReactionMenuMsgId(null);
                  setShowExtraEmojisMsgId(null);
                }}
                className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-4"
              >
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
                    const m = entry.data as any;
                    const mine = m.sender_id === myId;
                    const referenced = m.reply_to as { body?: string; attachment_urls?: string[] } | null | undefined;
                    const reactions = (m.reactions ?? {}) as Record<string, string[]>;
                    const hasReactions = Object.values(reactions).some((arr) => arr && arr.length > 0);
                    const isReactionMenuOpen = activeReactionMenuMsgId === m.id;
                    const showExtra = showExtraEmojisMsgId === m.id;
                    return (
                      <div
                        key={m.id}
                        className={`group/msg relative flex flex-col mb-1.5 w-full min-w-0 ${mine ? "items-end" : "items-start"}`}
                      >
                        {/* WhatsApp-style Floating Reaction & Action Bar */}
                        {isReactionMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute -top-11 ${
                              mine ? "right-0 sm:right-2" : "left-0 sm:left-2"
                            } z-30 flex max-w-[calc(100vw-2.5rem)] items-center gap-1 rounded-full bg-card/95 backdrop-blur-md px-2 py-1 border-2 border-primary/25 shadow-xl animate-in fade-in zoom-in-95 duration-150 touch-manipulation overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
                          >
                            {QUICK_EMOJIS.map((emoji) => {
                              const isSelected = (reactions[emoji] ?? []).includes(myId as string);
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    reactMut.mutate({ message_id: m.id, emoji });
                                  }}
                                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-base transition-transform hover:scale-130 active:scale-95 cursor-pointer touch-manipulation ${
                                    isSelected ? "bg-primary-soft scale-115" : "hover:bg-muted"
                                  }`}
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowExtraEmojisMsgId((prev) => (prev === m.id ? null : m.id));
                              }}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground text-xs font-bold transition cursor-pointer touch-manipulation"
                              title="More emojis"
                            >
                              {showExtra ? "✕" : "+"}
                            </button>

                            <div className="h-4 w-px bg-border/60 mx-0.5 shrink-0" />

                            {/* Reply button inside menu */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyTo(m);
                                setActiveReactionMenuMsgId(null);
                                requestAnimationFrame(() => messageInputRef.current?.focus());
                              }}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-primary-soft hover:text-primary active:scale-95 transition cursor-pointer touch-manipulation"
                              title="Reply"
                            >
                              <Reply className="h-3.5 w-3.5" />
                            </button>

                            {/* Edit button inside menu (for sender) */}
                            {mine && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMessage({ id: m.id, body: m.body });
                                  setText(m.body);
                                  setActiveReactionMenuMsgId(null);
                                  requestAnimationFrame(() => messageInputRef.current?.focus());
                                }}
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-primary-soft hover:text-primary active:scale-95 transition cursor-pointer touch-manipulation"
                                title="Edit message"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Copy button inside menu */}
                            {m.body && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard?.writeText(m.body);
                                  toast.success("Copied to clipboard");
                                  setActiveReactionMenuMsgId(null);
                                }}
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-primary-soft hover:text-primary active:scale-95 transition cursor-pointer touch-manipulation"
                                title="Copy text"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Extra Emojis popover */}
                            {showExtra && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute top-11 ${
                                  mine ? "right-0" : "left-0"
                                } z-40 flex flex-wrap gap-1 rounded-2xl bg-card/95 backdrop-blur-md p-2 border-2 border-primary/20 shadow-2xl max-w-[200px] animate-in fade-in touch-manipulation`}
                              >
                                {EXTRA_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      reactMut.mutate({ message_id: m.id, emoji });
                                    }}
                                    className="grid h-8 w-8 place-items-center rounded-full text-base transition-transform hover:scale-130 active:scale-95 cursor-pointer hover:bg-muted touch-manipulation"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bubble Row with hover/mobile actions */}
                        <div
                          className={`flex items-end gap-1.5 max-w-[88%] sm:max-w-[75%] min-w-0 ${
                            mine ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          {/* The Message Bubble (tap on mobile opens actions & reactions) */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveReactionMenuMsgId((prev) => (prev === m.id ? null : m.id));
                            }}
                            className={`relative min-w-0 max-w-full rounded-2xl px-4 py-2 text-sm shadow-2xs transition cursor-pointer select-text active:scale-[0.99] touch-manipulation ${
                              mine
                                ? "bg-gradient-primary text-primary-foreground rounded-tr-xs"
                                : "bg-muted text-foreground rounded-tl-xs"
                            }`}
                          >
                            {referenced && (
                              <div
                                className={`mb-1.5 border-l-2 px-2 py-1 text-xs rounded min-w-0 max-w-full overflow-hidden ${
                                  mine
                                    ? "border-primary-foreground/60 bg-primary-foreground/10 text-primary-foreground/80"
                                    : "border-primary/60 bg-background/50 text-muted-foreground"
                                }`}
                              >
                                <p className="truncate block max-w-full overflow-hidden">
                                  {referenced.body ||
                                    (referenced.attachment_urls?.filter((u: string) => !u.startsWith("__meta__:")).length
                                      ? "Attachment"
                                      : "Message unavailable")}
                                </p>
                              </div>
                            )}
                            {m.body && (
                              <p className="break-words whitespace-pre-wrap [overflow-wrap:anywhere]">
                                {m.body}
                              </p>
                            )}

                            {(() => {
                              const attachments = ((m as { attachment_urls?: string[] }).attachment_urls ?? []).filter(
                                (u: string) => typeof u === "string" && !u.startsWith("__meta__:"),
                              );
                              if (attachments.length === 0) return null;
                              return (
                                <div className="mt-1 grid gap-1.5">
                                  {attachments.map((u) =>
                                    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u) ? (
                                      <video key={u} src={u} controls className="max-h-56 w-full rounded-xl bg-black" />
                                    ) : (
                                      <a key={u} href={u} target="_blank" rel="noreferrer">
                                        <img src={u} alt="attachment" className="max-h-56 w-full rounded-xl object-cover" />
                                      </a>
                                    ),
                                  )}
                                </div>
                              );
                            })()}

                            {/* Timestamp, Edited indicator, and Seen status */}
                            <div
                              className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${
                                mine ? "text-primary-foreground/75" : "text-muted-foreground"
                              }`}
                            >
                              <span>{timeAgo(m.created_at)}</span>
                              {m.edited_at && (
                                <span className="italic font-medium opacity-90">(edited)</span>
                              )}
                              {mine && <span>· {m.read_at ? "Seen" : "Delivered"}</span>}
                            </div>
                          </div>

                          {/* Quick Action Buttons (shown on hover or when reaction menu is open; on mobile subtle trigger is always accessible) */}
                          <div
                            className={`flex items-center gap-0.5 shrink-0 transition-opacity ${
                              isReactionMenuOpen
                                ? "opacity-100"
                                : "opacity-40 sm:opacity-0 group-hover/msg:opacity-100"
                            }`}
                          >
                            {/* Mobile More trigger */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveReactionMenuMsgId((prev) => (prev === m.id ? null : m.id));
                              }}
                              title="Message options"
                              className="sm:hidden grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted active:scale-95 transition cursor-pointer touch-manipulation"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>

                            {/* Reply button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyTo(m);
                                setActiveReactionMenuMsgId(null);
                                requestAnimationFrame(() => messageInputRef.current?.focus());
                              }}
                              title="Reply to message"
                              className="hidden sm:grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition cursor-pointer touch-manipulation"
                            >
                              <Reply className="h-3.5 w-3.5" />
                            </button>

                            {/* React with emoji button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveReactionMenuMsgId((prev) => (prev === m.id ? null : m.id));
                              }}
                              title="React to message"
                              className="hidden sm:grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition cursor-pointer touch-manipulation"
                            >
                              <Smile className="h-4 w-4" />
                            </button>

                            {/* Edit message button (only for sender) */}
                            {mine && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMessage({ id: m.id, body: m.body });
                                  setText(m.body);
                                  setActiveReactionMenuMsgId(null);
                                  requestAnimationFrame(() => messageInputRef.current?.focus());
                                }}
                                title="Edit message"
                                className="hidden sm:grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition cursor-pointer touch-manipulation"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Copy button on desktop */}
                            {m.body && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard?.writeText(m.body);
                                  toast.success("Copied to clipboard");
                                  setActiveReactionMenuMsgId(null);
                                }}
                                title="Copy text"
                                className="hidden sm:grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition cursor-pointer touch-manipulation"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Reaction Badges / Pills under the bubble */}
                        {hasReactions && (
                          <div className={`mt-1 flex flex-wrap gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                            {Object.entries(reactions).map(([emoji, userIds]) => {
                              if (!userIds || userIds.length === 0) return null;
                              const iReacted = userIds.includes(myId as string);
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => reactMut.mutate({ message_id: m.id, emoji })}
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer ${
                                    iReacted
                                      ? "bg-primary-soft border border-primary/50 text-primary scale-105 font-bold"
                                      : "bg-card border border-border text-foreground hover:bg-muted"
                                  }`}
                                  title={
                                    iReacted
                                      ? `You reacted with ${emoji} (click to remove)`
                                      : `Click to react with ${emoji}`
                                  }
                                >
                                  <span>{emoji}</span>
                                  <span className="text-[10px] text-muted-foreground">{userIds.length}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
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
          )}

          {isParticipant && (
            <div className="border-t border-border p-3">
              {/* Reply Banner */}
              {replyTo && (
                <div className="mb-2 flex items-center gap-2 rounded-xl border-l-2 border-primary bg-primary-soft px-3 py-2 text-xs">
                  <Reply className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="min-w-0 flex-1 truncate">Replying to: {replyTo.body || (replyTo.attachment_urls?.filter((u: string) => !u.startsWith("__meta__:")).length ? "Attachment" : "Message")}</p>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    aria-label="Cancel reply"
                    className="grid h-6 w-6 place-items-center rounded-full hover:bg-background/80 active:scale-95 cursor-pointer touch-manipulation"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Editing Banner */}
              {editingMessage && (
                <div className="mb-2 flex items-center justify-between rounded-2xl bg-primary/10 border border-primary/20 px-3.5 py-1.5 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <Pencil className="h-3.5 w-3.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-primary">Editing message</span>
                      <p className="truncate text-muted-foreground text-[11px] max-w-[280px] sm:max-w-[420px]">
                        {editingMessage.body}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMessage(null);
                      setText("");
                    }}
                    className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground active:scale-95 transition cursor-pointer touch-manipulation"
                    title="Cancel editing (Esc)"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!text.trim()) return;
                  if (editingMessage) {
                    editMut.mutate({ message_id: editingMessage.id, body: text.trim() });
                  } else {
                    sendMut.mutate();
                  }
                }}
                className="flex gap-2"
              >
                <input
                  ref={messageInputRef}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    const now = Date.now();
                    if (chatOpen && !editingMessage && now - lastSentTyping.current > 1500) {
                      lastSentTyping.current = now;
                      typingChan.current?.send({ type: "broadcast", event: "typing", payload: { userId: viewerId } });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && editingMessage) {
                      setEditingMessage(null);
                      setText("");
                    }
                  }}
                  placeholder={
                    editingMessage
                      ? "Edit your message… (press Esc to cancel)"
                      : chatOpen
                      ? "Type a message…"
                      : "Chat locked until the offer is accepted"
                  }
                  maxLength={2000}
                  disabled={!chatOpen}
                  className="min-w-0 flex-1 rounded-full border-2 border-primary/20 bg-background text-foreground px-4 py-2 text-sm outline-none focus:border-primary disabled:opacity-50 transition"
                />
                <button
                  type="submit"
                  disabled={!chatOpen || !text.trim() || sendMut.isPending || editMut.isPending}
                  title={editingMessage ? "Save edit" : "Send message"}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground disabled:opacity-50 transition hover:opacity-90 active:scale-95 cursor-pointer shadow-sm touch-manipulation"
                >
                  {editingMessage ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </div>
          )}
          </div>

          {/* Right panel */}
          <div className="min-w-0 space-y-3">
            <SidePanel
              heading={isParticipant ? "You get" : `@${offer.to_profile?.username || "Recipient"}'s Items`}
              images={isParticipant ? getImgs : [...listingImgs, ...ownerExtraImgs]}
              owner={isParticipant ? getOwner : offer.listing?.owner ?? offer.to_profile}
              onViewInventory={
                isParticipant
                  ? () =>
                      setInventoryOf(
                        isTo
                          ? { id: offer.from_user, label: handle(offer.from_profile) }
                          : { id: offer.to_user, label: handle(offer.to_profile) },
                      )
                  : undefined
              }
            />
            {isParticipant && accepted && (
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
        {isParticipant ? (
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
            {(canAct || accepted) && !isTo && (
              <button
                onClick={() => respondMut.mutate("withdraw")}
                disabled={respondMut.isPending}
                className="flex items-center justify-center gap-2 rounded-full border-2 border-muted-foreground/30 py-2.5 text-sm font-black uppercase text-muted-foreground hover:bg-muted"
              >
                Withdraw
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
                  type="button"
                  onClick={() => setNotReceivedOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-full border-2 border-destructive/30 py-2.5 text-sm font-black uppercase text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <AlertTriangle className="h-4 w-4" /> Items not received
                </button>
              </>
            )}

            {offer.status === "completed" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (!iConfirmedReceived && !bothReceived) receivedMut.mutate();
                  }}
                  disabled={bothReceived || iConfirmedReceived || receivedMut.isPending}
                  className={`flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-black uppercase shadow-sm ${
                    bothReceived
                      ? "bg-emerald-600 text-white cursor-default"
                      : "bg-gradient-primary text-primary-foreground disabled:opacity-50"
                  }`}
                >
                  <Check className="h-4 w-4" />
                  {bothReceived
                    ? "Trade completed"
                    : iConfirmedReceived
                      ? "Receipt confirmed"
                      : "I received the items"}
                </button>
                <button
                  type="button"
                  onClick={() => setNotReceivedOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-full border-2 border-destructive/30 py-2.5 text-sm font-black uppercase text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <AlertTriangle className="h-4 w-4" /> Items not received
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div>
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" /> Moderator Inspection View
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Reviewing trade between @{offer.from_profile?.username} and @{offer.to_profile?.username}. Private messages and chat texts are hidden.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 hover:bg-muted text-foreground px-3.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                ← Back to Admin
              </Link>
              {offer.status !== "completed" && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Mark this trade for "${offer.listing?.title || "Trade"}" as completed?`)) {
                      adminCompleteMut.mutate();
                    }
                  }}
                  disabled={adminCompleteMut.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" /> Mark Completed (Admin)
                </button>
              )}
            </div>
          </div>
        )}

        {isParticipant && (accepted || offer.status === "completed") && (
          <div className="mt-4 space-y-3">
            <p className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary-soft/40 p-4 text-center text-xs font-semibold text-muted-foreground">
              {offer.status === "completed"
                ? bothReceived
                  ? `Swap complete! Both sides confirmed item receipt.`
                  : `Trade marked completed. Both sides must confirm receipt — you: ${
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

      {notReceivedOpen && (
        <ItemsNotReceivedModal
          isOpen={notReceivedOpen}
          onClose={() => setNotReceivedOpen(false)}
          onSubmit={() => notReceivedMut.mutate()}
          isPending={notReceivedMut.isPending}
          complaintText={complaintText}
          setComplaintText={setComplaintText}
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

function ItemsNotReceivedModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  complaintText,
  setComplaintText,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
  complaintText: string;
  setComplaintText: (t: string) => void;
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border-2 border-destructive/30 bg-card p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-destructive">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-black text-foreground">Items Not Received</h3>
              <p className="text-xs text-muted-foreground">Cancel trade & restore listing</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 p-3.5 text-xs space-y-1.5 text-amber-900 dark:text-amber-200">
          <p className="font-bold flex items-center gap-1.5 text-sm text-amber-950 dark:text-amber-100">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            Important Notice on Complaints:
          </p>
          <p className="text-[12px] leading-relaxed">
            Please <strong>ONLY send a complaint to the admins if there was actual malpractice</strong> from the other person (e.g. fraudulent items, no-show after agreement without contact, or bad faith).
          </p>
          <p className="text-[11px] text-muted-foreground">
            Normal peaceful cancellations do not require an admin complaint.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Confirming this will cancel the trade and <strong>immediately return the listing to the main listings page</strong> as active.
        </p>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Optional Report / Complaint to Admins:
          </label>
          <textarea
            rows={3}
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder="Describe any malpractice or violation (leave blank if mutually cancelled)…"
            maxLength={2000}
            className="w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:flex-1 rounded-full border border-border py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-destructive py-2.5 text-xs font-black uppercase tracking-wider text-destructive-foreground hover:opacity-90 transition disabled:opacity-50"
          >
            {isPending ? "Cancelling…" : "Cancel Swap & Return Listing"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
