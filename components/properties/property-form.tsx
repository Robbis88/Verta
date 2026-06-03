"use client";

import { useActionState } from "react";

import type { PropertyFormState } from "@/app/dashboard/properties/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
};

const initialState: PropertyFormState = {};

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

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}

      <Field label="Navn" error={state.fieldErrors?.name}>
        <Input name="name" defaultValue={defaults?.name ?? ""} required />
      </Field>

      <Field label="Adresse" error={state.fieldErrors?.address}>
        <Input name="address" defaultValue={defaults?.address ?? ""} />
      </Field>

      <Field label="Beskrivelse" error={state.fieldErrors?.description}>
        <Textarea
          name="description"
          defaultValue={defaults?.description ?? ""}
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Soverom" error={state.fieldErrors?.bedrooms}>
          <Input
            name="bedrooms"
            type="number"
            min={0}
            defaultValue={defaults?.bedrooms ?? ""}
          />
        </Field>
        <Field label="Bad" error={state.fieldErrors?.bathrooms}>
          <Input
            name="bathrooms"
            type="number"
            min={0}
            defaultValue={defaults?.bathrooms ?? ""}
          />
        </Field>
        <Field label="Maks gjester" error={state.fieldErrors?.max_guests}>
          <Input
            name="max_guests"
            type="number"
            min={1}
            defaultValue={defaults?.max_guests ?? ""}
          />
        </Field>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Lagrer…" : submitLabel}
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
