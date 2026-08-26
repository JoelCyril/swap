import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getTermsStatus, acceptTerms, checkUsername } from "@/lib/terms.functions";
import { ScrollText, AlertTriangle, UserRound } from "lucide-react";
import { EMIRATES } from "@/lib/db-types";
import { toast } from "sonner";

const POINTS = [
  "You must be atleast 13 years old to use SWAP.",
  "By accessing, browsing, registering for, or otherwise utilizing the SWAP website, application, application programming interfaces, or any associated digital services provided by the platform (collectively referred to as the \"Service\"), you formally acknowledge that you have read, understood, and unconditionally agree to be bound by these comprehensive Terms of Service. These terms constitute a legally binding agreement between you, whether personally or on behalf of an entity, and the creators, maintainers, and operators of SWAP. Your continuous engagement with any component of our digital architecture—including but not limited to the interactive browse feeds, user inventory management systems, real-time messaging modules, meetup negotiation protocols, or administrative dashboards—constitutes your ongoing consent to abide by every clause, restriction, guideline, and stipulation outlined herein. If you do not agree with all or any part of these terms, you are strictly prohibited from utilizing the Service and must immediately cease all access, delete your account profile, and remove any locally cached data or application binaries associated with the ecosystem. Furthermore, your use of the platform indicates your ongoing warranty that you possess the full legal capacity, authority, and competence to enter into this agreement under the laws and regulations applicable within your local jurisdiction.",
  "SWAP is engineered and operated exclusively as a localized digital community venue designed to facilitate the peer-to-peer barter, exchange, and trade of personal, pre-owned items directly between individual users without the mediation of cash transactions, monetary exchanges, or commercial commerce. It is of paramount importance to explicitly understand that SWAP does not function as a traditional retail merchant, commercial broker, licensed auctioneer, professional shipping provider, or inspecting authority. We do not manufacture, store, curate, test, verify, or physically handle any of the personal belongings, objects, or assets listed within user inventories or public marketplace feeds. Consequently, SWAP completely disclaims any and all explicit or implicit warranties regarding the legal ownership, authenticity, merchantability, safety, structural integrity, functional reliability, or fitness for a particular purpose of any item listed, negotiated, or exchanged through our platform. All trades, swaps, exchanges, and concurrent interactions executed by users are conducted entirely at their own independent discretion and risk. SWAP exercises no physical control over the quality, legality, condition, or description of items posted by community members, nor do we guarantee that any offered trade will successfully reach a mutually satisfactory conclusion or that any user will genuinely complete an agreed-upon exchange.",
  "To access and utilize the core functionalities of the SWAP platform, you must complete the account registration process by providing accurate, current, and complete information, including a valid email address, a unique username, your real legal name, and a neighborhood-level geographic location within your municipal region. You represent and warrant that you are at least eighteen (18) years of age or possess legal majority status in your jurisdiction, and that you possess the full legal right and capability to enter into a binding agreement. You are entirely and exclusively responsible for maintaining the absolute confidentiality of your account credentials, password hashes, session tokens, and any single-use administrative privilege escalation codes issued to you. You agree to accept full responsibility for all activities, actions, posts, listings, offers, and communications that occur under your registered user profile, regardless of whether such activities were authorized by you. In the event of any unauthorized access, security breach, credential compromise, or suspicious activity detected on your account, you must immediately notify the platform administrators so that appropriate containment measures can be initiated. SWAP reserves the absolute right to suspend, freeze, or permanently terminate any user account that displays abnormal behavioral patterns, utilizes automated scraping or bot infrastructure, or violates our account security protocols without prior notice or liability.",
  "The platform provides a flexible inventory system allowing users to catalog personal possessions, define global and item-level visibility settings (toggling between public marketplace visibility and private status), and attach media files such as high-resolution photographs or short video clips to accurately represent item conditions. By uploading, publishing, or otherwise transmitting any images, videos, text, descriptions, or metadata to your inventory or public listings, you explicitly warrant that you are the lawful owner or authorized licensee of all such media content, and that your uploads do not infringe upon, misappropriate, or violate the copyright, trademark, privacy rights, publicity rights, or intellectual property rights of any third party. You agree that you will not upload, post, or distribute any media containing graphic violence, explicit adult content, copyrighted material belonging to others, malicious software payloads, or personally identifiable information of third parties. SWAP maintains a strict policy against misleading representations; you are legally bound to provide entirely truthful, accurate, and transparent descriptions of your items, including any notable defects, structural wear, or operational limitations. The platform reserves the unconditional right to review, flag, modify, blur, or permanently delete any media attachment or inventory item that violates these visual and descriptive standards or contravenes community safety guidelines.",
  "SWAP has been conceptualized, designed, developed, and deployed strictly as an academic student project for educational, instructional, portfolio, and non-commercial developmental purposes. By accessing, navigating, or utilizing this Service in any capacity, you explicitly acknowledge, accept, and agree that the application, its codebase, its database schemas, and its auxiliary infrastructure are provided on a strict \"as-is\" and \"as-available\" basis, completely devoid of any warranties, guarantees, or operational assurances of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. You hereby acknowledge that because this platform is maintained by students as an academic portfolio initiative, it may experience unexpected downtime, security vulnerabilities, data synchronization delays, feature deprecations, or data loss. You explicitly covenant and agree that the student developers, project authors, contributors, evaluators, and any associated educational institutions, universities, or academic entities shall bear absolutely no liability whatsoever for any direct, indirect, incidental, special, punitive, or consequential damages—including financial loss, emotional distress, physical injury, property damage, data corruption, or system failure—arising out of or in any way connected with your use of the platform, the failure of the system to process transactions, the behavior of other platform users, or any real-world encounters resulting from online negotiations. You hereby irrevocably and unconditionally waive any and all legal claims, demands, causes of action, or potential lawsuits against the student developers and their affiliated academic institutions, releasing them from any legal responsibility, liability, or financial recourse arising from your participation in the SWAP ecosystem.",
  "SWAP empowers its community with an integrated reporting mechanism enabling users to instantly flag suspicious, fraudulent, or inappropriate listings, which immediately removes the flagged content from the reporting user's personal view and routes it directly into the administrative moderation queue for professional review. Additionally, the platform features a secure administrative escalation workflow utilizing single-use, cryptographically hashed admin invitation codes redeemed through user settings to grant verified administrative privileges. Designated administrators possess the sovereign authority to review reported listings, dismiss unfounded reports, unpublish offending content, and issue administrative sanctions or account bans. You agree not to abuse the reporting system by submitting false, malicious, or retaliatory flags against innocent users or legitimate listings. Furthermore, any attempt to compromise, bypass, reverse-engineer, or brute-force the administrative code redemption mechanism will be treated as a severe security violation, resulting in immediate legal reporting, IP address blacklisting, and permanent account obliteration across all connected system databases.",
  "Moderators may remove listings or suspend accounts that break these rules.",
  "Your privacy is of fundamental importance to our operational philosophy. Our collection, storage, processing, and protection of your personal information—including your real name, email address, neighborhood-level geographic location, inventory catalogs, chat histories, and platform interaction logs—are governed by our comprehensive Privacy Policy, which is incorporated into these Terms of Service by this reference. By registering an account and using the Service, you explicitly consent to the collection and utilization of your neighborhood-level location data for the specific purpose of facilitating local, community-driven item discovery and proximity-based barter matching. While we employ robust industry-standard security protocols, including parameterized database queries, bcrypt password hashing, input sanitization libraries, and strict authorization middleware to safeguard your digital footprint against unauthorized access, you acknowledge that no electronic transmission over the internet or digital storage medium can ever be guaranteed to be 100% secure, and you accept inherent risks associated with online data exposure.",
  "Continued use of SWAP means you accept these terms and any future updates.",
];

/** Forces first-time signed-in members to read the terms and confirm they are 13+. */
export function TosGate({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [guardian, setGuardian] = useState(false);
  const [age, setAge] = useState("");
  const [username, setUsername] = useState("");
  const [taken, setTaken] = useState<boolean | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [profile, setProfile] = useState({
    full_name: "",
    birthday: "",
    emirate: "",
    location: "",
    bio: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const statusFn = useServerFn(getTermsStatus);
  const { data: status } = useQuery({
    queryKey: ["terms-status", userId],
    queryFn: () => statusFn(),
    enabled: !!userId,
  });

  const checkFn = useServerFn(checkUsername);
  const uname = username.trim().toLowerCase();
  const unameValid = /^[a-z0-9_]{3,20}$/.test(uname);

  useEffect(() => {
    if (!unameValid || !userId) {
      setTaken(null);
      return;
    }
    let cancel = false;
    const t = setTimeout(() => {
      checkFn({ data: { username: uname } })
        .then((r) => !cancel && setTaken(!r.available))
        .catch(() => !cancel && setTaken(null));
    }, 350);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [uname, unameValid, userId]);

  const acceptFn = useServerFn(acceptTerms);
  const mut = useMutation({
    mutationFn: () =>
      acceptFn({
        data: {
          age: Number(age),
          username: uname,
          full_name: profile.full_name.trim() || null,
          birthday: profile.birthday || null,
          emirate: profile.emirate || null,
          location: profile.location.trim() || null,
          bio: profile.bio.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Welcome to SWAP", { description: `Your username is @${uname}` });
      qc.invalidateQueries({ queryKey: ["terms-status", userId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  if (!userId || !status || status.accepted) return <>{children}</>;

  const ageNum = Number(age);
  const tooYoung = age !== "" && ageNum > 0 && ageNum < 13;
  const minor = ageNum >= 13 && ageNum < 18;
  const canSubmit = unameValid && taken === false && checked && ageNum >= 13 && ageNum <= 120 && (!minor || guardian);

  const field =
    "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary";

  if (step === 2) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 py-8">
        <div className="w-full max-w-lg rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card sm:p-8">
          <h1 className="font-display text-2xl font-black flex items-center gap-2 sm:text-3xl">
            <UserRound className="h-6 w-6 text-primary" /> Set up your profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You're @{uname}. Tell neighbours a little about you — you can change all of this later in Settings.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Full name</label>
              <input
                maxLength={120}
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="e.g. Aisha Rahman"
                className={field}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Birthday</label>
              <input
                type="date"
                value={profile.birthday}
                onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Emirate</label>
              <select
                value={profile.emirate}
                onChange={(e) => setProfile({ ...profile, emirate: e.target.value })}
                className={field}
              >
                <option value="">Select your emirate</option>
                {EMIRATES.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">General location</label>
              <input
                maxLength={120}
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="e.g. Al Barsha"
                className={field}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Used to show you swaps near you. Never share your exact address.
              </p>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Bio</label>
              <textarea
                rows={3}
                maxLength={500}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="mt-1 w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="mt-5 w-full rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50"
          >
            {mut.isPending ? "Saving…" : "Finish & start swapping"}
          </button>
          <button
            onClick={() => setStep(1)}
            className="mt-2 w-full rounded-full py-2 text-xs font-bold uppercase text-muted-foreground hover:text-primary"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-8">
      <div className="w-full max-w-lg rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card sm:p-8">
        <h1 className="font-display text-2xl font-black flex items-center gap-2 sm:text-3xl">
          <ScrollText className="h-6 w-6 text-primary" /> Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Please read and accept before you start swapping.</p>

        <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto rounded-2xl bg-muted p-4 text-sm">
          {POINTS.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{p}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5">
          <label className="text-xs font-bold uppercase text-muted-foreground">Pick your username</label>
          <div className="mt-1 flex items-center gap-2 rounded-full border-2 border-primary/20 bg-white px-4 py-2 focus-within:border-primary">
            <span className="text-sm font-bold text-muted-foreground">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourname"
              maxLength={20}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          {username !== "" && !unameValid && (
            <p className="mt-1 text-xs text-destructive">3-20 characters, letters, numbers and underscores only.</p>
          )}
          {unameValid && taken === true && (
            <p className="mt-1 text-xs font-semibold text-destructive">@{uname} is already taken.</p>
          )}
          {unameValid && taken === false && (
            <p className="mt-1 text-xs font-semibold text-primary">@{uname} is available.</p>
          )}
        </div>

        <div className="mt-4">
          <label className="text-xs font-bold uppercase text-muted-foreground">Your age</label>
          <input
            type="number"
            min={1}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
            placeholder="e.g. 16"
          />
          <p className="mt-2 flex gap-1.5 text-[11px] text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-primary" />
            SWAP is only available to users aged 13 and above. Individuals under the age of 13 are not permitted to use
            this website. Providing false age information may result in permanent suspension of your account. Users
            between the ages of 13 and 17 must obtain parental approval before creating an account and using the
            platform.
          </p>
          {tooYoung && (
            <p className="mt-2 rounded-2xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
              You must be at least 13 years old to use SWAP.
            </p>
          )}
          {minor && (
            <label className="mt-3 flex items-start gap-2 rounded-2xl bg-primary-soft p-3 text-xs">
              <input
                type="checkbox"
                checked={guardian}
                onChange={(e) => setGuardian(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span>
                By checking this box, you confirm that you have obtained permission from a parent or legal guardian to
                use this platform.
              </span>
            </label>
          )}
        </div>

        <label className="mt-4 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>I have read and accept the Terms of Service.</span>
        </label>

        <button
          onClick={() => setStep(2)}
          disabled={!canSubmit}
          className="mt-5 w-full rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50"
        >
          Accept &amp; continue
        </button>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-2 w-full rounded-full py-2 text-xs font-bold uppercase text-muted-foreground hover:text-primary"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
