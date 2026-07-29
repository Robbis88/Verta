"use client";

import { useActionState } from "react";

import {
  saveBoostText,
  regenerateBoostCopy,
  type BoostFormState,
} from "@/app/dashboard/boosts/actions";
import { Handling, Kvittering, Omrade } from "@/components/hus";

const initialState: BoostFormState = {};

/**
 * Redigering av annonseteksten — modul 7. Kun presentasjon: samme
 * saveBoostText (id, text) og samme regenerateBoostCopy (id).
 */
export function BoostEditor({
  id,
  defaultText,
}: {
  id: string;
  defaultText: string;
}) {
  const [state, action, pending] = useActionState(saveBoostText, initialState);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={id} />
        <Omrade
          navn="text"
          merke="Annonsetekst"
          defaultValue={defaultText}
          rows={6}
          placeholder="Annonsetekst …"
        />
        <Kvittering feil={state.error} />
        <div>
          <Handling type="submit" vekt="gull" disabled={pending}>
            {pending ? "Lagrer …" : "Lagre tekst"}
          </Handling>
        </div>
      </form>

      <form action={regenerateBoostCopy}>
        <input type="hidden" name="id" value={id} />
        <Handling type="submit" vekt="stille">
          Generer ny tekst med AI
        </Handling>
      </form>
    </div>
  );
}
