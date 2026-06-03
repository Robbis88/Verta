"use client";

import { useActionState } from "react";

import type { BookingFormState } from "@/app/properties/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BookingAction = (
  prev: BookingFormState,
  formData: FormData,
) => Promise<BookingFormState>;

const initialState: BookingFormState = {};

export function BookingForm({ action }: { action: BookingAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.success) {
    return (
      <div className="rounded-lg border border-hairline bg-cloud p-6 text-center">
        <p className="text-lg font-semibold text-navy">Takk for bestillingen!</p>
        <p className="mt-1 text-sm text-ink">
          Eieren har mottatt forespørselen og tar kontakt.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Navn" error={state.fieldErrors?.guest_name}>
        <Input name="guest_name" required />
      </Field>
      <Field label="E-post" error={state.fieldErrors?.guest_email}>
        <Input name="guest_email" type="email" />
      </Field>
      <Field label="Telefon" error={state.fieldErrors?.guest_phone}>
        <Input name="guest_phone" type="tel" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Innsjekk" error={state.fieldErrors?.check_in}>
          <Input name="check_in" type="date" required />
        </Field>
        <Field label="Utsjekk" error={state.fieldErrors?.check_out}>
          <Input name="check_out" type="date" required />
        </Field>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sender…" : "Send bestilling"}
      </Button>
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
