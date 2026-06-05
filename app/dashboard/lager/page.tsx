import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  addSupply,
  adjustSupply,
  refillSupply,
  deleteSupply,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Supply = {
  id: string;
  property_id: string;
  name: string;
  current_qty: number;
  low_threshold: number;
  unit: string | null;
};

const inputClass =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function AdjustButton({ id, delta, label }: { id: string; delta: number; label: string }) {
  return (
    <form action={adjustSupply}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="delta" value={delta} />
      <Button type="submit" variant="outline" size="sm" className="h-7 w-7 p-0">
        {label}
      </Button>
    </form>
  );
}

export default async function LagerPage() {
  await requireUser();
  const supabase = await createClient();

  const { data: props } = await supabase
    .from("properties")
    .select("id,name")
    .order("name");
  const properties = (props ?? []) as { id: string; name: string }[];
  const nameById = new Map(properties.map((p) => [p.id, p.name]));

  const { data: supplyData } = await supabase
    .from("supplies")
    .select("id,property_id,name,current_qty,low_threshold,unit")
    .order("name");
  const supplies = (supplyData ?? []) as Supply[];

  const low = supplies.filter((s) => s.current_qty <= s.low_threshold);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Lager</h1>
        <p className="text-sm text-muted-foreground">
          Hold styr på forbruksvarer per eiendom. Når noe går lavt, dukker det
          opp på handlelista automatisk.
        </p>
      </div>

      {/* Handleliste (lavt nivå) */}
      <Card>
        <CardHeader>
          <CardTitle>Handleliste ({low.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {low.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Alt er godt forsynt. 👍
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {low.map((s) => {
                const buy = Math.max(1, s.low_threshold * 2 - s.current_qty);
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span className="flex-1">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        ({nameById.get(s.property_id) ?? "—"})
                      </span>
                    </span>
                    <span className="text-amber-600">
                      Kjøp ~{buy} {s.unit ?? "stk"}
                    </span>
                    <form action={refillSupply}>
                      <input type="hidden" name="id" value={s.id} />
                      <Button type="submit" variant="outline" size="sm">
                        Fyll opp
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Legg til en eiendom først.{" "}
            <Link href="/dashboard/properties/new" className="underline">
              Legg til eiendom
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Ny vare</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={addSupply}
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <div className="flex flex-col gap-1.5">
                <Label>Eiendom</Label>
                <select name="property_id" className={inputClass}>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="name">Vare</Label>
                <Input id="name" name="name" required placeholder="F.eks. Toalettpapir" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="current_qty">Antall</Label>
                <Input id="current_qty" name="current_qty" type="number" min={0} defaultValue={0} className="w-20" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="low_threshold">Lavt ved</Label>
                <Input id="low_threshold" name="low_threshold" type="number" min={0} defaultValue={1} className="w-20" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="unit">Enhet</Label>
                <Input id="unit" name="unit" placeholder="stk" className="w-20" />
              </div>
              <Button type="submit">Legg til</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Beholdning ({supplies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {supplies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen varer registrert.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {supplies.map((s) => {
                const isLow = s.current_qty <= s.low_threshold;
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span className="flex-1">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        ({nameById.get(s.property_id) ?? "—"})
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <AdjustButton id={s.id} delta={-1} label="−" />
                      <span
                        className={`w-14 text-center font-medium ${
                          isLow ? "text-amber-600" : ""
                        }`}
                      >
                        {s.current_qty} {s.unit ?? ""}
                      </span>
                      <AdjustButton id={s.id} delta={1} label="+" />
                    </div>
                    <span className="w-20 text-right text-xs text-muted-foreground">
                      lavt ≤ {s.low_threshold}
                    </span>
                    <form action={deleteSupply}>
                      <input type="hidden" name="id" value={s.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Slett
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
