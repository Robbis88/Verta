"use client";

import { useActionState } from "react";

import { createBoost, type BoostFormState } from "@/app/dashboard/boosts/actions";
import { Felt, Handling, Kvittering, Velg } from "@/components/hus";

const initialState: BoostFormState = {};

/**
 * Nytt boost-skjema — modul 7. Kun presentasjon: samme createBoost og samme
 * felter (property_id, budget_nok, platform, start_date, end_date).
 */
export function BoostForm({
  properties,
}: {
  properties: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createBoost, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Velg
        navn="property_id"
        merke="Eiendom"
        feil={state.fieldErrors?.property_id}
        required
        defaultValue=""
        valg={[
          { verdi: "", tekst: "Velg eiendom" },
          ...properties.map((p) => ({ verdi: p.id, tekst: p.name })),
        ]}
      />

      <Felt
        navn="budget_nok"
        merke="Budsjett (kr)"
        feil={state.fieldErrors?.budget_nok}
        type="number"
        min={100}
        max={10000}
        step={50}
        defaultValue={500}
        required
      />

      <Velg
        navn="platform"
        merke="Plattform"
        feil={state.fieldErrors?.platform}
        required
        defaultValue="both"
        valg={[
          { verdi: "instagram", tekst: "Instagram" },
          { verdi: "facebook", tekst: "Facebook" },
          { verdi: "both", tekst: "Begge" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Felt
          navn="start_date"
          merke="Startdato"
          feil={state.fieldErrors?.start_date}
          type="date"
          required
        />
        <Felt
          navn="end_date"
          merke="Sluttdato"
          feil={state.fieldErrors?.end_date}
          type="date"
          required
        />
      </div>

      <Kvittering feil={state.error} />

      <div>
        <Handling type="submit" vekt="gull" disabled={pending}>
          {pending ? "Lager boost …" : "Lag boost — Verta skriver teksten"}
        </Handling>
      </div>
    </form>
  );
}
