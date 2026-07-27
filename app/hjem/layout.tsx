import { redirect } from "next/navigation";

import { HusAkser } from "@/components/hjem/hus-akser";
import { isAdmin } from "@/lib/admin";
import { getCurrentProfile, requireUser } from "@/lib/auth";

/**
 * Huset — fullflate-layout uten meny. Dette er den rolige inngangen; selve
 * appen ligger urørt på /dashboard og nås via «Alt».
 *
 * VIKTIG: samme vakt som app/dashboard/layout.tsx. Huset viser ekte data, så
 * det må ikke bli en vei rundt betalingsmuren.
 */
export const metadata = { title: "Verta" };

export default async function HjemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const profile = await getCurrentProfile();

  if (profile?.plan === "gratis" && !isAdmin(profile?.email)) {
    redirect("/onboarding/plan");
  }

  return (
    <>
      {children}
      <HusAkser />
    </>
  );
}
