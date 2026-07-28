"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import {
  addSeasonalRate,
  deleteSeasonalRate,
  type SeasonalRateState,
} from "@/app/dashboard/prising/actions";
import {
  Felt,
  Handling,
  Kvittering,
  Liste,
  Rad,
  Velg,
} from "@/components/hus";
import { formatNok } from "@/lib/utils";

export type PriceProperty = {
  id: string;
  name: string;
  base_nightly_rate: number | null;
  cleaning_fee: number | null;
};

export type Season = {
  id: string;
  property_id: string;
  name: string;
  date_from: string;
  date_to: string;
  nightly_rate: number;
};

const initial: SeasonalRateState = {};

/**
 * Basepris og sesongpriser. Kun presentasjon er endret — samme
 * `addSeasonalRate`/`deleteSeasonalRate` og samme felter (property_id, name,
 * nightly_rate, date_from, date_to).
 */
export function SeasonalRates({
  properties,
  seasons,
}: {
  properties: PriceProperty[];
  seasons: Season[];
}) {
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [state, action, pending] = useActionState(addSeasonalRate, initial);
  const formRef = useRef<HTMLFormElement>(null);

  // Tøm skjemaet etter vellykket lagring.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  const valgt = properties.find((p) => p.id === propertyId);
  const propertySeasons = seasons
    .filter((s) => s.property_id === propertyId)
    .sort((a, b) => a.date_from.localeCompare(b.date_from));

  return (
    <div className="flex flex-col gap-5">
      <Velg
        navn="bolig_velger"
        merke="Eiendom"
        value={propertyId}
        onChange={(e) => setPropertyId(e.target.value)}
        valg={properties.map((p) => ({ verdi: p.id, tekst: p.name }))}
      />

      {valgt && (
        <p className="text-sm text-hus-dempet">
          Baseprisen er{" "}
          <span className="text-hus-blekk">
            {valgt.base_nightly_rate != null
              ? `${formatNok(Number(valgt.base_nightly_rate))} per natt`
              : "ikke satt ennå"}
          </span>
          {valgt.cleaning_fee != null &&
            `, og rengjøring koster ${formatNok(Number(valgt.cleaning_fee))}`}
          .{" "}
          <Link
            href={`/dashboard/properties/${valgt.id}`}
            className="text-hus-gull underline underline-offset-4"
          >
            Endre baseprisen
          </Link>
        </p>
      )}

      {propertySeasons.length > 0 && (
        <Liste>
          {propertySeasons.map((s) => (
            <Rad
              key={s.id}
              hva={s.name}
              detalj={`${s.date_from} → ${s.date_to}`}
              verdi={`${formatNok(Number(s.nightly_rate))}/natt`}
              tone="gull"
              handling={
                <form action={deleteSeasonalRate}>
                  <input type="hidden" name="id" value={s.id} />
                  <Handling type="submit" vekt="naken">
                    Fjern
                  </Handling>
                </form>
              }
            />
          ))}
        </Liste>
      )}

      <form
        ref={formRef}
        action={action}
        className="flex flex-col gap-4 border-t border-hus-linje pt-5"
      >
        <input type="hidden" name="property_id" value={propertyId} />
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-hus-gull">
          Legg til en sesong
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Felt
            navn="name"
            merke="Navn"
            placeholder="F.eks. Høysesong sommer"
            required
            feil={state.fieldErrors?.name}
          />
          <Felt
            navn="nightly_rate"
            merke="Pris per natt (kr)"
            type="number"
            min={1}
            step={1}
            placeholder="F.eks. 2200"
            required
            feil={state.fieldErrors?.nightly_rate}
          />
          <Felt
            navn="date_from"
            merke="Fra dato"
            type="date"
            required
            feil={state.fieldErrors?.date_from}
          />
          <Felt
            navn="date_to"
            merke="Til dato"
            type="date"
            required
            feil={state.fieldErrors?.date_to}
          />
        </div>
        <Kvittering feil={state.error} />
        <div>
          <Handling type="submit" vekt="gull" disabled={pending}>
            {pending ? "Lagrer …" : "Legg til sesongen"}
          </Handling>
        </div>
      </form>
    </div>
  );
}
