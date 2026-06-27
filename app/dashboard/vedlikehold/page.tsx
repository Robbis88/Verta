import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  createRequest,
  updateRequest,
  deleteRequest,
  addContractor,
  deleteContractor,
} from "./actions";
import { formatNok } from "@/lib/utils";
import { CopyButton } from "@/components/shared/copy-button";
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
  contractor_id: string | null;
  cost: number | null;
};

type Contractor = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  trade: string | null;
  access_token: string;
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
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const { data: props } = await supabase
    .from("properties")
    .select("id,name")
    .order("name");
  const properties = (props ?? []) as { id: string; name: string }[];
  const nameById = new Map(properties.map((p) => [p.id, p.name]));

  const { data: contractorData } = await supabase
    .from("contractors")
    .select("id,name,email,phone,trade,access_token")
    .order("name");
  const contractors = (contractorData ?? []) as Contractor[];
  const contractorById = new Map(contractors.map((c) => [c.id, c.name]));

  const { data: reqData } = await supabase
    .from("maintenance_requests")
    .select(
      "id,property_id,title,description,status,priority,assignee,contractor_id,cost",
    )
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
          <CardTitle>Håndverkere ({contractors.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Registrer håndverkere og gi dem en egen lenke der de ser og
            oppdaterer sakene du tildeler dem — uten innlogging.
          </p>
          <form
            action={addContractor}
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="c-name">Navn</Label>
              <Input id="c-name" name="name" required />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="c-trade">Fag</Label>
              <Input id="c-trade" name="trade" placeholder="F.eks. rørlegger" />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="c-email">E-post</Label>
              <Input id="c-email" name="email" type="email" />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="c-phone">Telefon</Label>
              <Input id="c-phone" name="phone" />
            </div>
            <Button type="submit">Legg til</Button>
          </form>

          {contractors.length > 0 && (
            <ul className="flex flex-col divide-y">
              {contractors.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="font-medium">
                    {c.name}
                    {c.trade && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {c.trade}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <CopyButton
                      text={`${site}/handverker/${c.access_token}`}
                      label="Kopier portal-lenke"
                    />
                    <form action={deleteContractor}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Slett
                      </Button>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

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
                        {r.contractor_id && contractorById.has(r.contractor_id)
                          ? ` · ${contractorById.get(r.contractor_id)}`
                          : r.assignee
                            ? ` · ${r.assignee}`
                            : ""}
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
                      <Label className="text-xs">Håndverker</Label>
                      <select
                        name="contractor_id"
                        defaultValue={r.contractor_id ?? ""}
                        className={`${inputClass} w-40`}
                      >
                        <option value="">Ikke tildelt</option>
                        {contractors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
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
