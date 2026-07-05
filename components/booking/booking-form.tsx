"use client";

import { useActionState, useRef, useState } from "react";

import type { BookingFormState } from "@/app/properties/[slug]/actions";
import type { Quote } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNok } from "@/lib/utils";

type BookingAction = (
  prev: BookingFormState,
  formData: FormData,
) => Promise<BookingFormState>;

type QuoteAction = (checkIn: string, checkOut: string) => Promise<Quote | null>;

const initialState: BookingFormState = {};

export function BookingForm({
  action,
  quoteAction,
  policyLines = [],
  mode = "instant",
}: {
  action: BookingAction;
  quoteAction?: QuoteAction;
  policyLines?: string[];
  mode?: "instant" | "request";
}) {
  const isRequest = mode === "request";
  const [state, formAction, pending] = useActionState(action, initialState);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const reqId = useRef(0);

  // Henter pristilbud når begge datoene er satt. Siste forespørsel vinner.
  function refreshQuote(ci: string, co: string) {
    if (!quoteAction || !ci || !co || co <= ci) {
      setQuote(null);
      return;
    }
    const id = ++reqId.current;
    quoteAction(ci, co).then((q) => {
      if (id === reqId.current) setQuote(q);
    });
  }

  if (state.success) {
    return (
      <div className="rounded-lg border border-hairline bg-cloud p-6 text-center">
        <p className="text-lg font-semibold text-navy">
          {state.requested ? "Forespørsel sendt!" : "Takk for bestillingen!"}
        </p>
        <p className="mt-1 text-sm text-ink">
          {state.requested
            ? "Verten vurderer forespørselen og du får svar på e-post. Godkjennes den, betaler du et depositum for å låse oppholdet."
            : "Eieren har mottatt forespørselen og tar kontakt."}
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
          <Input
            name="check_in"
            type="date"
            required
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              refreshQuote(e.target.value, checkOut);
            }}
          />
        </Field>
        <Field label="Utsjekk" error={state.fieldErrors?.check_out}>
          <Input
            name="check_out"
            type="date"
            required
            value={checkOut}
            onChange={(e) => {
              setCheckOut(e.target.value);
              refreshQuote(checkIn, e.target.value);
            }}
          />
        </Field>
      </div>

      {isRequest && (
        <>
          <Field label="Antall gjester" error={state.fieldErrors?.num_guests}>
            <Input name="num_guests" type="number" min={1} />
          </Field>
          <Field
            label="Melding til verten (valgfritt)"
            error={state.fieldErrors?.guest_message}
          >
            <textarea
              name="guest_message"
              rows={3}
              placeholder="Fortell litt om hvem dere er og formålet med oppholdet."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            />
          </Field>
        </>
      )}

      {quote && (
        <div className="flex flex-col gap-1 rounded-lg border border-hairline bg-cloud p-3 text-sm text-navy">
          <div className="flex justify-between">
            <span>
              {formatNok(quote.nightlyTotal / quote.nights)} × {quote.nights}{" "}
              {quote.nights === 1 ? "natt" : "netter"}
            </span>
            <span>{formatNok(quote.nightlyTotal)}</span>
          </div>
          {quote.cleaningFee > 0 && (
            <div className="flex justify-between">
              <span>Rengjøring</span>
              <span>{formatNok(quote.cleaningFee)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-hairline pt-1 font-semibold">
            <span>Totalt</span>
            <span>{formatNok(quote.total)}</span>
          </div>
        </div>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {policyLines.length > 0 && (
        <div className="rounded-lg bg-cloud p-3">
          <p className="text-xs font-medium text-navy">
            Avbestillingsregler for denne bestillingen
          </p>
          <ul className="mt-1 list-disc pl-5 text-xs leading-relaxed text-ink/70">
            {policyLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {isRequest && quote && (
        <p className="text-xs text-ink/70">
          Godkjenner verten forespørselen, betaler du{" "}
          <span className="font-medium text-navy">
            50 % depositum ({formatNok(quote.total / 2)})
          </span>{" "}
          innen 24 timer for å låse oppholdet. Resten må betales senest 7 dager
          før innsjekk — ellers avbestilles oppholdet og depositumet beholdes.
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending
          ? "Sender…"
          : isRequest
            ? "Send forespørsel"
            : "Send bestilling"}
      </Button>
      <p className="text-center text-xs text-ink/60">
        {isRequest
          ? "Ved å sende forespørsel godtar du avbestillingsreglene over."
          : "Ved å bestille godtar du avbestillingsreglene over."}
      </p>
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
