"use client";

import { useActionState } from "react";

import { createExpense, type ExpenseState } from "@/app/dashboard/utgifter/actions";
import { Felt, Handling, Kvittering, Velg } from "@/components/hus";

type PropertyOption = { id: string; name: string };

const initial: ExpenseState = {};

const CATEGORIES = [
  { verdi: "cleaning", tekst: "Rengjøring" },
  { verdi: "maintenance", tekst: "Vedlikehold" },
  { verdi: "supplies", tekst: "Forbruksvarer" },
  { verdi: "utilities", tekst: "Strøm / kommunale" },
  { verdi: "insurance", tekst: "Forsikring" },
  { verdi: "fee", tekst: "Gebyr" },
  { verdi: "other", tekst: "Annet" },
];

/**
 * Skjema for ny utgift — konvertert til husets primitiver (modul 1).
 *
 * Kun presentasjon er endret. Samme `createExpense`-action, samme
 * `name`-attributter (property_id, category, amount, expense_date,
 * description), samme validering og samme feilhåndtering via useActionState.
 */
export function ExpenseForm({ properties }: { properties: PropertyOption[] }) {
  const [state, action, pending] = useActionState(createExpense, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Velg
          navn="property_id"
          merke="Eiendom"
          feil={state.fieldErrors?.property_id}
          valg={properties.map((p) => ({ verdi: p.id, tekst: p.name }))}
        />
        <Velg
          navn="category"
          merke="Kategori"
          defaultValue="cleaning"
          valg={CATEGORIES}
        />
        <Felt
          navn="amount"
          merke="Beløp (kr)"
          type="number"
          min={1}
          step="0.01"
          required
          placeholder="0"
          feil={state.fieldErrors?.amount}
        />
        <Felt
          navn="expense_date"
          merke="Dato"
          type="date"
          required
          feil={state.fieldErrors?.expense_date}
        />
      </div>

      <Felt
        navn="description"
        merke="Beskrivelse (valgfritt)"
        placeholder="F.eks. vaskebyrå mai"
      />

      <Kvittering feil={state.error} ok={state.ok ? "Utgiften er ført." : undefined} />

      <div>
        <Handling type="submit" vekt="gull" disabled={pending}>
          {pending ? "Lagrer …" : "Før utgiften"}
        </Handling>
      </div>
    </form>
  );
}
