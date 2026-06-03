import { Hero } from "@/components/landing/Hero";
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
      <PainPoints />
      <Showcase />
      <Features />
      <HowItWorks />
      <PricingTable />
      <Footer />
    </>
  );
}
