import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  addCleaner,
  deleteCleaner,
  createTask,
  assignTask,
  deleteTask,
  generateTasks,
} from "./actions";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Cleaner = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  access_token: string;
};
type Task = {
  id: string;
  property_id: string;
  cleaner_id: string | null;
  task_date: string;
  type: string;
  status: string;
};

const TYPE_LABEL: Record<string, string> = {
  turnover: "Utvask",
  deep: "Hovedrengjøring",
  periodic: "Periodisk",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Ny",
  assigned: "Tildelt",
  in_progress: "Pågår",
  completed: "Fullført",
};

const inputClass =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function RengjoringPage() {
  await requireUser();
  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const { data: cleanerData } = await supabase
    .from("cleaners")
    .select("id,name,email,phone,access_token")
    .order("name");
  const cleaners = (cleanerData ?? []) as Cleaner[];

  const { data: props } = await supabase
    .from("properties")
    .select("id,name")
    .order("name");
  const properties = (props ?? []) as { id: string; name: string }[];
  const nameById = new Map(properties.map((p) => [p.id, p.name]));
  const cleanerById = new Map(cleaners.map((c) => [c.id, c.name]));

  const { data: taskData } = await supabase
    .from("cleaning_tasks")
    .select("id,property_id,cleaner_id,task_date,type,status")
    .order("task_date", { ascending: true });
  const tasks = (taskData ?? []) as Task[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Rengjøring</h1>
        <p className="text-sm text-muted-foreground">
          Auto-oppgaver ved utsjekk, tildel til vaskere, og gi dem en egen
          lenke der de ser og fullfører oppgavene sine.
        </p>
      </div>

      {/* Vaskere */}
      <Card>
        <CardHeader>
          <CardTitle>Vaskere ({cleaners.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            action={addCleaner}
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="name">Navn</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" />
            </div>
            <Button type="submit">Legg til</Button>
          </form>

          {cleaners.length > 0 && (
            <ul className="flex flex-col divide-y">
              {cleaners.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="flex items-center gap-1">
                    <CopyButton
                      text={`${site}/vasker/${c.access_token}`}
                      label="Kopier portal-lenke"
                    />
                    <form action={deleteCleaner}>
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

      {/* Oppgaver */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Oppgaver ({tasks.length})</CardTitle>
          <form action={generateTasks}>
            <Button type="submit" variant="outline" size="sm">
              Generer fra bookinger
            </Button>
          </form>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {properties.length > 0 && (
            <form
              action={createTask}
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <div className="flex flex-1 flex-col gap-1.5">
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
                <Label>Dato</Label>
                <Input name="task_date" type="date" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <select name="type" className={inputClass} defaultValue="turnover">
                  <option value="turnover">Utvask</option>
                  <option value="deep">Hovedrengjøring</option>
                  <option value="periodic">Periodisk</option>
                </select>
              </div>
              <Button type="submit" variant="outline">
                Legg til
              </Button>
            </form>
          )}

          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen oppgaver ennå. Trykk «Generer fra bookinger».
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="w-24 text-muted-foreground">{t.task_date}</span>
                  <span className="flex-1">
                    {nameById.get(t.property_id) ?? "—"} ·{" "}
                    {TYPE_LABEL[t.type] ?? t.type}
                  </span>
                  <Badge>{STATUS_LABEL[t.status] ?? t.status}</Badge>
                  <form action={assignTask} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={t.id} />
                    <select
                      name="cleaner_id"
                      defaultValue={t.cleaner_id ?? ""}
                      className={inputClass}
                    >
                      <option value="">Ikke tildelt</option>
                      {cleaners.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="ghost" size="sm">
                      Lagre
                    </Button>
                  </form>
                  <form action={deleteTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Slett
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          {cleaners.length === 0 && tasks.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Legg til en vasker over for å kunne tildele oppgaver.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
