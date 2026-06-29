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
import { haversineMeters } from "@/lib/geo";
import { signedPhotoUrls } from "@/lib/storage";
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
  clock_in_at: string | null;
  clock_out_at: string | null;
  clock_in_lat: number | null;
  clock_in_lng: number | null;
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
    .select("id,name,lat,lng")
    .order("name");
  const properties = (props ?? []) as {
    id: string;
    name: string;
    lat: number | null;
    lng: number | null;
  }[];
  const nameById = new Map(properties.map((p) => [p.id, p.name]));
  const propById = new Map(properties.map((p) => [p.id, p]));
  const cleanerById = new Map(cleaners.map((c) => [c.id, c.name]));

  const { data: taskData } = await supabase
    .from("cleaning_tasks")
    .select(
      "id,property_id,cleaner_id,task_date,type,status,clock_in_at,clock_out_at,clock_in_lat,clock_in_lng",
    )
    .order("task_date", { ascending: true });
  const tasks = (taskData ?? []) as Task[];

  // Vaskebilder per oppgave (RLS gir kun egne eiendommer) + signerte URL-er.
  const { data: photoData } = await supabase
    .from("cleaning_photos")
    .select("id,task_id,kind,storage_path")
    .order("created_at", { ascending: true });
  const photos = (photoData ?? []) as {
    id: string;
    task_id: string;
    kind: string;
    storage_path: string;
  }[];
  const urlByPath = await signedPhotoUrls(photos.map((p) => p.storage_path));
  const photosByTask = new Map<string, typeof photos>();
  for (const ph of photos) {
    const list = photosByTask.get(ph.task_id) ?? [];
    list.push(ph);
    photosByTask.set(ph.task_id, list);
  }

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
                  {t.clock_in_at &&
                    (() => {
                      const prop = propById.get(t.property_id);
                      const dist =
                        t.clock_in_lat != null &&
                        t.clock_in_lng != null &&
                        prop?.lat != null &&
                        prop?.lng != null
                          ? haversineMeters(
                              { lat: t.clock_in_lat, lng: t.clock_in_lng },
                              { lat: prop.lat, lng: prop.lng },
                            )
                          : null;
                      const fmt = (s: string) =>
                        new Date(s).toLocaleTimeString("nb-NO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      return (
                        <div className="flex basis-full flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
                          <span>
                            Inn {fmt(t.clock_in_at)}
                            {t.clock_out_at ? ` · ut ${fmt(t.clock_out_at)}` : ""}
                          </span>
                          {dist != null && (
                            <span
                              className={
                                dist <= 300 ? "text-emerald-600" : "text-amber-600"
                              }
                            >
                              {dist} m fra eiendommen
                            </span>
                          )}
                          {t.clock_in_lat != null && t.clock_in_lng != null && (
                            <a
                              href={`https://www.google.com/maps?q=${t.clock_in_lat},${t.clock_in_lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-foreground"
                            >
                              Vis på kart
                            </a>
                          )}
                        </div>
                      );
                    })()}
                  {(photosByTask.get(t.id)?.length ?? 0) > 0 && (
                    <div className="flex basis-full flex-wrap gap-2 pt-1">
                      {(photosByTask.get(t.id) ?? []).map((ph) => {
                        const url = urlByPath.get(ph.storage_path);
                        if (!url) return null;
                        return (
                          <a
                            key={ph.id}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={ph.kind === "before" ? "Før" : "Etter"}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={ph.kind === "before" ? "Før" : "Etter"}
                              className="h-14 w-14 rounded-md object-cover ring-1 ring-hairline"
                            />
                          </a>
                        );
                      })}
                    </div>
                  )}
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
