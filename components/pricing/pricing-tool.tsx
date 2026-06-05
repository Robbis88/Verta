"use client";

import { useActionState } from "react";

import {
  generatePricing,
  type PricingState,
} from "@/app/dashboard/prising/actions";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PropertyOption = { id: string; name: string };

const initial: PricingState = {};

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PricingTool({ properties }: { properties: PropertyOption[] }) {
  const [state, action, pending] = useActionState(generatePricing, initial);

  return (
    <div className="flex flex-col gap-4">
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
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current_price">Nåværende pris/natt (valgfritt)</Label>
            <Input
              id="current_price"
              name="current_price"
              type="number"
              min={0}
              placeholder="kr"
            />
          </div>
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Analyserer…" : "Foreslå priser"}
          </Button>
        </div>
      </form>

      {state.result && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <Label>Prisforslag</Label>
          <Textarea readOnly rows={12} value={state.result} />
          <div>
            <CopyButton text={state.result} label="Kopier" />
          </div>
        </div>
      )}
    </div>
  );
}
