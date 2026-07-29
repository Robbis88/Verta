import { formatNok } from "@/lib/utils";
import { BookingAddForm } from "@/components/bookings/booking-add-form";
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button";
import { Kopier } from "@/components/hus/kopier";
import {
  Felt,
  Flate,
  Handling,
  Kort,
  Liste,
  Merke,
  Rad,
  Tomt,
} from "@/components/hus";
import {
  createOwnerBooking,
  approveBooking,
  rejectBooking,
} from "../../booking-actions";
import { updateStayExtras } from "../../actions";
import type { Booking } from "@/lib/types";

/**
 * Bookinger — modul 9. Seksjon av eiendomssiden, kun presentasjon. Samme
 * actions og samme felter; statusteksten er den samme logikken som før.
 */

/** Én linje som forteller hvor bookingen står økonomisk. */
function betalingstekst(b: Booking): { tekst: string; tone: "ro" | "obs" | "gull" } | null {
  if (b.status === "approved") return { tekst: "venter depositum", tone: "obs" };
  if (b.payment_status === "paid") {
    const rest =
      b.remaining_amount != null &&
      Number(b.remaining_amount) > 0 &&
      !b.remaining_paid;
    return {
      tekst: rest
        ? `depositum betalt · rest ${formatNok(Number(b.remaining_amount))}`
        : "betalt",
      tone: "gull",
    };
  }
  if (b.payment_status === "refunded") return { tekst: "refundert", tone: "ro" };
  return null;
}

export function Bookinger({
  propertyId,
  siteUrl,
  requests,
  activeBookings,
  lateCheckoutPrice,
  earlyCheckinPrice,
}: {
  propertyId: string;
  siteUrl: string;
  requests: Booking[];
  activeBookings: Booking[];
  lateCheckoutPrice: number | null;
  earlyCheckinPrice: number | null;
}) {
  return (
    <>
      <Flate
        tittel="Sen utsjekk / tidlig innsjekk"
        hva="Selges som betalt tillegg — men bare når kalenderen tillater det."
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-hus-dempet">
            Gjesten kjøper det selv på gjestesiden, og bare når ingen ny gjest
            kommer samme dag. Pengene går rett til deg. Tomt felt = ikke tilbudt.
          </p>
          <form action={updateStayExtras} className="flex flex-col gap-4">
            <input type="hidden" name="property_id" value={propertyId} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Felt
                navn="late_checkout_price"
                merke="Sen utsjekk (kr)"
                type="number"
                min={0}
                step="1"
                defaultValue={lateCheckoutPrice ?? ""}
                placeholder="f.eks. 300"
              />
              <Felt
                navn="early_checkin_price"
                merke="Tidlig innsjekk (kr)"
                type="number"
                min={0}
                step="1"
                defaultValue={earlyCheckinPrice ?? ""}
                placeholder="f.eks. 300"
              />
            </div>
            <div>
              <Handling type="submit" vekt="gull">
                Lagre
              </Handling>
            </div>
          </form>
        </div>
      </Flate>

      <Flate
        tittel="Legg til booking"
        hva="Registrer også Airbnb- og Booking-gjester her, så får de gjestelenken."
      >
        <BookingAddForm action={createOwnerBooking.bind(null, propertyId)} />
      </Flate>

      {requests.length > 0 && (
        <Flate
          tittel={`Forespørsler (${requests.length})`}
          hva="Godkjenner du, låses datoene og gjesten betaler depositum."
        >
          <div className="flex flex-col gap-3">
            {requests.map((b) => (
              <Kort key={b.id}>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-hus-blekk">{b.guest_name}</span>
                    <span className="text-sm tabular-nums text-hus-dempet">
                      {b.check_in} → {b.check_out}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-hus-svak">
                    {b.guest_email && <span>{b.guest_email}</span>}
                    {b.num_guests != null && <span>{b.num_guests} gjester</span>}
                    {b.total_price != null && (
                      <span className="tabular-nums">
                        {formatNok(Number(b.total_price))} totalt
                      </span>
                    )}
                  </div>
                  {b.guest_message && (
                    <p className="whitespace-pre-line rounded-lg bg-white/[0.03] p-3 text-xs leading-relaxed text-hus-dempet">
                      {b.guest_message}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <form action={approveBooking}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="property_id" value={propertyId} />
                      <Handling type="submit" vekt="gull">
                        Godkjenn
                      </Handling>
                    </form>
                    <form action={rejectBooking}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="property_id" value={propertyId} />
                      <Handling type="submit" vekt="stille">
                        Avslå
                      </Handling>
                    </form>
                  </div>
                </div>
              </Kort>
            ))}
          </div>
        </Flate>
      )}

      <Flate
        tittel={`Bookinger (${activeBookings.length})`}
        hva="Trykk «Kopier melding» for å sende gjesten sin egen side."
      >
        {activeBookings.length === 0 ? (
          <Tomt
            tittel="Ingen bookinger ennå."
            hva="Legg inn Airbnb- og Booking-gjester her også, så får de gjestesiden med innsjekk-info og WiFi."
          />
        ) : (
          <Liste>
            {activeBookings.map((b) => {
              const betaling = betalingstekst(b);
              return (
                <Rad
                  key={b.id}
                  hva={
                    <span className="flex items-center gap-2">
                      <span className="truncate">{b.guest_name}</span>
                      <Merke>{b.source}</Merke>
                      {betaling && (
                        <Merke tone={betaling.tone}>{betaling.tekst}</Merke>
                      )}
                    </span>
                  }
                  detalj={`${b.check_in} → ${b.check_out}`}
                  verdi={
                    b.total_price ? formatNok(Number(b.total_price)) : undefined
                  }
                  tone="gull"
                  mer={
                    <div className="flex flex-wrap items-center gap-2">
                      {b.status !== "cancelled" && b.guest_token && (
                        <>
                          <a
                            href={`/gjest/${b.guest_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-hus-svak underline transition-colors hover:text-hus-blekk"
                          >
                            Gjesteside
                          </a>
                          <Kopier tekst={`${siteUrl}/gjest/${b.guest_token}`} />
                          <Kopier
                            merke="Kopier melding"
                            tekst={`Hei${b.guest_name ? " " + b.guest_name : ""}! Her er din digitale gjesteside for oppholdet — innsjekk, WiFi, dørkode og alt du trenger på ett sted:\n${siteUrl}/gjest/${b.guest_token}\n\nHi! Here's your digital guest page with check-in info, WiFi and everything for your stay:\n${siteUrl}/gjest/${b.guest_token}`}
                          />
                        </>
                      )}
                      {b.status !== "cancelled" && (
                        <a
                          href={`/dashboard/skade/${b.id}`}
                          className="text-xs text-hus-obs underline transition-colors hover:text-hus-blekk"
                        >
                          Meld skade
                        </a>
                      )}
                      {b.status === "cancelled" ? (
                        <span className="text-xs text-hus-svak">avbrutt</span>
                      ) : (
                        <CancelBookingButton id={b.id} propertyId={propertyId} />
                      )}
                    </div>
                  }
                />
              );
            })}
          </Liste>
        )}
      </Flate>
    </>
  );
}
