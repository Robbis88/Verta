"use client";

import { useActionState } from "react";

import type { OwnerBookingState } from "@/app/dashboard/properties/booking-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Action = (
  prev: OwnerBookingState,
  formData: FormData,
) => Promise<OwnerBookingState>;

const initialState: OwnerBookingState = {};

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function BookingAddForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Gjestenavn" error={state.fieldErrors?.guest_name}>
          <Input name="guest_name" required />
        </Field>
        <Field label="Kilde" error={state.fieldErrors?.source}>
          <select name="source" className={selectClass} defaultValue="airbnb">
            <option value="airbnb">Airbnb</option>
            <option value="booking">Booking.com</option>
            <option value="verta_direct">Direkte</option>
            <option value="verta_instagram">Instagram (Verta)</option>
            <option value="verta_facebook">Facebook (Verta)</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Innsjekk" error={state.fieldErrors?.check_in}>
          <Input name="check_in" type="date" required />
        </Field>
        <Field label="Utsjekk" error={state.fieldErrors?.check_out}>
          <Input name="check_out" type="date" required />
        </Field>
        <Field label="Pris (kr)" error={state.fieldErrors?.total_price}>
          <Input name="total_price" type="number" min={0} step={100} />
        </Field>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && (
        <p className="text-sm text-emerald-600">Booking lagret.</p>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Lagrer…" : "Legg til booking"}
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
