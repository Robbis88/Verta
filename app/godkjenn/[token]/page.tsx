import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatNok } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { approveByToken, rejectByToken } from "./actions";

export const metadata: Metadata = { title: "Bookingforespørsel — Verta" };

type Row = {
  id: string;
  status: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  check_in: string;
  check_out: string;
  num_guests: number | null;
  guest_message: string | null;
  total_price: number | null;
  amount_total: number | null;
  property_id: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function GodkjennPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ resultat?: string }>;
}) {
  const { token } = await params;
  const { resultat } = await searchParams;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id,status,guest_name,guest_email,guest_phone,check_in,check_out,num_guests,guest_message,total_price,amount_total,property_id",
    )
    .eq("owner_token", token)
    .maybeSingle();
  if (!data) notFound();
  const booking = data as Row;

  const { data: property } = await supabase
    .from("properties")
    .select("name")
    .eq("id", booking.property_id)
    .single();
  const propertyName = property?.name ?? "eiendommen";

  // Resultat-melding etter en handling.
  const banner: { tone: "ok" | "warn" | "info"; text: string } | null =
    resultat === "godkjent"
      ? { tone: "ok", text: "Forespørselen er godkjent 🎉 Gjesten har fått en betalingslenke på e-post." }
      : resultat === "avslatt"
        ? { tone: "info", text: "Forespørselen er avslått. Gjesten er varslet." }
        : resultat === "utbetaling"
          ? { tone: "warn", text: "Du må koble utbetaling først (Innstillinger → «Koble utbetaling») før du kan godkjenne bookinger." }
          : resultat === "opptatt"
            ? { tone: "warn", text: "Datoene ble nettopp opptatt av en annen booking. Forespørselen kunne ikke godkjennes." }
            : resultat === "behandlet"
              ? { tone: "info", text: "Denne forespørselen er allerede behandlet." }
              : resultat === "ukjent"
                ? { tone: "warn", text: "Fant ikke forespørselen." }
                : null;

  const bannerClass =
    banner?.tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : banner?.tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-hairline bg-cloud text-navy";

  const isOpen = booking.status === "requested" && resultat !== "godkjent" && resultat !== "avslatt";

  return (
    <main className="min-h-screen bg-cloud">
      <header className="bg-navy px-6 py-10 text-center text-white">
        <p className="text-sm text-gold-light">{propertyName}</p>
        <h1 className="mt-1 text-2xl font-bold">Bookingforespørsel</h1>
      </header>

      <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
        {banner && (
          <p className={`rounded-xl border p-4 text-sm ${bannerClass}`}>
            {banner.text}
          </p>
        )}

        <section className="rounded-xl border border-hairline bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">
            Forespørselen
          </h2>
          <div className="flex flex-col gap-2 text-sm">
            <Row label="Gjest" value={booking.guest_name} />
            {booking.guest_email && (
              <Row label="E-post" value={booking.guest_email} />
            )}
            {booking.guest_phone && (
              <Row label="Telefon" value={booking.guest_phone} />
            )}
            {booking.num_guests != null && (
              <Row label="Antall gjester" value={String(booking.num_guests)} />
            )}
            <Row label="Innsjekk" value={formatDate(booking.check_in)} />
            <Row label="Utsjekk" value={formatDate(booking.check_out)} />
            {booking.total_price != null && (
              <Row
                label="Din inntekt"
                value={formatNok(Number(booking.total_price))}
              />
            )}
          </div>
          {booking.guest_message && (
            <div className="mt-3 rounded-lg bg-cloud p-3">
              <p className="text-xs text-ink/60">Melding fra gjesten</p>
              <p className="mt-1 whitespace-pre-line text-sm text-navy">
                {booking.guest_message}
              </p>
            </div>
          )}
        </section>

        {isOpen ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <form action={approveByToken.bind(null, token)} className="flex-1">
              <Button type="submit" size="lg" className="w-full">
                Godkjenn
              </Button>
            </form>
            <form action={rejectByToken.bind(null, token)} className="flex-1">
              <Button
                type="submit"
                size="lg"
                variant="outline"
                className="w-full"
              >
                Avslå
              </Button>
            </form>
          </div>
        ) : (
          !banner && (
            <p className="rounded-xl border border-hairline bg-white p-4 text-center text-sm text-ink/70">
              {booking.status === "cancelled"
                ? "Denne forespørselen er avslått eller avbestilt."
                : "Denne forespørselen er allerede behandlet."}
            </p>
          )
        )}

        <p className="mt-2 text-center text-xs text-ink/60">Levert av Verta</p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink/60">{label}</span>
      <span className="text-right font-medium text-navy">{value}</span>
    </div>
  );
}
