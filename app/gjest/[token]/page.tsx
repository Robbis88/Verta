import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  refundFractionForCheckIn,
  isBeforeCheckIn,
  isPast,
  CANCELLATION_POLICY_LINES,
} from "@/lib/cancellation";
import { formatNok } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GuestCancel } from "@/components/booking/guest-cancel";
import { cancelBookingAsGuest, payDeposit, payRemaining } from "./actions";

type GuestBooking = {
  guest_name: string;
  check_in: string;
  check_out: string;
  status: string;
  access_code: string | null;
  property_id: string;
  payment_status: string | null;
  amount_total: number | null;
  deposit_amount: number | null;
  remaining_amount: number | null;
  remaining_paid: boolean | null;
  hold_expires_at: string | null;
};

type GuestProperty = {
  name: string;
  address: string | null;
  access_info: string | null;
  wifi_name: string | null;
  wifi_password: string | null;
  house_rules: string | null;
  checkout_info: string | null;
};

async function getStay(token: string) {
  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "guest_name,check_in,check_out,status,access_code,property_id,payment_status,amount_total,deposit_amount,remaining_amount,remaining_paid,hold_expires_at",
    )
    .eq("guest_token", token)
    .maybeSingle();
  if (!booking) return null;

  const b = booking as GuestBooking;
  const { data: property } = await supabase
    .from("properties")
    .select(
      "name,address,access_info,wifi_name,wifi_password,house_rules,checkout_info",
    )
    .eq("id", b.property_id)
    .single();
  if (!property) return null;

  return { booking: b, property: property as GuestProperty };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const stay = await getStay(token);
  return { title: stay ? `Din info — ${stay.property.name}` : "Gjesteside" };
}

export default async function GuestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const stay = await getStay(token);
  if (!stay) notFound();

  const { booking, property } = stay;

  // Avbestilt opphold: vis en enkel bekreftelse i stedet for 404 (skjuler
  // tilkomst/WiFi). Denne tilstanden treffes rett etter at gjesten avbestiller.
  if (booking.status === "cancelled") {
    return (
      <main className="min-h-screen bg-cloud">
        <header className="bg-navy px-6 py-10 text-center text-white">
          <p className="text-sm text-gold-light">{property.name}</p>
          <h1 className="mt-1 text-2xl font-bold">Oppholdet er avbestilt</h1>
        </header>
        <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
          <Section title="Oppholdet ditt">
            <Row label="Gjest" value={booking.guest_name} />
            <Row label="Innsjekk" value={formatDate(booking.check_in)} />
            <Row label="Utsjekk" value={formatDate(booking.check_out)} />
          </Section>
          <p className="text-center text-sm text-ink/70">
            Dette oppholdet er avbestilt. Har du spørsmål, ta kontakt med verten.
          </p>
          <p className="mt-2 text-center text-xs text-ink/60">Levert av Verta</p>
        </div>
      </main>
    );
  }

  // Forespørsel under vurdering: ingen tilkomst ennå.
  if (booking.status === "requested") {
    return (
      <main className="min-h-screen bg-cloud">
        <header className="bg-navy px-6 py-10 text-center text-white">
          <p className="text-sm text-gold-light">{property.name}</p>
          <h1 className="mt-1 text-2xl font-bold">Forespørsel under vurdering</h1>
        </header>
        <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
          <Section title="Forespørselen din">
            <Row label="Innsjekk" value={formatDate(booking.check_in)} />
            <Row label="Utsjekk" value={formatDate(booking.check_out)} />
          </Section>
          <p className="text-center text-sm text-ink/70">
            Verten vurderer forespørselen din. Godkjennes den, får du en e-post
            med lenke til å betale depositum og låse oppholdet.
          </p>
          <p className="mt-2 text-center text-xs text-ink/60">Levert av Verta</p>
        </div>
      </main>
    );
  }

  // Godkjent: gjesten må betale depositum for å låse oppholdet.
  if (booking.status === "approved") {
    const deposit = Number(booking.deposit_amount ?? 0);
    const remaining = Number(booking.remaining_amount ?? 0);
    const expired =
      !!booking.hold_expires_at && isPast(booking.hold_expires_at);
    return (
      <main className="min-h-screen bg-cloud">
        <header className="bg-navy px-6 py-10 text-center text-white">
          <p className="text-sm text-gold-light">{property.name}</p>
          <h1 className="mt-1 text-2xl font-bold">Forespørselen er godkjent 🎉</h1>
        </header>
        <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
          <Section title="Oppholdet ditt">
            <Row label="Innsjekk" value={formatDate(booking.check_in)} />
            <Row label="Utsjekk" value={formatDate(booking.check_out)} />
            <Row label="Depositum nå" value={formatNok(deposit)} />
            <Row label="Rest før innsjekk" value={formatNok(remaining)} />
          </Section>
          {expired ? (
            <p className="text-center text-sm text-destructive">
              Fristen for å betale depositum har dessverre gått ut, og datoene er
              frigitt. Send gjerne en ny forespørsel.
            </p>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <form action={payDeposit.bind(null, token)}>
                <Button type="submit" size="lg">
                  Betal depositum {formatNok(deposit)}
                </Button>
              </form>
              <p className="text-center text-xs text-ink/60">
                Betal innen 24 timer for å låse oppholdet. Resten (
                {formatNok(remaining)}) betales før innsjekk.
              </p>
            </div>
          )}
          <p className="mt-2 text-center text-xs text-ink/60">Levert av Verta</p>
        </div>
      </main>
    );
  }

  const accessText = booking.access_code ?? property.access_info ?? null;
  const remainingDue =
    !booking.remaining_paid && Number(booking.remaining_amount ?? 0) > 0;

  const canCancel = isBeforeCheckIn(booking.check_in);
  const fraction = refundFractionForCheckIn(booking.check_in);
  const wasPaid = booking.payment_status === "paid";
  const refundNote = !wasPaid
    ? "Du kan avbestille oppholdet her."
    : fraction === 1
      ? "Avbestiller du nå, får du full refusjon."
      : fraction === 0.5
        ? `Avbestiller du nå, refunderes 50 % (${formatNok(
            (Number(booking.amount_total ?? 0) * 0.5),
          )}).`
        : "Avbestiller du nå, refunderes ikke beløpet — det er under 48 timer til innsjekk.";

  return (
    <main className="min-h-screen bg-cloud">
      <header className="bg-navy px-6 py-10 text-center text-white">
        <p className="text-sm text-gold-light">Velkommen</p>
        <h1 className="mt-1 text-3xl font-bold">{property.name}</h1>
        {property.address && (
          <p className="mt-2 text-sm text-white/70">{property.address}</p>
        )}
      </header>

      <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
        <Section title="Oppholdet ditt">
          <Row label="Gjest" value={booking.guest_name} />
          <Row label="Innsjekk" value={formatDate(booking.check_in)} />
          <Row label="Utsjekk" value={formatDate(booking.check_out)} />
        </Section>

        {remainingDue && (
          <Section title="Restbeløp">
            <p className="text-sm text-ink">
              Du har betalt depositum. Restbeløpet på{" "}
              <span className="font-semibold text-navy">
                {formatNok(Number(booking.remaining_amount ?? 0))}
              </span>{" "}
              betales før innsjekk.
            </p>
            <form action={payRemaining.bind(null, token)} className="mt-2">
              <Button type="submit">
                Betal restbeløp {formatNok(Number(booking.remaining_amount ?? 0))}
              </Button>
            </form>
          </Section>
        )}

        {accessText && (
          <Section title="Slik kommer du inn">
            {booking.access_code ? (
              <>
                <p className="text-3xl font-bold tracking-[0.3em] text-navy">
                  {booking.access_code}
                </p>
                <p className="mt-1 text-sm text-ink">
                  Tast koden på smartlåsen. Den virker kun i løpet av oppholdet.
                </p>
              </>
            ) : (
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                {accessText}
              </p>
            )}
          </Section>
        )}

        {(property.wifi_name || property.wifi_password) && (
          <Section title="WiFi">
            {property.wifi_name && (
              <Row label="Nettverk" value={property.wifi_name} />
            )}
            {property.wifi_password && (
              <Row label="Passord" value={property.wifi_password} />
            )}
          </Section>
        )}

        {property.house_rules && (
          <Section title="Husregler">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {property.house_rules}
            </p>
          </Section>
        )}

        {property.checkout_info && (
          <Section title="Ved utsjekk">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {property.checkout_info}
            </p>
          </Section>
        )}

        {canCancel && (
          <Section title="Avbestilling">
            <GuestCancel
              cancelAction={cancelBookingAsGuest.bind(null, token)}
              refundNote={refundNote}
              policyLines={CANCELLATION_POLICY_LINES}
            />
          </Section>
        )}

        <p className="mt-2 text-center text-xs text-ink/60">
          Levert av Verta
        </p>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-hairline bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-ink/60">{label}</span>
      <span className="text-right font-medium text-navy">{value}</span>
    </div>
  );
}
