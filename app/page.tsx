import { Hero } from "@/components/landing/Hero";
import { PainPoints } from "@/components/landing/PainPoints";
import { PricingTable } from "@/components/landing/PricingTable";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <PainPoints />
      <Features />
      <HowItWorks />
      <PricingTable />
      <Footer />
    </>
  );
}
