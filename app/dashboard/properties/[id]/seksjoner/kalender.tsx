import { AvailabilityCalendar } from "@/components/calendar/availability-calendar";
import { SmartLockCode } from "@/components/smartlock/smartlock-code";
import { Kopier } from "@/components/hus/kopier";
import {
  Beskjed,
  Felt,
  Flate,
  Handling,
  Liste,
  Merke,
  Rad,
  Velg,
} from "@/components/hus";
import { addIcalUrl, removeIcalUrl, syncIcal } from "../../ical-actions";
import { connectSmartLock, disconnectSmartLock } from "../../smartlock-actions";
import type { IcalUrl } from "@/lib/types";

/**
 * Kalender og lås — modul 9. Seksjon av eiendomssiden, kun presentasjon.
 * Samme iCal-actions og samme smartlås-actions.
 */

export type SmartLock = {
  id: string;
  status: string;
  device_id: string;
  provider: string;
};

export function Kalender({
  propertyId,
  slug,
  siteUrl,
  bookedDates,
  fromISO,
  icalUrls,
  lock,
  lockResult,
}: {
  propertyId: string;
  slug: string;
  siteUrl: string;
  bookedDates: string[];
  fromISO: string;
  icalUrls: IcalUrl[];
  lock: SmartLock | null;
  lockResult?: string;
}) {
  const eksportUrl = `${siteUrl}/api/calendar/${slug}`;

  return (
    <>
      <Flate
        tittel="Tilgjengelighet"
        hva="Overstrøkne datoer er allerede booket."
      >
        <div className="flex flex-col gap-6">
          <AvailabilityCalendar
            bookedDates={bookedDates}
            fromISO={fromISO}
            months={3}
          />
          <div className="flex flex-col gap-2 border-t border-hus-linje pt-5">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-hus-svak">
              Kalendersynk (iCal)
            </span>
            <p className="text-sm text-hus-dempet">
              Lim denne lenken inn i Airbnb/Booking for å blokkere
              Verta-bookede datoer:
            </p>
            <div className="flex items-center justify-between gap-3">
              <code className="min-w-0 flex-1 break-all rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-hus-dempet">
                {eksportUrl}
              </code>
              <Kopier tekst={eksportUrl} />
            </div>
          </div>
        </div>
      </Flate>

      <Flate
        tittel="Importer kalender (iCal)"
        hva="Bookinger fra Airbnb og Booking.com blokkerer datoene her."
      >
        <div className="flex flex-col gap-4">
          {icalUrls.length > 0 && (
            <Liste>
              {icalUrls.map((u) => (
                <Rad
                  key={u.url}
                  hva={u.source}
                  detalj={u.url}
                  handling={
                    <form action={removeIcalUrl}>
                      <input type="hidden" name="property_id" value={propertyId} />
                      <input type="hidden" name="url" value={u.url} />
                      <Handling type="submit" vekt="naken">
                        Fjern
                      </Handling>
                    </form>
                  }
                />
              ))}
            </Liste>
          )}

          <form action={addIcalUrl} className="flex flex-col gap-4">
            <input type="hidden" name="property_id" value={propertyId} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Felt
                navn="url"
                merke="iCal-lenke"
                type="url"
                required
                placeholder="https://www.airbnb.no/calendar/ical/…"
              />
              <Velg
                navn="source"
                merke="Kilde"
                defaultValue="airbnb"
                valg={[
                  { verdi: "airbnb", tekst: "Airbnb" },
                  { verdi: "booking", tekst: "Booking.com" },
                ]}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Handling type="submit" vekt="stille">
                Legg til
              </Handling>
            </div>
          </form>

          {icalUrls.length > 0 && (
            <form action={syncIcal}>
              <input type="hidden" name="property_id" value={propertyId} />
              <Handling type="submit" vekt="gull">
                Synk nå
              </Handling>
            </form>
          )}
        </div>
      </Flate>

      <Flate
        tittel="Smartlås"
        hva="Hver booking får sin egen adgangskode, automatisk."
      >
        <div className="flex flex-col gap-4">
          {lockResult === "connected" && (
            <Beskjed>Smartlåsen er koblet til.</Beskjed>
          )}
          {lockResult === "error" && (
            <Beskjed tone="kritisk">
              Vi fikk ikke koblet til låsen. Prøv på nytt.
            </Beskjed>
          )}

          {lock && lock.status !== "pending" ? (
            <>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Merke tone="god">{lock.status}</Merke>
                <span className="text-hus-svak">
                  {lock.provider} · {lock.device_id}
                </span>
              </div>
              <SmartLockCode />
              <form action={disconnectSmartLock}>
                <input type="hidden" name="id" value={lock.id} />
                <input type="hidden" name="property_id" value={propertyId} />
                <Handling type="submit" vekt="naken">
                  Koble fra
                </Handling>
              </form>
            </>
          ) : (
            <form action={connectSmartLock} className="flex flex-col gap-4">
              <input type="hidden" name="property_id" value={propertyId} />
              <p className="text-sm leading-relaxed text-hus-dempet">
                Koble til smartlåsen din (Nuki, Igloohome eller Salto) for
                automatiske adgangskoder ved booking.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Handling type="submit" vekt="gull">
                  Koble til smartlås
                </Handling>
                <Handling href="/dashboard/smartlas-guide" vekt="naken">
                  Hvilken lås bør jeg kjøpe?
                </Handling>
              </div>
            </form>
          )}
        </div>
      </Flate>
    </>
  );
}
