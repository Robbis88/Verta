import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { Insights } from "@/components/landing/Insights";
import { Integrations } from "@/components/landing/Integrations";
import { Testimonials } from "@/components/landing/Testimonials";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { ChatWidget } from "@/components/chat/chat-widget";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <FeatureGrid />
      <BeforeAfter />
      <Insights />
      <Integrations />
      <Testimonials />
      <Faq />
      <FinalCta />
      <Footer />
      <ChatWidget context="landing" />
    </>
  );
}
