"use client";

import { useActionState } from "react";

import type { OwnerBookingState } from "@/app/dashboard/properties/booking-actions";
import { Felt, Handling, Kvittering, Velg } from "@/components/hus";

/**
 * Legg til booking manuelt — modul 9. Kun presentasjon; samme felter
 * (guest_name, source, check_in, check_out, total_price).
 */

type Action = (
  prev: OwnerBookingState,
  formData: FormData,
) => Promise<OwnerBookingState>;

const initialState: OwnerBookingState = {};

const KILDER = [
  { verdi: "airbnb", tekst: "Airbnb" },
  { verdi: "booking", tekst: "Booking.com" },
  { verdi: "verta_direct", tekst: "Direkte" },
  { verdi: "verta_instagram", tekst: "Instagram (Verta)" },
  { verdi: "verta_facebook", tekst: "Facebook (Verta)" },
];

export function BookingAddForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Felt
          navn="guest_name"
          merke="Gjestenavn"
          feil={state.fieldErrors?.guest_name}
          required
        />
        <Velg
          navn="source"
          merke="Kilde"
          feil={state.fieldErrors?.source}
          defaultValue="airbnb"
          valg={KILDER}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Felt
          navn="check_in"
          merke="Innsjekk"
          feil={state.fieldErrors?.check_in}
          type="date"
          required
        />
        <Felt
          navn="check_out"
          merke="Utsjekk"
          feil={state.fieldErrors?.check_out}
          type="date"
          required
        />
        <Felt
          navn="total_price"
          merke="Pris (kr)"
          feil={state.fieldErrors?.total_price}
          type="number"
          min={0}
          step={100}
        />
      </div>

      <Kvittering
        feil={state.error}
        ok={state.ok ? "Booking lagret." : undefined}
      />

      <div>
        <Handling type="submit" vekt="gull" disabled={pending}>
          {pending ? "Lagrer …" : "Legg til booking"}
        </Handling>
      </div>
    </form>
  );
}
