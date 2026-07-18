import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { PainPoints } from "@/components/landing/PainPoints";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { MoneyStory } from "@/components/landing/MoneyStory";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SelfRunning } from "@/components/landing/SelfRunning";
import { ControlShowcase } from "@/components/landing/ControlShowcase";
import { Integrations } from "@/components/landing/Integrations";
import { Testimonials } from "@/components/landing/Testimonials";
import { PricingTable } from "@/components/landing/PricingTable";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { ChatWidget } from "@/components/chat/chat-widget";

/**
 * Landingssiden — historiedrevet CRO-flyt (se LANDING.md):
 * Løfte → Fienden → Vendepunkt → Penger → Slik funker det → Går av seg selv →
 * Full kontroll → Bevis → Pris → FAQ → Siste CTA.
 */
export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <PainPoints />
      <BeforeAfter />
      <MoneyStory />
      <HowItWorks />
      <SelfRunning />
      <ControlShowcase />
      <Integrations />
      <Testimonials />
      <PricingTable />
      <Faq />
      <FinalCta />
      <Footer />
      <ChatWidget context="landing" />
    </>
  );
}
