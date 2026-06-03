"use client";

import { useActionState } from "react";

import {
  saveBoostText,
  regenerateBoostCopy,
  type BoostFormState,
} from "@/app/dashboard/boosts/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: BoostFormState = {};

export function BoostEditor({
  id,
  defaultText,
}: {
  id: string;
  defaultText: string;
}) {
  const [state, action, pending] = useActionState(saveBoostText, initialState);

  return (
    <div className="flex flex-col gap-3">
      <form action={action} className="flex flex-col gap-2">
        <input type="hidden" name="id" value={id} />
        <Textarea
          name="text"
          defaultValue={defaultText}
          className="min-h-32"
          placeholder="Annonsetekst…"
        />
        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Lagrer…" : "Lagre tekst"}
          </Button>
        </div>
      </form>

      <form action={regenerateBoostCopy}>
        <input type="hidden" name="id" value={id} />
        <Button type="submit" variant="outline">
          Generer ny tekst med AI
        </Button>
      </form>
    </div>
  );
}
