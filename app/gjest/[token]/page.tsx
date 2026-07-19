import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  refundFractionForCheckIn,
  isBeforeCheckIn,
  isPast,
  remainingDueDate,
} from "@/lib/cancellation";
import { formatNok } from "@/lib/utils";
import { getTravelGuide } from "@/lib/listing";
import {
  resolveGuestLang,
  guestT,
  GUEST_LOCALE,
  type GuestLang,
} from "@/lib/guest-i18n";
import { translateOwnerContent } from "@/lib/translate";
import { Button } from "@/components/ui/button";
import { GuestCancel } from "@/components/booking/guest-cancel";
import { GuideChat } from "@/components/guide/guide-chat";
import { LanguageSwitcher } from "@/components/guest/language-switcher";
import { Sparkles } from "lucide-react";
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
  guide_token: string | null;
  check_in_time: string | null;
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
      "id,name,address,access_info,wifi_name,wifi_password,house_rules,checkout_info,travel_guide,late_checkout_price,early_checkin_price,guide_token,check_in_time",
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

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Finn gjestens språk: ?lang= vinner, ellers nettleserens Accept-Language. */
async function resolveLang(explicit?: string): Promise<GuestLang> {
  const h = await headers();
  return resolveGuestLang(explicit, h.get("accept-language"));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const stay = await getStay(token);
  return { title: stay ? `${stay.property.name}` : "Gjesteside" };
}

export default async function GuestPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { token } = await params;
  const { lang: langParam } = await searchParams;
  const stay = await getStay(token);
  if (!stay) notFound();

  const lang = await resolveLang(langParam);
  const locale = GUEST_LOCALE[lang];
  const t = guestT(lang);
  const date = (iso: string) => formatDate(iso, locale);

  const { booking, property, reviewed, lateCheckoutFree, earlyCheckinFree } =
    stay;
  const todayStr = new Date().toISOString().slice(0, 10);
  const stayOver = booking.check_out <= todayStr;
  const beforeCheckIn = todayStr < booking.check_in;

  // Dørkode sladdes utenfor oppholdet: vises fra 30 min før innsjekk (innsjekks-
  // tid, standard 16:00) til slutten av utsjekksdagen. Ellers «••••».
  const [ciH, ciM] = (property.check_in_time ?? "16:00").split(":").map(Number);
  const revealFrom =
    new Date(`${booking.check_in}T00:00:00Z`).getTime() +
    ((ciH || 16) * 60 + (ciM || 0)) * 60_000 -
    30 * 60_000;
  const revealTo = new Date(`${booking.check_out}T23:59:59Z`).getTime();
  const nowMs = new Date().getTime();
  const accessVisible = nowMs >= revealFrom && nowMs <= revealTo;

  // Sen utsjekk / tidlig innsjekk som betalt tillegg — kun når eier tilbyr det,
  // kalenderen er ledig, og det ikke alt er kjøpt / tidsvinduet ikke er forbi.
  const showLateCheckout =
    property.late_checkout_price != null && lateCheckoutFree && !stayOver;
  const showEarlyCheckin =
    property.early_checkin_price != null && earlyCheckinFree && beforeCheckIn;

  // Avbestilt opphold: vis en enkel bekreftelse i stedet for 404 (skjuler
  // tilkomst/WiFi). Denne tilstanden treffes rett etter at gjesten avbestiller.
  if (booking.status === "cancelled") {
    return (
      <main className="min-h-screen bg-cloud">
        <header className="bg-navy px-6 py-10 text-center text-white">
          <p className="text-sm text-gold-light">{property.name}</p>
          <h1 className="mt-1 text-2xl font-bold">{t("cancelledTitle")}</h1>
          <LanguageSwitcher current={lang} />
        </header>
        <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
          <Section title={t("yourStay")}>
            <Row label={t("guest")} value={booking.guest_name} />
            <Row label={t("checkIn")} value={date(booking.check_in)} />
            <Row label={t("checkOut")} value={date(booking.check_out)} />
          </Section>
          <p className="text-center text-sm text-ink/70">{t("cancelledBody")}</p>
          <p className="mt-2 text-center text-xs text-ink/60">
            {t("poweredBy")}
          </p>
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
          <h1 className="mt-1 text-2xl font-bold">{t("requestedTitle")}</h1>
          <LanguageSwitcher current={lang} />
        </header>
        <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
          <Section title={t("yourRequest")}>
            <Row label={t("checkIn")} value={date(booking.check_in)} />
            <Row label={t("checkOut")} value={date(booking.check_out)} />
          </Section>
          <p className="text-center text-sm text-ink/70">{t("requestedBody")}</p>
          <p className="mt-2 text-center text-xs text-ink/60">
            {t("poweredBy")}
          </p>
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
          <h1 className="mt-1 text-2xl font-bold">{t("approvedTitle")}</h1>
          <LanguageSwitcher current={lang} />
        </header>
        <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
          <Section title={t("yourStay")}>
            <Row label={t("checkIn")} value={date(booking.check_in)} />
            <Row label={t("checkOut")} value={date(booking.check_out)} />
            {fullUpfront ? (
              <Row label={t("toPayNow")} value={formatNok(deposit)} />
            ) : (
              <>
                <Row label={t("depositNow")} value={formatNok(deposit)} />
                <Row
                  label={t("restBeforeCheckin")}
                  value={formatNok(remaining)}
                />
              </>
            )}
          </Section>
          {expired ? (
            <p className="text-center text-sm text-destructive">
              {t("approvedExpired")}
            </p>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <form action={payDeposit.bind(null, token)}>
                <Button type="submit" size="lg">
                  {fullUpfront
                    ? `${t("payAndLock")} ${formatNok(deposit)}`
                    : `${t("payDeposit")} ${formatNok(deposit)}`}
                </Button>
              </form>
              <p className="text-center text-xs text-ink/60">
                {fullUpfront
                  ? t("payWithin24Full")
                  : t("payWithin24Rest", { amount: formatNok(remaining) })}
              </p>
            </div>
          )}
          <p className="mt-2 text-center text-xs text-ink/60">
            {t("poweredBy")}
          </p>
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

  // AI-oversett eierens fritekst til gjestens språk (norsk = uendret, cachet).
  const tr = await translateOwnerContent(property.id, lang, {
    access_info: property.access_info,
    house_rules: property.house_rules,
    checkout_info: property.checkout_info,
    travel_guide: travelGuide,
  });

  const canCancel = isBeforeCheckIn(booking.check_in);
  const fraction = refundFractionForCheckIn(booking.check_in);
  const wasPaid = booking.payment_status === "paid";
  const refundNote = !wasPaid
    ? t("refundCanCancel")
    : fraction === 1
      ? t("refundFull")
      : fraction === 0.5
        ? t("refund50", {
            amount: formatNok(Number(booking.amount_total ?? 0) * 0.5),
          })
        : t("refundNone");
  const policyLines = [
    t("cancelPolicy14"),
    t("cancelPolicy2to14"),
    t("cancelPolicy48"),
  ];

  return (
    <main className="min-h-screen bg-cloud">
      <header className="bg-navy px-6 py-10 text-center text-white">
        <p className="text-sm text-gold-light">{t("welcome")}</p>
        <h1 className="mt-1 text-3xl font-bold">{property.name}</h1>
        {property.address && (
          <p className="mt-2 text-sm text-white/70">{property.address}</p>
        )}
        <LanguageSwitcher current={lang} />
      </header>

      <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
        <Section title={t("yourStay")}>
          <Row label={t("guest")} value={booking.guest_name} />
          <Row label={t("checkIn")} value={date(booking.check_in)} />
          <Row label={t("checkOut")} value={date(booking.check_out)} />
        </Section>

        {remainingDue && (
          <Section title={t("remainingBalance")}>
            <p className="text-sm text-ink">
              {t("remainingInfo", {
                amount: formatNok(Number(booking.remaining_amount ?? 0)),
                date: date(remainingDueDate(booking.check_in)),
              })}
            </p>
            <form action={payRemaining.bind(null, token)} className="mt-2">
              <Button type="submit">
                {t("payRemaining")}{" "}
                {formatNok(Number(booking.remaining_amount ?? 0))}
              </Button>
            </form>
            <p className="mt-2 text-xs text-ink/60">{t("remainingPolicy")}</p>
          </Section>
        )}

        {(showLateCheckout ||
          showEarlyCheckin ||
          booking.late_checkout_paid ||
          booking.early_checkin_paid) && (
          <Section title={t("improveStay")}>
            {booking.late_checkout_paid ? (
              <Row label={t("lateCheckout")} value={t("confirmed")} />
            ) : showLateCheckout ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink">{t("lateCheckout")}</span>
                <form action={payStayExtra.bind(null, token, "late_checkout")}>
                  <Button type="submit" size="sm">
                    {t("order")} {formatNok(Number(property.late_checkout_price))}
                  </Button>
                </form>
              </div>
            ) : null}
            {booking.early_checkin_paid ? (
              <Row label={t("earlyCheckin")} value={t("confirmed")} />
            ) : showEarlyCheckin ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink">{t("earlyCheckin")}</span>
                <form action={payStayExtra.bind(null, token, "early_checkin")}>
                  <Button type="submit" size="sm">
                    {t("order")} {formatNok(Number(property.early_checkin_price))}
                  </Button>
                </form>
              </div>
            ) : null}
            <p className="mt-1 text-xs text-ink/50">{t("stayExtraNote")}</p>
          </Section>
        )}

        {accessText && (
          <Section title={t("howToGetIn")}>
            {tr.access_info && (
              <p className="mb-3 whitespace-pre-line text-sm leading-relaxed text-ink">
                {tr.access_info}
              </p>
            )}
            {booking.access_code &&
              (accessVisible ? (
                <>
                  <p className="text-3xl font-bold tracking-[0.3em] text-navy">
                    {booking.access_code}
                  </p>
                  <p className="mt-1 text-sm text-ink">{t("accessCodeWorks")}</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold tracking-[0.3em] text-ink/30 select-none">
                    ••••
                  </p>
                  <p className="mt-1 text-sm text-ink/60">
                    {t("accessCodeHidden")}
                  </p>
                </>
              ))}
          </Section>
        )}

        {(property.wifi_name || property.wifi_password) && (
          <Section title={t("wifi")}>
            {property.wifi_name && (
              <Row label={t("network")} value={property.wifi_name} />
            )}
            {property.wifi_password && (
              <Row label={t("password")} value={property.wifi_password} />
            )}
          </Section>
        )}

        {property.house_rules && (
          <Section title={t("houseRules")}>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {tr.house_rules}
            </p>
          </Section>
        )}

        {property.checkout_info && (
          <Section title={t("atCheckout")}>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {tr.checkout_info}
            </p>
          </Section>
        )}

        {travelGuide && (
          <Section title={t("travelGuide")}>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {tr.travel_guide}
            </p>
            <p className="mt-2 text-xs text-ink/50">
              {t("travelGuideDisclaimer")}
            </p>
          </Section>
        )}

        {property.guide_token && (
          <Section title={t("askAnything")}>
            <div className="mb-3 flex items-start gap-2 text-sm text-ink">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-gold" />
              <p>{t("askAnythingHint")}</p>
            </div>
            <GuideChat
              token={property.guide_token}
              labels={{
                empty: t("chatEmpty"),
                placeholder: t("chatPlaceholder"),
                rateLimit: t("chatRateLimit"),
                error: t("chatError"),
              }}
            />
          </Section>
        )}

        {stayOver &&
          (reviewed ? (
            <Section title={t("reviewThanksTitle")}>
              <p className="text-sm text-ink">{t("reviewThanksBody")}</p>
            </Section>
          ) : (
            <Section title={t("leaveReview")}>
              <form
                action={submitReview.bind(null, token)}
                className="flex flex-col gap-3"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm text-ink/60">
                    {t("reviewRatingLabel")}
                  </span>
                  <select
                    name="rating"
                    defaultValue="5"
                    className="h-10 rounded-lg border border-hairline bg-white px-3 text-sm shadow-sm"
                  >
                    <option value="5">★★★★★ – {t("ratingExcellent")}</option>
                    <option value="4">★★★★ – {t("ratingVeryGood")}</option>
                    <option value="3">★★★ – {t("ratingOk")}</option>
                    <option value="2">★★ – {t("ratingBelow")}</option>
                    <option value="1">★ – {t("ratingPoor")}</option>
                  </select>
                </div>
                <textarea
                  name="comment"
                  rows={3}
                  placeholder={t("reviewPlaceholder")}
                  className="rounded-lg border border-hairline bg-white px-3 py-2 text-sm shadow-sm"
                />
                <Button type="submit">{t("sendReview")}</Button>
              </form>
            </Section>
          ))}

        {canCancel && (
          <Section title={t("cancellation")}>
            <GuestCancel
              cancelAction={cancelBookingAsGuest.bind(null, token)}
              refundNote={refundNote}
              policyLines={policyLines}
              labels={{
                confirmQ: t("cancelConfirmQ"),
                yes: t("cancelYes"),
                cancelling: t("cancelling"),
                undo: t("cancelUndo"),
                button: t("cancelButton"),
              }}
            />
          </Section>
        )}

        <p className="mt-2 text-center text-xs text-ink/60">{t("poweredBy")}</p>
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
