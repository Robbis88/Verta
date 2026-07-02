import { requireUser } from "@/lib/auth";
import { MfaVerify } from "@/components/security/mfa-verify";

export const metadata = { title: "Bekreft pålogging — Verta" };

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await requireUser();
  const { next } = await searchParams;
  // Tillat kun interne stier som mål, for å unngå open redirect.
  const safeNext = next && next.startsWith("/") ? next : "/dashboard";

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight text-navy">
        Bekreft pålogging
      </h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Denne siden krever tofaktor. Skriv inn engangskoden fra
        autentiseringsappen din.
      </p>
      <MfaVerify next={safeNext} />
    </main>
  );
}
