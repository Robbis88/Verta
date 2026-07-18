import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { PainPoints } from "@/components/landing/PainPoints";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { MoneyStory } from "@/components/landing/MoneyStory";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { VideoSection } from "@/components/landing/VideoSection";
import { ProductScreens } from "@/components/landing/ProductScreens";
import { Insights } from "@/components/landing/Insights";
import { ExploreStays } from "@/components/landing/ExploreStays";
import { SelfRunning } from "@/components/landing/SelfRunning";
import { Integrations } from "@/components/landing/Integrations";
import { ControlShowcase } from "@/components/landing/ControlShowcase";
import { Testimonials } from "@/components/landing/Testimonials";
import { PricingTable } from "@/components/landing/PricingTable";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { ChatWidget } from "@/components/chat/chat-widget";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <PainPoints />
      <BeforeAfter />
      <MoneyStory />
      <FeatureGrid />

      <VideoSection
        src="/videos/hero-2.mp4"
        eyebrow="Problemet vi løser"
        title="Fra kaos til kontroll"
        text="Airbnb, Booking.com, regneark, SMS og e-post — samlet i ett dashboard."
        bullets={["Airbnb", "Booking.com", "Excel", "SMS", "E-post"]}
        tone="dark"
      />

      <ProductScreens />
      <Insights />
      <ExploreStays />

      <SelfRunning />

      <Integrations />
      <ControlShowcase />
      <Testimonials />
      <PricingTable />
      <Faq />

      <FinalCta />
      <Footer />
      <ChatWidget context="landing" />
    </>
  );
}
