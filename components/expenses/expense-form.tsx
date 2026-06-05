"use client";

import { useActionState } from "react";

import { createExpense, type ExpenseState } from "@/app/dashboard/utgifter/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PropertyOption = { id: string; name: string };

const initial: ExpenseState = {};

const CATEGORIES = [
  ["cleaning", "Rengjøring"],
  ["maintenance", "Vedlikehold"],
  ["supplies", "Forbruksvarer"],
  ["utilities", "Strøm / kommunale"],
  ["insurance", "Forsikring"],
  ["fee", "Gebyr"],
  ["other", "Annet"],
] as const;

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ExpenseForm({ properties }: { properties: PropertyOption[] }) {
  const [state, action, pending] = useActionState(createExpense, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Eiendom</Label>
          <select name="property_id" className={selectClass}>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {state.fieldErrors?.property_id && (
            <p className="text-xs text-destructive">{state.fieldErrors.property_id}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Kategori</Label>
          <select name="category" className={selectClass} defaultValue="cleaning">
            {CATEGORIES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Beløp (kr)</Label>
          <Input id="amount" name="amount" type="number" min={1} step="0.01" required />
          {state.fieldErrors?.amount && (
            <p className="text-xs text-destructive">{state.fieldErrors.amount}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expense_date">Dato</Label>
          <Input id="expense_date" name="expense_date" type="date" required />
          {state.fieldErrors?.expense_date && (
            <p className="text-xs text-destructive">{state.fieldErrors.expense_date}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
        <Input id="description" name="description" placeholder="F.eks. vaskebyrå mai" />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-600">Utgift lagt til ✓</p>}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Lagrer…" : "Legg til utgift"}
        </Button>
      </div>
    </form>
  );
}
