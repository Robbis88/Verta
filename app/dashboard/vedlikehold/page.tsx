import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createRequest, updateRequest, deleteRequest } from "./actions";
import { formatNok } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Request = {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee: string | null;
  cost: number | null;
};

const STATUS = [
  ["open", "Åpen"],
  ["in_progress", "Pågår"],
  ["resolved", "Løst"],
  ["cancelled", "Avbrutt"],
] as const;
const PRIORITY = [
  ["low", "Lav"],
  ["normal", "Normal"],
  ["high", "Høy"],
  ["urgent", "Haster"],
] as const;
const PRIORITY_STYLE: Record<string, string> = {
  urgent: "text-red-600",
  high: "text-amber-600",
  normal: "text-ink",
  low: "text-ink/50",
};

const inputClass =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function VedlikeholdPage() {
  await requireUser();
  const supabase = await createClient();

  const { data: props } = await supabase
    .from("properties")
    .select("id,name")
    .order("name");
  const properties = (props ?? []) as { id: string; name: string }[];
  const nameById = new Map(properties.map((p) => [p.id, p.name]));

  const { data: reqData } = await supabase
    .from("maintenance_requests")
    .select("id,property_id,title,description,status,priority,assignee,cost")
    .order("created_at", { ascending: false });
  const requests = (reqData ?? []) as Request[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Vedlikehold</h1>
        <p className="text-sm text-muted-foreground">
          Hold styr på saker. Løser du en sak med kostnad, føres den automatisk
          som fradragsberettiget utgift i skatterapporten.
        </p>
      </div>

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
            <CardTitle>Ny sak</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createRequest} className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
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
                <div className="flex flex-col gap-1.5">
                  <Label>Prioritet</Label>
                  <select name="priority" className={inputClass} defaultValue="normal">
                    {PRIORITY.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Tittel</Label>
                <Input id="title" name="title" required placeholder="F.eks. Lekkasje under kjøkkenvask" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
                <Textarea id="description" name="description" rows={2} />
              </div>
              <div>
                <Button type="submit">Opprett sak</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Saker ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen saker ennå.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {requests.map((r) => (
                <li key={r.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {nameById.get(r.property_id) ?? "—"} ·{" "}
                        <span className={PRIORITY_STYLE[r.priority]}>
                          {PRIORITY.find(([v]) => v === r.priority)?.[1] ??
                            r.priority}
                        </span>
                      </p>
                      {r.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {r.description}
                        </p>
                      )}
                    </div>
                    <form action={deleteRequest}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Slett
                      </Button>
                    </form>
                  </div>

                  <form
                    action={updateRequest}
                    className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3"
                  >
                    <input type="hidden" name="id" value={r.id} />
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Status</Label>
                      <select name="status" defaultValue={r.status} className={inputClass}>
                        {STATUS.map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Prioritet</Label>
                      <select name="priority" defaultValue={r.priority} className={inputClass}>
                        {PRIORITY.map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Ansvarlig</Label>
                      <Input
                        name="assignee"
                        defaultValue={r.assignee ?? ""}
                        placeholder="Håndverker"
                        className="h-9 w-36"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Kostnad (kr)</Label>
                      <Input
                        name="cost"
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={r.cost ?? ""}
                        className="h-9 w-28"
                      />
                    </div>
                    <Button type="submit" size="sm" variant="outline">
                      Lagre
                    </Button>
                    {r.cost != null && r.status === "resolved" && (
                      <span className="text-xs text-emerald-600">
                        → {formatNok(Number(r.cost))} i skatt
                      </span>
                    )}
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
