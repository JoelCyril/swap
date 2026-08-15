import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyUser } from "./notifications.server";

export const listMeetupProposals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { offer_id: string }) => z.object({ offer_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("meetup_proposals")
      .select("*")
      .eq("offer_id", data.offer_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const proposeMeetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        offer_id: z.string().uuid(),
        place: z.string().min(2).max(200),
        meet_at: z.string().datetime(),
        note: z.string().max(500).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: offer, error: oerr } = await context.supabase
      .from("offers")
      .select("id, from_user, to_user, status")
      .eq("id", data.offer_id)
      .maybeSingle();
    if (oerr || !offer) throw new Error("Offer not found");
    if (offer.status !== "accepted") throw new Error("Offer must be accepted first");

    // Supersede any pending proposals for this offer
    await context.supabase
      .from("meetup_proposals")
      .update({ status: "countered" })
      .eq("offer_id", data.offer_id)
      .eq("status", "pending");

    const { data: row, error } = await context.supabase
      .from("meetup_proposals")
      .insert({
        offer_id: data.offer_id,
        proposed_by: context.userId,
        place: data.place,
        meet_at: data.meet_at,
        note: data.note,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const otherUser = offer.from_user === context.userId ? offer.to_user : offer.from_user;
    await notifyUser({
      userId: otherUser,
      type: "meetup_proposed",
      title: "New meetup proposal",
      body: `${data.place} · ${new Date(data.meet_at).toLocaleString()}`,
      link: `/offers/${data.offer_id}`,
    });
    return row;
  });

export const respondMeetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["accept", "reject", "cancel"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: prop, error: perr } = await context.supabase
      .from("meetup_proposals")
      .select("*, offer:offers(id, from_user, to_user)")
      .eq("id", data.id)
      .maybeSingle();
    if (perr || !prop) throw new Error("Proposal not found");
    const offer = prop.offer as { id: string; from_user: string; to_user: string };

    const nextStatus =
      data.action === "accept" ? "accepted" : data.action === "reject" ? "rejected" : "cancelled";

    // Only the OTHER party can accept/reject; proposer can cancel their own
    if ((data.action === "accept" || data.action === "reject") && prop.proposed_by === context.userId) {
      throw new Error("You cannot respond to your own proposal");
    }
    if (data.action === "cancel" && prop.proposed_by !== context.userId) {
      throw new Error("Only the proposer can cancel");
    }

    const { error } = await context.supabase
      .from("meetup_proposals")
      .update({ status: nextStatus })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    const notifyId =
      data.action === "cancel"
        ? offer.from_user === context.userId ? offer.to_user : offer.from_user
        : prop.proposed_by;
    await notifyUser({
      userId: notifyId,
      type: `meetup_${nextStatus}`,
      title:
        nextStatus === "accepted"
          ? "Meetup confirmed"
          : nextStatus === "rejected"
            ? "Meetup rejected"
            : "Meetup cancelled",
      body: `${prop.place} · ${new Date(prop.meet_at).toLocaleString()}`,
      link: `/offers/${offer.id}`,
    });

    if (nextStatus === "accepted") {
      // Not locked in yet — both people must tick the safety box first.
      await context.supabase
        .from("meetup_proposals")
        .update({ safety_confirmed_by: [] })
        .eq("id", data.id);
    }
    return { ok: true, status: nextStatus };
  });

/** Each participant individually confirms the public-place safety agreement. */
export const confirmMeetupSafety = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: prop, error: perr } = await context.supabase
      .from("meetup_proposals")
      .select("*, offer:offers(id, from_user, to_user)")
      .eq("id", data.id)
      .maybeSingle();
    if (perr || !prop) throw new Error("Proposal not found");
    if (prop.status !== "accepted") throw new Error("Meetup is not accepted yet");
    const offer = prop.offer as { id: string; from_user: string; to_user: string };

    const current = ((prop.safety_confirmed_by ?? []) as string[]).filter(Boolean);
    const next = Array.from(new Set([...current, context.userId]));
    const { error } = await context.supabase
      .from("meetup_proposals")
      .update({ safety_confirmed_by: next })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    const both = next.includes(offer.from_user) && next.includes(offer.to_user);
    if (both) {
      await context.supabase
        .from("offers")
        .update({ meetup_at: prop.meet_at, meetup_location: prop.place })
        .eq("id", offer.id);
    }
    const other = offer.from_user === context.userId ? offer.to_user : offer.from_user;
    await notifyUser({
      userId: other,
      type: both ? "meetup_confirmed" : "meetup_safety",
      title: both ? "Meetup confirmed" : "Safety confirmation received",
      body: both
        ? `${prop.place} · ${new Date(prop.meet_at).toLocaleString()}`
        : "Tick your safety box to confirm the meetup.",
      link: `/offers/${offer.id}`,
    });
    return { ok: true, both };
  });

