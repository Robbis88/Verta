"use client";

import { useActionState } from "react";
import { ChevronDown } from "lucide-react";

import type { PropertyFormState } from "@/app/dashboard/properties/actions";
import { Felt, Handling, Kvittering, Omrade, Velg } from "@/components/hus";
import { AddressAutocomplete } from "@/components/properties/address-autocomplete";
import { AMENITY_CATEGORIES } from "@/lib/amenities";

/**
 * Eiendomsskjemaet — modul 9. Kun presentasjon: hvert `name` er identisk med
 * før, så createProperty og updateProperty ser nøyaktig samme FormData.
 */

type PropertyAction = (
  prev: PropertyFormState,
  formData: FormData,
) => Promise<PropertyFormState>;

export type PropertyDefaults = {
  id?: string;
  name?: string;
  address?: string | null;
  description?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  max_guests?: number | null;
  base_nightly_rate?: number | null;
  cleaning_fee?: number | null;
  access_info?: string | null;
  wifi_name?: string | null;
  wifi_password?: string | null;
  house_rules?: string | null;
  checkout_info?: string | null;
  appliances_info?: string | null;
  booking_mode?: "instant" | "request" | null;
  amenities?: string[] | null;
  beds?: number | null;
  sleeping_arrangements?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  video_url?: string | null;
  listed?: boolean | null;
  market_value?: number | null;
  loan_amount?: number | null;
  interest_rate?: number | null;
  monthly_principal?: number | null;
};

const initialState: PropertyFormState = {};

/** Én linje som forklarer feltet over den. */
function Hint({ children }: { children: React.ReactNode }) {
  return <p className="-mt-1 text-xs leading-relaxed text-hus-svak">{children}</p>;
}

/** Merkelapp for de få feltene som ikke er et rent Felt/Velg/Omrade. */
function Merkelapp({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-hus-svak">
      {children}
    </span>
  );
}

export function PropertyForm({
  action,
  defaults,
  submitLabel,
}: {
  action: PropertyAction;
  defaults?: PropertyDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const selectedAmenities = new Set(defaults?.amenities ?? []);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}

      <Felt
        navn="name"
        merke="Navn"
        feil={state.fieldErrors?.name}
        defaultValue={defaults?.name ?? ""}
        required
      />

      <div className="flex flex-col gap-2">
        <Merkelapp>Adresse (gate, husnummer, postnummer og poststed)</Merkelapp>
        <AddressAutocomplete defaultValue={defaults?.address ?? ""} />
        {state.fieldErrors?.address && (
          <p className="text-xs text-hus-kritisk">{state.fieldErrors.address}</p>
        )}
        <Hint>
          Begynn å skrive, så foreslår Kartverket adresser — velg riktig, så
          plasseres eiendommen automatisk på kartet.
        </Hint>
      </div>

      <Omrade
        navn="description"
        merke="Beskrivelse"
        feil={state.fieldErrors?.description}
        defaultValue={defaults?.description ?? ""}
      />

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-hus-linje p-4">
        <input
          type="checkbox"
          name="listed"
          defaultChecked={defaults?.listed ?? false}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-hus-gull)]"
        />
        <span>
          <span className="block text-sm text-hus-blekk">
            Vis i markedsplassen
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-hus-svak">
            På = eiendommen dukker opp i søk på verta.no og forsiden. Av = kun
            tilgjengelig via lenken du deler selv.
          </span>
        </span>
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Felt
          navn="bedrooms"
          merke="Soverom"
          feil={state.fieldErrors?.bedrooms}
          type="number"
          min={0}
          defaultValue={defaults?.bedrooms ?? ""}
        />
        <Felt
          navn="beds"
          merke="Senger"
          feil={state.fieldErrors?.beds}
          type="number"
          min={0}
          defaultValue={defaults?.beds ?? ""}
        />
        <Felt
          navn="bathrooms"
          merke="Bad"
          feil={state.fieldErrors?.bathrooms}
          type="number"
          min={0}
          defaultValue={defaults?.bathrooms ?? ""}
        />
        <Felt
          navn="max_guests"
          merke="Maks gjester"
          feil={state.fieldErrors?.max_guests}
          type="number"
          min={1}
          defaultValue={defaults?.max_guests ?? ""}
        />
      </div>

      <Omrade
        navn="sleeping_arrangements"
        merke="Soveromsoppsett"
        feil={state.fieldErrors?.sleeping_arrangements}
        rows={2}
        placeholder="F.eks: Soverom 1: dobbeltseng. Soverom 2: to enkeltsenger. Stue: sovesofa."
        defaultValue={defaults?.sleeping_arrangements ?? ""}
      />

      <div className="flex flex-col gap-2">
        <Merkelapp>Fasiliteter</Merkelapp>
        <Hint>
          Trykk på en gruppe for å åpne den. Tallet viser hvor mange du har
          valgt.
        </Hint>
        {AMENITY_CATEGORIES.map((cat) => {
          const chosen = cat.items.filter((a) =>
            selectedAmenities.has(a.key),
          ).length;
          return (
            <details
              key={cat.id}
              className="group rounded-xl border border-hus-linje"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm text-hus-blekk [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  {cat.label}
                  {chosen > 0 && (
                    <span className="rounded-full border border-hus-linje-sterk px-2 py-0.5 text-[11px] font-medium text-hus-gull-lys">
                      {chosen}
                    </span>
                  )}
                </span>
                <ChevronDown className="size-4 shrink-0 text-hus-svak transition group-open:rotate-180" />
              </summary>
              <div className="grid grid-cols-2 gap-2 border-t border-hus-linje px-4 py-3 sm:grid-cols-3">
                {cat.items.map((a) => (
                  <label
                    key={a.key}
                    className="flex cursor-pointer items-center gap-2 text-sm text-hus-dempet"
                  >
                    <input
                      type="checkbox"
                      name="amenities"
                      value={a.key}
                      defaultChecked={selectedAmenities.has(a.key)}
                      className="h-4 w-4 shrink-0 accent-[var(--color-hus-gull)]"
                    />
                    {a.label}
                  </label>
                ))}
              </div>
            </details>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Felt
          navn="check_in_time"
          merke="Innsjekk fra"
          feil={state.fieldErrors?.check_in_time}
          type="time"
          defaultValue={defaults?.check_in_time ?? ""}
        />
        <Felt
          navn="check_out_time"
          merke="Utsjekk innen"
          feil={state.fieldErrors?.check_out_time}
          type="time"
          defaultValue={defaults?.check_out_time ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Felt
          navn="base_nightly_rate"
          merke="Pris per natt (kr)"
          feil={state.fieldErrors?.base_nightly_rate}
          type="number"
          min={0}
          step={1}
          placeholder="F.eks. 1500"
          defaultValue={defaults?.base_nightly_rate ?? ""}
        />
        <Felt
          navn="cleaning_fee"
          merke="Rengjøringsgebyr (kr)"
          feil={state.fieldErrors?.cleaning_fee}
          type="number"
          min={0}
          step={1}
          placeholder="F.eks. 600"
          defaultValue={defaults?.cleaning_fee ?? ""}
        />
      </div>
      <Hint>
        Brukes til å regne ut totalpris automatisk på bookinger. Sesongpriser
        setter du under{" "}
        <a href="/dashboard/prising" className="text-hus-dempet underline">
          Prising
        </a>
        .
      </Hint>

      <p className="rounded-xl border border-hus-linje bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-hus-svak">
        Verdi, lån, rente og avdrag redigeres nå under{" "}
        <span className="text-hus-dempet">Eiendomsøkonomi</span> — der du også
        ser egenkapital, belåningsgrad og kontantstrøm.
      </p>

      <Velg
        navn="booking_mode"
        merke="Bookingmodus"
        feil={state.fieldErrors?.booking_mode}
        defaultValue={defaults?.booking_mode ?? "instant"}
        valg={[
          {
            verdi: "instant",
            tekst: "Instant — gjesten booker og betaler med en gang",
          },
          {
            verdi: "request",
            tekst: "Forespørsel — du godkjenner hver gjest før betaling",
          },
        ]}
      />
      <Hint>
        Ved «Forespørsel» sender gjesten en forespørsel du kan godkjenne eller
        avslå. Godkjenner du, låses datoene og gjesten betaler 50 % depositum
        innen 24 timer.
      </Hint>

      <Omrade
        navn="access_info"
        merke="Tilkomstinfo (nøkkelboks / innsjekk)"
        feil={state.fieldErrors?.access_info}
        rows={3}
        placeholder="F.eks: Nøkkelboks til høyre for inngangsdøren, kode 1234. Parkering på baksiden."
        defaultValue={defaults?.access_info ?? ""}
      />
      <Hint>
        Sendes til gjesten i bookingbekreftelsen. Har eiendommen smartlås, lages
        en unik kode automatisk i stedet.
      </Hint>

      <div className="grid grid-cols-2 gap-4">
        <Felt
          navn="wifi_name"
          merke="WiFi-navn"
          feil={state.fieldErrors?.wifi_name}
          defaultValue={defaults?.wifi_name ?? ""}
        />
        <Felt
          navn="wifi_password"
          merke="WiFi-passord"
          feil={state.fieldErrors?.wifi_password}
          defaultValue={defaults?.wifi_password ?? ""}
        />
      </div>

      <Omrade
        navn="house_rules"
        merke="Husregler"
        feil={state.fieldErrors?.house_rules}
        rows={3}
        placeholder="F.eks: Røyking forbudt. Ro etter kl. 23. Maks 6 gjester."
        defaultValue={defaults?.house_rules ?? ""}
      />

      <Omrade
        navn="checkout_info"
        merke="Utsjekk-info"
        feil={state.fieldErrors?.checkout_info}
        rows={2}
        placeholder="F.eks: Utsjekk innen kl. 11. Søppel i container ved porten. Lås døra."
        defaultValue={defaults?.checkout_info ?? ""}
      />

      <Omrade
        navn="appliances_info"
        merke="Slik funker det (for gjesteguiden)"
        feil={state.fieldErrors?.appliances_info}
        rows={4}
        placeholder="F.eks: Varmepumpe: trykk ON på fjernkontrollen, still 22°. TV: bruk Telenor-fjernkontrollen, kilde HDMI 1. Peis: bruk kun tørr ved fra kurven."
        defaultValue={defaults?.appliances_info ?? ""}
      />
      <Hint>
        AI-assistenten i gjesteguiden svarer gjestene ut fra dette (og WiFi,
        husregler osv.).
      </Hint>

      <Kvittering feil={state.error} />

      <div>
        <Handling type="submit" vekt="gull" disabled={pending}>
          {pending ? "Lagrer …" : submitLabel}
        </Handling>
      </div>
    </form>
  );
}
