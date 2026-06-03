"use client";

import { useActionState } from "react";

import { createBoost, type BoostFormState } from "@/app/dashboard/boosts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: BoostFormState = {};

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function BoostForm({
  properties,
}: {
  properties: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createBoost, initialState);

  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      <Field label="Eiendom" error={state.fieldErrors?.property_id}>
        <select name="property_id" required className={selectClass} defaultValue="">
          <option value="" disabled>
            Velg eiendom
          </option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Budsjett (kr)" error={state.fieldErrors?.budget_nok}>
        <Input
          name="budget_nok"
          type="number"
          min={100}
          max={10000}
          step={50}
          defaultValue={500}
          required
        />
      </Field>

      <Field label="Plattform" error={state.fieldErrors?.platform}>
        <select name="platform" required className={selectClass} defaultValue="both">
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="both">Begge</option>
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Startdato" error={state.fieldErrors?.start_date}>
          <Input name="start_date" type="date" required />
        </Field>
        <Field label="Sluttdato" error={state.fieldErrors?.end_date}>
          <Input name="end_date" type="date" required />
        </Field>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Lager boost…" : "Lag boost (AI skriver annonsetekst)"}
        </Button>
      </div>
    </form>
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
