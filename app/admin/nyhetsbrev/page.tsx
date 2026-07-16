import Link from "next/link";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewsletterExport } from "@/components/admin/newsletter-export";

export const metadata = { title: "Nyhetsbrev — Admin" };

type Subscriber = {
  email: string;
  name: string | null;
  source: string | null;
  consent_at: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function NewsletterAdminPage() {
  await requireAdmin();

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("email,name,source,consent_at")
    .is("unsubscribed_at", null)
    .order("created_at", { ascending: false });
  const subscribers = (data ?? []) as Subscriber[];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-white/10 bg-navy px-4 py-3 text-white sm:px-6">
        <div className="flex items-baseline gap-3">
          <Link
            href="/dashboard"
            className="text-lg font-bold tracking-tight text-gold"
          >
            Verta
          </Link>
          <span className="text-sm text-white/70">Admin · Nyhetsbrev</span>
        </div>
        <Link href="/admin" className="text-sm text-white/70 hover:text-white">
          ← Til admin
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-navy">
              Nyhetsbrev-arkiv
            </h1>
            <p className="text-sm text-muted-foreground">
              {subscribers.length} aktive abonnenter (med samtykke).
            </p>
          </div>
          <NewsletterExport
            rows={subscribers.map((s) => ({ email: s.email, name: s.name }))}
          />
        </div>

        {subscribers.length === 0 ? (
          <p className="rounded-xl border border-hairline bg-white p-8 text-center text-sm text-muted-foreground">
            Ingen påmeldte ennå.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-hairline bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-hairline text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">E-post</th>
                  <th className="px-4 py-3 font-medium">Navn</th>
                  <th className="px-4 py-3 font-medium">Kilde</th>
                  <th className="px-4 py-3 font-medium">Samtykket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {subscribers.map((s) => (
                  <tr key={s.email}>
                    <td className="px-4 py-2.5 text-navy">{s.email}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {s.name ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {s.source ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {formatDate(s.consent_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          GDPR: kun e-poster med aktivt samtykke vises her. Alle utsendinger må ha
          en avmeldingslenke (verta.no/avmelding/…). Avmeldte skjules automatisk.
        </p>
      </main>
    </div>
  );
}
