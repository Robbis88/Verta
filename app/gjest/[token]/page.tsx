import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  refundFractionForCheckIn,
  isBeforeCheckIn,
  isPast,
  remainingDueDate,
  REMAINING_POLICY_TEXT,
  CANCELLATION_POLICY_LINES,
} from "@/lib/cancellation";
import { formatNok } from "@/lib/utils";
import { getTravelGuide } from "@/lib/listing";
import { Button } from "@/components/ui/button";
import { GuestCancel } from "@/components/booking/guest-cancel";
import {
  cancelBookingAsGuest,
  payDeposit,
  payRemaining,
  payStayExtra,
  submitReview,
} from "./actions";

type GuestBooking = {
  id: string;
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
  late_checkout_paid: boolean | null;
  early_checkin_paid: boolean | null;
};

type GuestProperty = {
  id: string;
  name: string;
  address: string | null;
  access_info: string | null;
  wifi_name: string | null;
  wifi_password: string | null;
  house_rules: string | null;
  checkout_info: string | null;
  travel_guide: string | null;
  late_checkout_price: number | null;
  early_checkin_price: number | null;
};

async function getStay(token: string) {
  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id,guest_name,check_in,check_out,status,access_code,property_id,payment_status,amount_total,deposit_amount,remaining_amount,remaining_paid,hold_expires_at,late_checkout_paid,early_checkin_paid",
    )
    .eq("guest_token", token)
    .maybeSingle();
  if (!booking) return null;

  const b = booking as GuestBooking;
  const { data: property } = await supabase
    .from("properties")
    .select(
      "id,name,address,access_info,wifi_name,wifi_password,house_rules,checkout_info,travel_guide,late_checkout_price,early_checkin_price",
    )
    .eq("id", b.property_id)
    .single();
  if (!property) return null;

  const { data: review } = await supabase
    .from("property_reviews")
    .select("id")
    .eq("booking_id", b.id)
    .maybeSingle();

  // Kalender-sjekk for sen utsjekk / tidlig innsjekk: finnes det en annen aktiv
  // booking som sjekker INN på utsjekksdagen (blokkerer sen utsjekk) eller UT på
  // innsjekksdagen (blokkerer tidlig innsjekk)?
  const { data: neighbours } = await supabase
    .from("bookings")
    .select("id,check_in,check_out")
    .eq("property_id", b.property_id)
    .not("status", "in", "(cancelled,requested)")
    .neq("id", b.id);
  const rows = (neighbours ?? []) as { check_in: string; check_out: string }[];
  const lateCheckoutFree = !rows.some((r) => r.check_in === b.check_out);
  const earlyCheckinFree = !rows.some((r) => r.check_out === b.check_in);

  return {
    booking: b,
    property: property as GuestProperty,
    reviewed: Boolean(review),
    lateCheckoutFree,
    earlyCheckinFree,
  };
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

  const { booking, property, reviewed, lateCheckoutFree, earlyCheckinFree } =
    stay;
  const todayStr = new Date().toISOString().slice(0, 10);
  const stayOver = booking.check_out <= todayStr;
  const beforeCheckIn = todayStr < booking.check_in;

  // Sen utsjekk / tidlig innsjekk som betalt tillegg — kun når eier tilbyr det,
  // kalenderen er ledig, og det ikke alt er kjøpt / tidsvinduet ikke er forbi.
  const showLateCheckout =
    property.late_checkout_price != null &&
    lateCheckoutFree &&
    !stayOver;
  const showEarlyCheckin =
    property.early_checkin_price != null &&
    earlyCheckinFree &&
    beforeCheckIn;

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
    // Kortvarsel-booking: hele beløpet betales nå (ingen rest).
    const fullUpfront = remaining <= 0;
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
            {fullUpfront ? (
              <Row label="Å betale nå" value={formatNok(deposit)} />
            ) : (
              <>
                <Row label="Depositum nå" value={formatNok(deposit)} />
                <Row label="Rest før innsjekk" value={formatNok(remaining)} />
              </>
            )}
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
                  {fullUpfront
                    ? `Betal og lås oppholdet ${formatNok(deposit)}`
                    : `Betal depositum ${formatNok(deposit)}`}
                </Button>
              </form>
              <p className="text-center text-xs text-ink/60">
                {fullUpfront
                  ? "Betal innen 24 timer for å låse oppholdet."
                  : `Betal innen 24 timer for å låse oppholdet. Resten (${formatNok(
                      remaining,
                    )}) betales før innsjekk.`}
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

  // AI-reiseguide (genereres én gang per eiendom og caches).
  const travelGuide = await getTravelGuide({
    id: property.id,
    name: property.name,
    address: property.address,
    travel_guide: property.travel_guide,
  });

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
              må betales senest{" "}
              <span className="font-semibold text-navy">
                {formatDate(remainingDueDate(booking.check_in))}
              </span>
              .
            </p>
            <form action={payRemaining.bind(null, token)} className="mt-2">
              <Button type="submit">
                Betal restbeløp {formatNok(Number(booking.remaining_amount ?? 0))}
              </Button>
            </form>
            <p className="mt-2 text-xs text-ink/60">{REMAINING_POLICY_TEXT}</p>
          </Section>
        )}

        {(showLateCheckout ||
          showEarlyCheckin ||
          booking.late_checkout_paid ||
          booking.early_checkin_paid) && (
          <Section title="Gjør oppholdet bedre">
            {booking.late_checkout_paid ? (
              <Row label="Sen utsjekk" value="Bekreftet ✓" />
            ) : showLateCheckout ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink">Sen utsjekk</span>
                <form action={payStayExtra.bind(null, token, "late_checkout")}>
                  <Button type="submit" size="sm">
                    Bestill{" "}
                    {formatNok(Number(property.late_checkout_price))}
                  </Button>
                </form>
              </div>
            ) : null}
            {booking.early_checkin_paid ? (
              <Row label="Tidlig innsjekk" value="Bekreftet ✓" />
            ) : showEarlyCheckin ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink">Tidlig innsjekk</span>
                <form action={payStayExtra.bind(null, token, "early_checkin")}>
                  <Button type="submit" size="sm">
                    Bestill{" "}
                    {formatNok(Number(property.early_checkin_price))}
                  </Button>
                </form>
              </div>
            ) : null}
            <p className="mt-1 text-xs text-ink/50">
              Betales direkte til verten og bekreftes med en gang.
            </p>
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

        {travelGuide && (
          <Section title="AI-reiseguide">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {travelGuide}
            </p>
            <p className="mt-2 text-xs text-ink/50">
              Generert av AI som inspirasjon — dobbeltsjekk gjerne åpningstider
              og detaljer.
            </p>
          </Section>
        )}

        {stayOver &&
          (reviewed ? (
            <Section title="Takk for anmeldelsen!">
              <p className="text-sm text-ink">
                Anmeldelsen din er registrert. Takk for at du hjelper andre
                gjester. 🌟
              </p>
            </Section>
          ) : (
            <Section title="Legg igjen en anmeldelse">
              <form
                action={submitReview.bind(null, token)}
                className="flex flex-col gap-3"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm text-ink/60">Din vurdering</span>
                  <select
                    name="rating"
                    defaultValue="5"
                    className="h-10 rounded-lg border border-hairline bg-white px-3 text-sm shadow-sm"
                  >
                    <option value="5">★★★★★ – Utmerket</option>
                    <option value="4">★★★★ – Veldig bra</option>
                    <option value="3">★★★ – Grei</option>
                    <option value="2">★★ – Under forventning</option>
                    <option value="1">★ – Dårlig</option>
                  </select>
                </div>
                <textarea
                  name="comment"
                  rows={3}
                  placeholder="Hvordan var oppholdet?"
                  className="rounded-lg border border-hairline bg-white px-3 py-2 text-sm shadow-sm"
                />
                <Button type="submit">Send anmeldelse</Button>
              </form>
            </Section>
          ))}

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
