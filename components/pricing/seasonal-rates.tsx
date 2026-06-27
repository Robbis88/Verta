"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import {
  addSeasonalRate,
  deleteSeasonalRate,
  type SeasonalRateState,
} from "@/app/dashboard/prising/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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

  const selected = properties.find((p) => p.id === propertyId);
  const propertySeasons = seasons
    .filter((s) => s.property_id === propertyId)
    .sort((a, b) => a.date_from.localeCompare(b.date_from));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Eiendom</Label>
        <select
          className={selectClass}
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <p className="text-sm text-muted-foreground">
          Basepris:{" "}
          <span className="font-medium text-foreground">
            {selected.base_nightly_rate != null
              ? `${formatNok(Number(selected.base_nightly_rate))} / natt`
              : "ikke satt"}
          </span>
          {selected.cleaning_fee != null &&
            ` · Rengjøring: ${formatNok(Number(selected.cleaning_fee))}`}
          {". "}
          <Link
            href={`/dashboard/properties/${selected.id}`}
            className="underline"
          >
            Endre basepris
          </Link>
        </p>
      )}

      {propertySeasons.length > 0 && (
        <ul className="flex flex-col divide-y rounded-lg border">
          {propertySeasons.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <span className="flex-1 font-medium">{s.name}</span>
              <span className="text-muted-foreground">
                {s.date_from} → {s.date_to}
              </span>
              <span className="w-24 text-right">
                {formatNok(Number(s.nightly_rate))}/natt
              </span>
              <form action={deleteSeasonalRate}>
                <input type="hidden" name="id" value={s.id} />
                <Button type="submit" variant="ghost" size="sm">
                  Fjern
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form
        ref={formRef}
        action={action}
        className="flex flex-col gap-3 border-t pt-4"
      >
        <input type="hidden" name="property_id" value={propertyId} />
        <p className="text-sm font-medium">Legg til sesongpris</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Navn" error={state.fieldErrors?.name}>
            <Input name="name" placeholder="F.eks. Høysesong sommer" required />
          </Field>
          <Field label="Pris/natt (kr)" error={state.fieldErrors?.nightly_rate}>
            <Input
              name="nightly_rate"
              type="number"
              min={1}
              step={1}
              placeholder="F.eks. 2200"
              required
            />
          </Field>
          <Field label="Fra dato" error={state.fieldErrors?.date_from}>
            <Input name="date_from" type="date" required />
          </Field>
          <Field label="Til dato" error={state.fieldErrors?.date_to}>
            <Input name="date_to" type="date" required />
          </Field>
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Lagrer…" : "Legg til sesong"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
