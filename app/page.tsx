import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { VideoSection } from "@/components/landing/VideoSection";
import { ProductScreens } from "@/components/landing/ProductScreens";
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

      <VideoSection
        src="/videos/hero-3.mp4"
        eyebrow="For gjestene"
        title="En bedre opplevelse for gjestene"
        text="Sømløs booking, automatisk innsjekk og smartlås — som gir flere 5-stjerners anmeldelser."
        bullets={[
          "Booking",
          "Automatisk innsjekk",
          "Smartlås",
          "Gjestekommunikasjon",
          "5-stjerners",
        ]}
        tone="dark"
      />

      <Integrations />
      <Testimonials />
      <Faq />

      <VideoSection
        src="/videos/hero-4.mp4"
        eyebrow="For eiere og forvaltere"
        title="Full kontroll for eiere og forvaltere"
        text="Eierportal, rapporter, inntekter, vedlikehold og utbetalinger — alltid oppdatert."
        bullets={[
          "Eierportal",
          "Rapporter",
          "Inntekter",
          "Vedlikehold",
          "Utbetalinger",
        ]}
        tone="light"
      />

      <FinalCta />
      <Footer />
      <ChatWidget context="landing" />
    </>
  );
}
