import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  updateTaskByCleaner,
  updateCleanerProfile,
  respondToRequest,
  uploadCleaningPhoto,
  deleteCleaningPhoto,
} from "./actions";
import { signedPhotoUrls } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Photo = {
  id: string;
  task_id: string;
  kind: string;
  storage_path: string;
};

type Cleaner = {
  id: string;
  name: string;
  available_for_hire: boolean | null;
  max_travel_km: number | null;
  hourly_rate: number | null;
  bio: string | null;
  base_address: string | null;
};

type Task = {
  id: string;
  property_id: string;
  task_date: string;
  type: string;
  status: string;
  notes: string | null;
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

export const metadata: Metadata = { title: "Mine oppgaver — Verta" };

export default async function CleanerPortal({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: cleanerData } = await supabase
    .from("cleaners")
    .select("id,name,available_for_hire,max_travel_km,hourly_rate,bio,base_address")
    .eq("access_token", token)
    .maybeSingle();
  if (!cleanerData) notFound();
  const cleaner = cleanerData as Cleaner;

  const { data: taskData } = await supabase
    .from("cleaning_tasks")
    .select("id,property_id,task_date,type,status,notes")
    .eq("cleaner_id", cleaner.id)
    .order("task_date", { ascending: true });
  const tasks = (taskData ?? []) as Task[];

  // Bilder per oppgave + kortlevde signerte URL-er (privat bucket).
  const taskIds = tasks.map((t) => t.id);
  const { data: photoData } = taskIds.length
    ? await supabase
        .from("cleaning_photos")
        .select("id,task_id,kind,storage_path")
        .in("task_id", taskIds)
        .order("created_at", { ascending: true })
    : { data: [] };
  const photos = (photoData ?? []) as Photo[];
  const urlByPath = await signedPhotoUrls(photos.map((p) => p.storage_path));
  const photosByTask = new Map<string, Photo[]>();
  for (const ph of photos) {
    const list = photosByTask.get(ph.task_id) ?? [];
    list.push(ph);
    photosByTask.set(ph.task_id, list);
  }

  const { data: reqData } = await supabase
    .from("service_requests")
    .select("id,property_id,job_date,message,amount,verta_fee")
    .eq("cleaner_id", cleaner.id)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  const requests = (reqData ?? []) as {
    id: string;
    property_id: string;
    job_date: string | null;
    message: string | null;
    amount: number | null;
    verta_fee: number | null;
  }[];

  const propIds = [
    ...new Set([
      ...tasks.map((t) => t.property_id),
      ...requests.map((r) => r.property_id),
    ]),
  ];
  const { data: props } = propIds.length
    ? await supabase.from("properties").select("id,name,address").in("id", propIds)
    : { data: [] };
  const propById = new Map(
    ((props ?? []) as { id: string; name: string; address: string | null }[]).map(
      (p) => [p.id, p],
    ),
  );

  const active = tasks.filter((t) => t.status !== "completed");
  const done = tasks.filter((t) => t.status === "completed");

  return (
    <main className="min-h-screen bg-cloud">
      <header className="bg-navy px-6 py-8 text-white">
        <p className="text-sm text-gold-light">Mine oppgaver</p>
        <h1 className="mt-1 text-2xl font-bold">{cleaner.name}</h1>
      </header>

      <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
        {requests.length > 0 && (
          <div className="rounded-xl border-2 border-gold bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">
              Nye forespørsler ({requests.length})
            </h2>
            <ul className="flex flex-col gap-4">
              {requests.map((r) => (
                <li key={r.id} className="border-t border-hairline pt-3 first:border-0 first:pt-0">
                  <p className="font-semibold text-navy">
                    {propById.get(r.property_id)?.name ?? "Eiendom"}
                  </p>
                  {propById.get(r.property_id)?.address && (
                    <p className="text-sm text-ink/60">
                      {propById.get(r.property_id)?.address}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-ink">
                    {r.job_date ? `Ønsket dato: ${r.job_date}` : "Dato avtales"}
                  </p>
                  {r.amount != null && (
                    <p className="mt-1 text-sm font-medium text-navy">
                      Du tjener {Number(r.amount) - Number(r.verta_fee ?? 0)} kr
                      <span className="font-normal text-ink/60">
                        {" "}
                        (etter Verta-gebyr {Number(r.verta_fee ?? 0)} kr)
                      </span>
                    </p>
                  )}
                  {r.message && (
                    <p className="mt-1 text-sm text-ink/70">«{r.message}»</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <form action={respondToRequest}>
                      <input type="hidden" name="token" value={token} />
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="decision" value="accepted" />
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-gold text-navy hover:bg-gold/90"
                      >
                        Godta
                      </Button>
                    </form>
                    <form action={respondToRequest}>
                      <input type="hidden" name="token" value={token} />
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="decision" value="declined" />
                      <Button type="submit" size="sm" variant="outline">
                        Avslå
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {active.length === 0 ? (
          <p className="rounded-xl border border-hairline bg-white p-6 text-center text-sm text-ink/60">
            Ingen aktive oppgaver akkurat nå. 🎉
          </p>
        ) : (
          active.map((t) => {
            const p = propById.get(t.property_id);
            return (
              <div
                key={t.id}
                className="rounded-xl border border-hairline bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">
                      {p?.name ?? "Eiendom"}
                    </p>
                    {p?.address && (
                      <p className="text-sm text-ink/60">{p.address}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-cloud px-3 py-1 text-xs font-medium text-navy">
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink">
                  {TYPE_LABEL[t.type] ?? t.type} · {t.task_date}
                </p>
                {t.notes && (
                  <p className="mt-1 text-sm text-ink/70">{t.notes}</p>
                )}
                <div className="mt-4 flex gap-2">
                  {t.status !== "in_progress" && (
                    <form action={updateTaskByCleaner}>
                      <input type="hidden" name="token" value={token} />
                      <input type="hidden" name="task_id" value={t.id} />
                      <input type="hidden" name="status" value="in_progress" />
                      <Button type="submit" variant="outline" size="sm">
                        Start
                      </Button>
                    </form>
                  )}
                  <form action={updateTaskByCleaner}>
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="task_id" value={t.id} />
                    <input type="hidden" name="status" value="completed" />
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-gold text-navy hover:bg-gold/90"
                    >
                      Fullfør
                    </Button>
                  </form>
                </div>

                <TaskPhotos
                  token={token}
                  taskId={t.id}
                  photos={photosByTask.get(t.id) ?? []}
                  urlByPath={urlByPath}
                />
              </div>
            );
          })
        )}

        {done.length > 0 && (
          <div className="mt-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
              Fullført ({done.length})
            </p>
            <ul className="flex flex-col gap-1">
              {done.map((t) => (
                <li key={t.id} className="text-sm text-ink/60">
                  ✓ {propById.get(t.property_id)?.name ?? "Eiendom"} · {t.task_date}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-2 rounded-xl border border-hairline bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gold">
            Min profil
          </h2>
          <p className="mb-4 text-sm text-ink/70">
            Vil du ta oppdrag for andre utleiere i nærheten? Slå på og fyll inn,
            så blir du synlig for dem.
          </p>
          <form action={updateCleanerProfile} className="flex flex-col gap-3">
            <input type="hidden" name="token" value={token} />
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                name="available_for_hire"
                defaultChecked={cleaner.available_for_hire ?? false}
                className="h-4 w-4"
              />
              Tilgjengelig for andre oppdrag
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="max_travel_km">Kjører maks (km)</Label>
                <Input
                  id="max_travel_km"
                  name="max_travel_km"
                  type="number"
                  min={0}
                  defaultValue={cleaner.max_travel_km ?? ""}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="hourly_rate">Timepris (kr)</Label>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  min={0}
                  defaultValue={cleaner.hourly_rate ?? ""}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="base_address">Hjemmeadresse (for avstand)</Label>
              <Input
                id="base_address"
                name="base_address"
                defaultValue={cleaner.base_address ?? ""}
                placeholder="Gateadresse, poststed"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bio">Kort om deg (valgfritt)</Label>
              <Input
                id="bio"
                name="bio"
                defaultValue={cleaner.bio ?? ""}
                placeholder="F.eks. erfaren, fleksibel, egne midler"
              />
            </div>
            <div>
              <Button type="submit" className="bg-gold text-navy hover:bg-gold/90">
                Lagre profil
              </Button>
            </div>
          </form>
        </div>

        <p className="mt-2 text-center text-xs text-ink/50">Levert av Verta</p>
      </div>
    </main>
  );
}

function TaskPhotos({
  token,
  taskId,
  photos,
  urlByPath,
}: {
  token: string;
  taskId: string;
  photos: Photo[];
  urlByPath: Map<string, string>;
}) {
  const groups: { kind: "before" | "after"; label: string }[] = [
    { kind: "before", label: "Før" },
    { kind: "after", label: "Etter" },
  ];

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-hairline pt-4">
      {groups.map(({ kind, label }) => {
        const items = photos.filter((p) => p.kind === kind);
        return (
          <div key={kind} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
              {label} ({items.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {items.map((ph) => {
                const url = urlByPath.get(ph.storage_path);
                if (!url) return null;
                return (
                  <div key={ph.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`${label}-bilde`}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                    <form
                      action={deleteCleaningPhoto}
                      className="absolute -right-1.5 -top-1.5"
                    >
                      <input type="hidden" name="token" value={token} />
                      <input type="hidden" name="photo_id" value={ph.id} />
                      <button
                        type="submit"
                        aria-label="Slett bilde"
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-navy text-xs text-white"
                      >
                        ×
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
            <form action={uploadCleaningPhoto} className="flex flex-col gap-1">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="task_id" value={taskId} />
              <input type="hidden" name="kind" value={kind} />
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                required
                className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-cloud file:px-2 file:py-1 file:text-xs file:text-navy"
              />
              <Button type="submit" size="sm" variant="outline">
                Last opp {label.toLowerCase()}-bilde
              </Button>
            </form>
          </div>
        );
      })}
    </div>
  );
}
