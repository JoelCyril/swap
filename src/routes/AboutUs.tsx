import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Heart, Leaf, MapPin, Sparkles, Users } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const Route = createFileRoute("/AboutUs")({
  head: () => ({
    meta: [
      { title: "About SWAP UAE | Local, sustainable swapping" },
      { name: "description", content: "Meet SWAP UAE: a free, student-built platform that makes swapping and trading pre-owned items simple, local, and sustainable across the Emirates." },
      { property: "og:title", content: "About SWAP UAE" },
      { property: "og:description", content: "A free, local platform for swapping and trading pre-owned items across the UAE." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://swapuae.com/AboutUs" },
      { property: "og:image", content: "https://swapuae.com/swap-logo.png" },
      { name: "twitter:title", content: "About SWAP UAE" },
      { name: "twitter:description", content: "A free, local platform for swapping and trading pre-owned items across the UAE." },
    ],
    links: [{ rel: "canonical", href: "https://swapuae.com/AboutUs" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "AboutPage", name: "About SWAP UAE", url: "https://swapuae.com/AboutUs", description: "SWAP UAE is a free, community-driven platform for trading, swapping, and exchanging pre-owned items across the Emirates.", mainEntity: { "@type": "Organization", name: "SWAP UAE", url: "https://swapuae.com", description: "A student-built UAE platform that makes local swapping and trading of pre-owned items simple and sustainable." } }) }],
  }),
  component: AboutUsPage,
});

const principles = [
  { icon: MapPin, title: "Made for the UAE", text: "A straightforward local space for people across the Emirates to find what they need nearby." },
  { icon: Heart, title: "Community first", text: "We bring useful items back into circulation and make it easier for neighbours to help one another." },
  { icon: Leaf, title: "Better by reuse", text: "Every swap is a small step toward a more sustainable, less wasteful way to exchange things." },
];

function AboutUsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <section className="relative mx-auto max-w-6xl px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-20">
          <div className="absolute right-[-6rem] top-4 -z-0 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute left-[-8rem] top-36 -z-0 h-56 w-56 rounded-full bg-amber-200/50 blur-3xl dark:bg-primary/10" />
          <div className="relative z-10 max-w-3xl">
            <Link to="/listings" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:-translate-x-1"><ArrowLeft className="h-4 w-4" /> Back to SWAP</Link>
            <p className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary"><Sparkles className="h-4 w-4" /> Built locally, for local people</p>
            <h1 className="max-w-3xl text-5xl font-black text-foreground sm:text-6xl lg:text-7xl">Good things deserve a <span className="text-primary">next story.</span></h1>
            <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">SWAP UAE is a free, homegrown digital platform designed to make trading, swapping, and exchanging pre-owned items simple, sustainable, and community-driven across the Emirates.</p>
            <Link to="/listings" className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-black uppercase tracking-wide text-primary-foreground shadow-glow transition hover:scale-[1.03]">Start exploring <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>

        <section className="border-y border-primary/10 bg-card/75 py-6 backdrop-blur-sm">
          <div className="mx-auto grid max-w-6xl gap-5 px-5 sm:grid-cols-3 sm:px-8">
            {principles.map(({ icon: Icon, title, text }) => <article key={title} className="flex items-start gap-4 rounded-2xl px-3 py-2"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><div><h2 className="text-base font-bold text-foreground">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{text}</p></div></article>)}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-5 py-14 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="rounded-[2rem] border border-primary/15 bg-card p-7 shadow-card sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Who we are</p>
            <h2 className="mt-3 text-3xl font-black text-foreground sm:text-4xl">Built from an idea among friends.</h2>
            <p className="mt-5 text-muted-foreground">We are a tight-knit team of student creators based in the UAE and currently studying at Abu Dhabi Indian School. We started building SWAP because we saw a gap for a clear, local place where people could pass on things they no longer use and find what they need without the clutter of traditional marketplaces.</p>
            <p className="mt-4 text-muted-foreground">What began around a campfire quickly became a fully realised platform built completely from scratch. We build every layer ourselves—from the interface and design to the backend logic and security—so every visit feels fast, reliable, and smooth.</p>
          </div>
          <aside className="rounded-[2rem] bg-gradient-primary p-7 text-primary-foreground shadow-glow sm:p-10">
            <Users className="h-8 w-8" /><p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-white/75">Meet the team</p>
            <div className="mt-5 space-y-4"><TeamMember role="Founder" names="Atul Aiit Nair" /><TeamMember role="Co-founders" names="Abdul Raafay Amaan, Haron Emmanuel, Aqeeb Muhammed Shamim" /><TeamMember role="Lead developers" names="Abdul Raafay Amaan, Haron Emmanuel, and Joel Thomas Cyril" /></div>
          </aside>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24"><div className="rounded-[2rem] border border-primary/15 bg-primary-soft/60 px-7 py-10 sm:px-12 sm:py-14"><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Looking ahead</p><h2 className="mt-3 max-w-3xl text-3xl font-black text-foreground sm:text-4xl">The future of commerce is local, collaborative, and eco-friendly.</h2><p className="mt-5 max-w-3xl text-muted-foreground">As young developers and entrepreneurs growing up in the UAE, we are constantly rolling out updates, refining features, and scaling the platform to better serve our users. Thank you for supporting a project built by local students and for helping us shape a more connected UAE community.</p></div></section>
      </main>
      <Footer />
    </div>
  );
}

function TeamMember({ role, names }: { role: string; names: string }) {
  return <div><p className="text-sm font-black text-white">{role}</p><p className="mt-0.5 text-sm leading-relaxed text-white/80">{names}</p></div>;
}
