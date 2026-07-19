"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatNok } from "@/lib/utils";

type Item = {
  id: string;
  name: string;
  price: number;
  priceExtraDay: number | null;
};

type RentLabels = {
  days: string;
  quantity: string;
  name: string;
  contact: string;
  total: string;
  submit: string;
  currencySuffix: string;
};

const DEFAULT_LABELS: RentLabels = {
  days: "Antall døgn",
  quantity: "Antall stk",
  name: "Ditt navn",
  contact: "E-post eller telefon (valgfritt)",
  total: "Totalt:",
  submit: "Lei og betal",
  currencySuffix: "",
};

/**
 * Gjestens leieskjema med live totalpris. Første døgn = price, hvert ekstra
 * døgn = priceExtraDay (eller price hvis ikke satt), ganget med antall stk.
 * UI-tekstene kan oversettes via `labels`.
 */
export function RentForm({
  item,
  action,
  labels = DEFAULT_LABELS,
}: {
  item: Item;
  action: (formData: FormData) => void;
  labels?: RentLabels;
}) {
  const [days, setDays] = useState(1);
  const [quantity, setQuantity] = useState(1);

  const extraDay = item.priceExtraDay ?? item.price;
  const perUnit = item.price + extraDay * (Math.max(1, days) - 1);
  const total = perUnit * Math.max(1, quantity);

  return (
    <form action={action} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="item_id" value={item.id} />
      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1 text-xs text-ink/60">
          {labels.days}
          <input
            name="days"
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
            className="h-9 rounded-lg border border-hairline bg-white px-2 text-sm shadow-sm"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs text-ink/60">
          {labels.quantity}
          <input
            name="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, Number(e.target.value) || 1))
            }
            className="h-9 rounded-lg border border-hairline bg-white px-2 text-sm shadow-sm"
          />
        </label>
      </div>
      <input
        name="guest_name"
        required
        placeholder={labels.name}
        className="h-9 rounded-lg border border-hairline bg-white px-2 text-sm shadow-sm"
      />
      <input
        name="guest_contact"
        placeholder={labels.contact}
        className="h-9 rounded-lg border border-hairline bg-white px-2 text-sm shadow-sm"
      />
      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-semibold text-navy">
          {labels.total} {formatNok(total)}
          {labels.currencySuffix}
        </span>
        <Button type="submit" size="sm">
          {labels.submit}
        </Button>
      </div>
    </form>
  );
}
