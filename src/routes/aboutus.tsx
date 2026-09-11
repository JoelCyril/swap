import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Instagram, Mail } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const Route = createFileRoute("/aboutus")({
  head: () => ({
    meta: [
      { title: "About SWAP UAE | Local, sustainable swapping" },
      { name: "description", content: "Meet SWAP UAE: a free, student-built platform that makes swapping and trading pre-owned items simple, local, and sustainable across the Emirates." },
      { property: "og:title", content: "About SWAP UAE" },
      { property: "og:description", content: "A free, local platform for swapping and trading pre-owned items across the UAE." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://swapuae.com/aboutus" },
      { property: "og:image", content: "https://swapuae.com/swap-logo.png" },
      { name: "twitter:title", content: "About SWAP UAE" },
      { name: "twitter:description", content: "A free, local platform for swapping and trading pre-owned items across the UAE." },
    ],
    links: [{ rel: "canonical", href: "https://swapuae.com/aboutus" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "AboutPage", name: "About SWAP UAE", url: "https://swapuae.com/aboutus", description: "SWAP UAE is a free, community-driven platform for trading, swapping, and exchanging pre-owned items across the Emirates.", mainEntity: { "@type": "Organization", name: "SWAP UAE", url: "https://swapuae.com", description: "A student-built UAE platform that makes local swapping and trading of pre-owned items simple and sustainable." } }) }],
  }),
  component: AboutUsPage,
});

function AboutUsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <article className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
          <header className="border-b border-border pb-10 sm:pb-14">
            <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">About SWAP UAE</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              More useful things, in more useful hands.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              SWAP UAE is a homegrown platform for trading, swapping, and exchanging pre-owned items across the Emirates—entirely free and community-driven.
            </p>
          </header>

          <section className="grid gap-8 border-b border-border py-10 sm:grid-cols-[10rem_1fr] sm:py-14">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">01 / Our story</p>
            <div className="space-y-5 text-base leading-relaxed text-foreground">
              <p>
                We are a tight-knit team of student creators based in the UAE and currently studying at the Abu Dhabi Indian School. We started SWAP because we saw a gap for a straightforward, local place where people could pass on things they no longer use and find what they need without the clutter of traditional commercial marketplaces.
              </p>
              <p>
                What began as an ambitious idea among friends around a campfire became a platform built completely from scratch. We handle every layer ourselves—from the interface and design to backend logic and security—so using SWAP feels fast, reliable, and simple.
              </p>
            </div>
          </section>

          <section className="grid gap-8 border-b border-border py-10 sm:grid-cols-[10rem_1fr] sm:py-14">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">02 / The team</p>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Built locally, by students.</h2>
              <dl className="mt-7 divide-y divide-border border-y border-border">
                <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="text-sm font-medium text-muted-foreground">Founder</dt>
                  <dd className="text-base text-foreground">Atul Ajit Nair</dd>
                </div>
                <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="text-sm font-medium text-muted-foreground">Co-founders</dt>
                  <dd className="text-base text-foreground">Abdul Raafay Amaan, Haron Emmanuel, Aqeel Muhammed Shamim</dd>
                </div>
                <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="text-sm font-medium text-muted-foreground">Lead developers</dt>
                  <dd className="text-base text-foreground">Abdul Raafay Amaan, Haron Emmanuel, Joel Thomas Cyril</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="grid gap-8 border-b border-border py-10 sm:grid-cols-[10rem_1fr] sm:py-14">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">03 / Looking ahead</p>
            <p className="max-w-2xl text-base leading-relaxed text-foreground">
              As young developers and entrepreneurs growing up in the UAE, we believe the future of commerce is local, collaborative, and eco-friendly. We are constantly refining SWAP and adding features to serve our community better. Thank you for supporting a project built by local students and for helping us shape a more connected UAE.
            </p>
          </section>

          <section className="py-10 sm:py-14" aria-labelledby="connect-heading">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">04 / Stay in touch</p>
            <h2 id="connect-heading" className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Connect with us</h2>
            <div className="mt-7 grid border-y border-border sm:grid-cols-2">
              <a href="https://www.instagram.com/swap_uae/" target="_blank" rel="noreferrer" className="group flex items-center gap-3 border-b border-border px-1 py-5 text-foreground transition-colors hover:text-primary sm:border-r sm:border-b-0 sm:px-5">
                <Instagram className="size-5" aria-hidden="true" />
                <span className="font-medium">@swap_uae</span>
                <ArrowUpRight className="ml-auto size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
              <a href="mailto:swapuaeofficial@gmail.com" className="group flex items-center gap-3 px-1 py-5 text-foreground transition-colors hover:text-primary sm:px-5">
                <Mail className="size-5" aria-hidden="true" />
                <span className="font-medium">swapuaeofficial@gmail.com</span>
                <ArrowUpRight className="ml-auto size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
