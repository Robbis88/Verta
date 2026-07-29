import { redirect } from "next/navigation";

import { getCurrentProfile, requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { ChatWidget } from "@/components/chat/chat-widget";

/**
 * Skallet — modul 11, den siste. Husflaten er flyttet hit fra `Side`, så
 * bakgrunnen er sammenhengende under hele dashbordet i stedet for å bli lagt
 * oppå per side. Betalingsmuren og datahentingen er uendret.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const profile = await getCurrentProfile();

  // Betalingsmur: appen har ingen brukbar gratis-plan. Uten aktivt abonnement
  // (plan = "gratis") sendes brukeren til planvalg/betaling. Trialende brukere
  // har allerede en betalt plan satt, så de slipper forbi. Admin unntas.
  if (profile?.plan === "gratis" && !isAdmin(profile?.email)) {
    redirect("/onboarding/plan");
  }

  return (
    <div className="flex min-h-screen flex-col bg-hus-flate">
      <header className="border-b border-hus-linje bg-hus-flate px-4 py-3 sm:px-6 print:hidden">
        <DashboardNav email={profile?.email} isAdmin={isAdmin(profile?.email)} />
      </header>
      <main className="hus-side relative flex-1 text-hus-blekk">
        {/* Lyset i taket — samme gest som på startsiden, dempet. Ligger her,
            ikke i hver side, så det ikke stables oppå seg selv. */}
        <div
          aria-hidden="true"
          className="hus-lys pointer-events-none fixed inset-0 bg-[radial-gradient(110%_60%_at_50%_-10%,rgba(216,166,106,0.10),transparent_60%)]"
        />
        {children}
      </main>
      <ChatWidget context="portal" />
    </div>
  );
}
