"use client";

import { useActionState } from "react";

import {
  generatePricing,
  type PricingState,
} from "@/app/dashboard/prising/actions";
import { CopyButton } from "@/components/shared/copy-button";
import { Felt, Handling, Kvittering, Omrade, Velg } from "@/components/hus";

type PropertyOption = { id: string; name: string };

const initial: PricingState = {};

/**
 * AI-prisforslag. Kun presentasjon er endret — samme `generatePricing` og
 * samme felter (property_id, current_price).
 */
export function PricingTool({ properties }: { properties: PropertyOption[] }) {
  const [state, action, pending] = useActionState(generatePricing, initial);

  return (
    <div className="flex flex-col gap-5">
      <form action={action} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Velg
            navn="property_id"
            merke="Eiendom"
            valg={properties.map((p) => ({ verdi: p.id, tekst: p.name }))}
          />
          <Felt
            navn="current_price"
            merke="Prisen din i dag (valgfritt)"
            type="number"
            min={0}
            placeholder="kr per natt"
          />
        </div>
        <Kvittering feil={state.error} />
        <div>
          <Handling type="submit" vekt="gull" disabled={pending}>
            {pending ? "Regner på det …" : "Foreslå priser"}
          </Handling>
        </div>
      </form>

      {state.result && (
        <div className="flex flex-col gap-3 border-t border-hus-linje pt-5">
          <Omrade
            navn="prisforslag"
            merke="Forslaget"
            readOnly
            rows={12}
            value={state.result}
          />
          <div>
            <CopyButton text={state.result} label="Kopier" />
          </div>
        </div>
      )}
    </div>
  );
}
