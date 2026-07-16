import Link from "next/link";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewsletterExport } from "@/components/admin/newsletter-export";
import { Button } from "@/components/ui/button";
import { sendNewsletter, sendNewsletterTest } from "./actions";

export const metadata = { title: "Nyhetsbrev — Admin" };

type Subscriber = {
  email: string;
  name: string | null;
  source: string | null;
  consent_at: string;
};

type Campaign = {
  id: string;
  subject: string;
  recipient_count: number;
  sent_count: number;
  created_at: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function NewsletterAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ sendt?: string; test?: string; feil?: string }>;
}) {
  await requireAdmin();
  const { sendt, test, feil } = await searchParams;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("email,name,source,consent_at")
    .is("unsubscribed_at", null)
    .order("created_at", { ascending: false });
  const subscribers = (data ?? []) as Subscriber[];

  const { data: campData } = await supabase
    .from("newsletter_campaigns")
    .select("id,subject,recipient_count,sent_count,created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  const campaigns = (campData ?? []) as Campaign[];

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

        {sendt !== undefined && (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Nyhetsbrevet er sendt til {sendt} mottakere.
          </p>
        )}
        {test && (
          <p className="rounded-lg bg-navy/5 px-4 py-3 text-sm text-navy">
            Testkopi sendt til din egen e-post.
          </p>
        )}
        {feil && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Fyll inn emne + innhold og huk av bekreftelsen før utsending.
          </p>
        )}

        {/* Skriv og send */}
        <div className="rounded-xl border border-hairline bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gold">
            Skriv nyhetsbrev
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Sendes til alle {subscribers.length} aktive abonnenter. Send en
            testkopi til deg selv først. Avmeldingslenke legges til automatisk.
          </p>
          <form className="flex flex-col gap-3">
            <input
              name="subject"
              required
              placeholder="Emne"
              className="h-10 rounded-lg border border-hairline bg-white px-3 text-sm shadow-sm"
            />
            <textarea
              name="body"
              required
              rows={8}
              placeholder="Skriv innholdet her. Tomme linjer lager nye avsnitt."
              className="rounded-lg border border-hairline bg-white px-3 py-2 text-sm shadow-sm"
            />
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                name="confirm"
                className="mt-0.5 h-4 w-4"
              />
              <span>
                Jeg vil sende dette til alle {subscribers.length} abonnentene.
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button formAction={sendNewsletterTest} variant="outline" size="sm">
                Send testkopi til meg
              </Button>
              <Button formAction={sendNewsletter} size="sm">
                Send til alle
              </Button>
            </div>
          </form>
        </div>

        {campaigns.length > 0 && (
          <div className="rounded-xl border border-hairline bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">
              Sendte nyhetsbrev
            </h2>
            <ul className="flex flex-col divide-y divide-hairline">
              {campaigns.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="min-w-0 truncate font-medium text-navy">
                    {c.subject}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {c.sent_count}/{c.recipient_count} · {formatDate(c.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
