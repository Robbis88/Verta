"use client";

import { useActionState } from "react";

import type { PropertyFormState } from "@/app/dashboard/properties/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddressAutocomplete } from "@/components/properties/address-autocomplete";
import { AMENITY_CATEGORIES } from "@/lib/amenities";

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
  base_nightly_rate?: number | null;
  cleaning_fee?: number | null;
  access_info?: string | null;
  wifi_name?: string | null;
  wifi_password?: string | null;
  house_rules?: string | null;
  checkout_info?: string | null;
  booking_mode?: "instant" | "request" | null;
  amenities?: string[] | null;
  beds?: number | null;
  sleeping_arrangements?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  video_url?: string | null;
  market_value?: number | null;
  loan_amount?: number | null;
  interest_rate?: number | null;
  monthly_principal?: number | null;
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
  const selectedAmenities = new Set(defaults?.amenities ?? []);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}

      <Field label="Navn" error={state.fieldErrors?.name}>
        <Input name="name" defaultValue={defaults?.name ?? ""} required />
      </Field>

      <Field
        label="Adresse (gate, husnummer, postnummer og poststed)"
        error={state.fieldErrors?.address}
      >
        <AddressAutocomplete defaultValue={defaults?.address ?? ""} />
        <p className="text-xs text-muted-foreground">
          Begynn å skrive, så foreslår Kartverket adresser — velg riktig, så
          plasseres eiendommen automatisk på kartet.
        </p>
      </Field>

      <Field label="Beskrivelse" error={state.fieldErrors?.description}>
        <Textarea
          name="description"
          defaultValue={defaults?.description ?? ""}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Soverom" error={state.fieldErrors?.bedrooms}>
          <Input
            name="bedrooms"
            type="number"
            min={0}
            defaultValue={defaults?.bedrooms ?? ""}
          />
        </Field>
        <Field label="Senger" error={state.fieldErrors?.beds}>
          <Input
            name="beds"
            type="number"
            min={0}
            defaultValue={defaults?.beds ?? ""}
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

      <Field label="Soveromsoppsett" error={state.fieldErrors?.sleeping_arrangements}>
        <Textarea
          name="sleeping_arrangements"
          rows={2}
          placeholder="F.eks: Soverom 1: dobbeltseng. Soverom 2: to enkeltsenger. Stue: sovesofa."
          defaultValue={defaults?.sleeping_arrangements ?? ""}
        />
      </Field>

      <div className="flex flex-col gap-3">
        <Label>Fasiliteter</Label>
        {AMENITY_CATEGORIES.map((cat) => (
          <div key={cat.id} className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {cat.label}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {cat.items.map((a) => (
                <label key={a.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="amenities"
                    value={a.key}
                    defaultChecked={selectedAmenities.has(a.key)}
                    className="h-4 w-4"
                  />
                  {a.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Innsjekk fra" error={state.fieldErrors?.check_in_time}>
          <Input
            name="check_in_time"
            type="time"
            defaultValue={defaults?.check_in_time ?? ""}
          />
        </Field>
        <Field label="Utsjekk innen" error={state.fieldErrors?.check_out_time}>
          <Input
            name="check_out_time"
            type="time"
            defaultValue={defaults?.check_out_time ?? ""}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Pris per natt (kr)" error={state.fieldErrors?.base_nightly_rate}>
          <Input
            name="base_nightly_rate"
            type="number"
            min={0}
            step={1}
            placeholder="F.eks. 1500"
            defaultValue={defaults?.base_nightly_rate ?? ""}
          />
        </Field>
        <Field label="Rengjøringsgebyr (kr)" error={state.fieldErrors?.cleaning_fee}>
          <Input
            name="cleaning_fee"
            type="number"
            min={0}
            step={1}
            placeholder="F.eks. 600"
            defaultValue={defaults?.cleaning_fee ?? ""}
          />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Brukes til å regne ut totalpris automatisk på bookinger. Sesongpriser
        setter du under{" "}
        <a href="/dashboard/prising" className="underline">
          Prising
        </a>
        .
      </p>

      <div className="flex flex-col gap-1.5">
        <Label>Økonomi (for Eiendomsøkonomi)</Label>
        <p className="text-xs text-muted-foreground">
          Brukes til balanse, egenkapital, belåningsgrad og renter. Valgfritt.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Antatt verdi (kr)" error={state.fieldErrors?.market_value}>
            <Input
              name="market_value"
              type="number"
              min={0}
              placeholder="F.eks. 3500000"
              defaultValue={defaults?.market_value ?? ""}
            />
          </Field>
          <Field label="Lån (kr)" error={state.fieldErrors?.loan_amount}>
            <Input
              name="loan_amount"
              type="number"
              min={0}
              placeholder="F.eks. 2100000"
              defaultValue={defaults?.loan_amount ?? ""}
            />
          </Field>
          <Field label="Rente (%)" error={state.fieldErrors?.interest_rate}>
            <Input
              name="interest_rate"
              type="number"
              min={0}
              step={0.01}
              placeholder="F.eks. 5.4"
              defaultValue={defaults?.interest_rate ?? ""}
            />
          </Field>
          <Field label="Avdrag per måned (kr)" error={state.fieldErrors?.monthly_principal}>
            <Input
              name="monthly_principal"
              type="number"
              min={0}
              placeholder="F.eks. 4000"
              defaultValue={defaults?.monthly_principal ?? ""}
            />
          </Field>
        </div>
      </div>

      <Field label="Bookingmodus" error={state.fieldErrors?.booking_mode}>
        <select
          name="booking_mode"
          defaultValue={defaults?.booking_mode ?? "instant"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="instant">
            Instant — gjesten booker og betaler med en gang
          </option>
          <option value="request">
            Forespørsel — du godkjenner hver gjest før betaling
          </option>
        </select>
        <p className="text-xs text-muted-foreground">
          Ved «Forespørsel» sender gjesten en forespørsel du kan godkjenne eller
          avslå. Godkjenner du, låses datoene og gjesten betaler 50 % depositum
          innen 24 timer.
        </p>
      </Field>

      <Field
        label="Tilkomstinfo (nøkkelboks / innsjekk)"
        error={state.fieldErrors?.access_info}
      >
        <Textarea
          name="access_info"
          rows={3}
          placeholder="F.eks: Nøkkelboks til høyre for inngangsdøren, kode 1234. Parkering på baksiden."
          defaultValue={defaults?.access_info ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          Sendes til gjesten i bookingbekreftelsen. Har eiendommen smartlås,
          lages en unik kode automatisk i stedet.
        </p>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="WiFi-navn" error={state.fieldErrors?.wifi_name}>
          <Input name="wifi_name" defaultValue={defaults?.wifi_name ?? ""} />
        </Field>
        <Field label="WiFi-passord" error={state.fieldErrors?.wifi_password}>
          <Input
            name="wifi_password"
            defaultValue={defaults?.wifi_password ?? ""}
          />
        </Field>
      </div>

      <Field label="Husregler" error={state.fieldErrors?.house_rules}>
        <Textarea
          name="house_rules"
          rows={3}
          placeholder="F.eks: Røyking forbudt. Ro etter kl. 23. Maks 6 gjester."
          defaultValue={defaults?.house_rules ?? ""}
        />
      </Field>

      <Field label="Utsjekk-info" error={state.fieldErrors?.checkout_info}>
        <Textarea
          name="checkout_info"
          rows={2}
          placeholder="F.eks: Utsjekk innen kl. 11. Søppel i container ved porten. Lås døra."
          defaultValue={defaults?.checkout_info ?? ""}
        />
      </Field>

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
