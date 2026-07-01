import { redirect } from "next/navigation";

import { getCurrentProfile, requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { ChatWidget } from "@/components/chat/chat-widget";

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
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/10 bg-navy px-4 py-3 sm:px-6 print:hidden">
        <DashboardNav email={profile?.email} isAdmin={isAdmin(profile?.email)} />
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-6">{children}</main>
      <ChatWidget context="portal" />
    </div>
  );
}
