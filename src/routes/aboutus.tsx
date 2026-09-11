import { createFileRoute } from "@tanstack/react-router";
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
        <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-base leading-relaxed text-foreground">
            Welcome to SWAP UAE (swapuae.com), a homegrown digital platform designed to make trading, swapping, and exchanging pre-owned items simple, sustainable, and entirely community-driven across the Emirates completely for free
          </p>
          <p className="mt-6 text-base leading-relaxed text-foreground">
            We are a tight-knit team of student creators based in the UAE and currently studying at the Abu Dhabi Indian School. We started building SWAP because we saw a gap for a straightforward, local space where people could pass on things they no longer use and find what they need without navigating the clutter and complications of traditional commercial marketplaces.
          </p>

          <h1 className="mt-10 text-2xl font-bold text-foreground">Who We Are</h1>
          <p className="mt-3 text-base leading-relaxed text-foreground">
            What began as an ambitious idea among friends around a campfire quickly turned into a fully realized platform built completely from scratch. We wanted to challenge ourselves to create something genuinely useful for our local community. We handle every single layer of the platform ourselves, from the user interface and design down to the backend logic and security, ensuring that your experience on the site is fast, reliable, and smooth.
          </p>

          <h2 className="mt-10 text-2xl font-bold text-foreground">Meet the Team</h2>
          <div className="mt-3 space-y-1 text-base leading-relaxed text-foreground">
            <p>Founder: Atul Ajit Nair</p>
            <p>Co-Founders: Abdul Raafay Amaan, Haron Emmanuel, Aqeel Muhammed Shamim</p>
            <p>Lead Developers: Abdul Raafay Amaan, Haron Emmanuel, and Joel Thomas Cyril</p>
          </div>

          <h2 className="mt-10 text-2xl font-bold text-foreground">Looking Ahead</h2>
          <p className="mt-3 text-base leading-relaxed text-foreground">
            As young developers and entrepreneurs growing up in the UAE, we believe that the future of commerce is local, collaborative, and eco-friendly. We are constantly rolling out updates, refining features, and scaling the platform to better serve our users. Thank you for supporting a project built by local students and for helping us shape a more connected UAE community.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
