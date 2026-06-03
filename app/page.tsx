import { Hero } from "@/components/landing/Hero";
import { LogoMarquee } from "@/components/landing/LogoMarquee";
import { PainPoints } from "@/components/landing/PainPoints";
import { Showcase } from "@/components/landing/Showcase";
import { PricingTable } from "@/components/landing/PricingTable";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <PainPoints />
      <Showcase />
      <Features />
      <HowItWorks />
      <PricingTable />
      <Footer />
    </>
  );
}
