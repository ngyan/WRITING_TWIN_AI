import { Nav } from "@/components/Nav";
import { Hero } from "@/components/sections/Hero";
import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { TrustPrivacy } from "@/components/sections/TrustPrivacy";
import { ICPSection } from "@/components/sections/ICPSection";
import { Comparison } from "@/components/sections/Comparison";
import { SocialProof } from "@/components/sections/SocialProof";
import { FounderStory } from "@/components/sections/FounderStory";
import { PricingTeaser } from "@/components/sections/PricingTeaser";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { InstallButton } from "@/components/InstallButton";
import { ScrollDepthTracker } from "@/components/ScrollDepthTracker";
import { FAQ_ITEMS } from "@/data/faq";

// FAQPage JSON-LD — rendered server-side for SEO
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <ScrollDepthTracker />

      <Nav />
      <Hero />
      <BeforeAfter />
      <HowItWorks />
      <TrustPrivacy />
      <ICPSection />
      <Comparison />
      <SocialProof />
      <FounderStory />
      <PricingTeaser />
      <FAQ />
      <FinalCTA />
      <SiteFooter />

      {/* Mobile sticky CTA — visible only below sm breakpoint */}
      <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-100 dark:border-neutral-800 p-3 pb-safe">
        <InstallButton location="mobile_sticky" className="w-full justify-center" />
      </div>
    </div>
  );
}
