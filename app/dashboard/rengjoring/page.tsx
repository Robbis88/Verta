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
import { Kopier } from "@/components/hus/kopier";
import {
  Felt,
  feltKlasse,
  Flate,
  Handling,
  Liste,
  Merke,
  Rad,
  Side,
  Situasjon,
  Tomt,
  Velg,
} from "@/components/hus";

/**
 * Rengjøring — modul 4 i UI-refaktoren. Kun presentasjon.
 *
 * Samme seks handlinger med samme felter: addCleaner, deleteCleaner,
 * createTask, assignTask (property_id/task_date/type, id/cleaner_id),
 * deleteTask, generateTasks. GPS-avstand, klokkeslett og vaskebilder er
 * uendret — de ligger nå i `mer`-sporet under hver rad.
 */

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
const STATUS_TONE: Record<string, "ro" | "obs" | "gull" | "god"> = {
  pending: "obs",
  assigned: "ro",
  in_progress: "gull",
  completed: "god",
};

function klokke(s: string): string {
  return new Date(s).toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function kortDato(iso: string): string {
  return new Date(`${iso}T00:00:00Z`)
    .toLocaleDateString("nb-NO", { day: "numeric", month: "short", timeZone: "UTC" })
    .replace(".", "");
}

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

  const { data: taskData } = await supabase
    .from("cleaning_tasks")
    .select(
      "id,property_id,cleaner_id,task_date,type,status,clock_in_at,clock_out_at,clock_in_lat,clock_in_lng",
    )
    .order("task_date", { ascending: true });
  const tasks = (taskData ?? []) as Task[];

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

  const idag = new Date().toISOString().slice(0, 10);
  const utildelt = tasks.filter(
    (t) => !t.cleaner_id && t.status !== "completed" && t.task_date >= idag,
  );
  const kommende = tasks.filter(
    (t) => t.status !== "completed" && t.task_date >= idag,
  );

  return (
    <Side>
      <Situasjon
        merke="Rengjøring"
        tittel={
          tasks.length === 0
            ? "Ingen vask er planlagt ennå."
            : utildelt.length > 0
              ? `${utildelt.length} ${utildelt.length === 1 ? "vask mangler" : "vasker mangler"} en vasker.`
              : kommende.length > 0
                ? `${kommende.length} ${kommende.length === 1 ? "vask" : "vasker"} står i kalenderen, alle tildelt.`
                : "Alt er vasket."
        }
        under="Verta lager en utvask-oppgave automatisk på hver utsjekk. Vaskerne får sin egen lenke — de trenger ingen konto."
        handling={
          <form action={generateTasks}>
            <Handling
              type="submit"
              vekt={tasks.length === 0 ? "gull" : "stille"}
            >
              Generer fra bookinger
            </Handling>
          </form>
        }
      />

      <Flate
        tittel={`Vaskere (${cleaners.length})`}
        hva="Portal-lenken lar dem se og fullføre sine egne oppgaver — uten innlogging."
      >
        <form action={addCleaner} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Felt navn="name" merke="Navn" required />
            <Felt navn="email" merke="E-post" type="email" />
            <Felt navn="phone" merke="Telefon" />
          </div>
          <div>
            <Handling type="submit" vekt="gull">
              Legg til vasker
            </Handling>
          </div>
        </form>

        {cleaners.length > 0 && (
          <div className="mt-5 border-t border-hus-linje pt-2">
            <Liste>
              {cleaners.map((c) => (
                <Rad
                  key={c.id}
                  hva={c.name}
                  detalj={[c.phone, c.email].filter(Boolean).join(" · ")}
                  handling={
                    <span className="flex items-center gap-1">
                      <Kopier
                        tekst={`${site}/vasker/${c.access_token}`}
                        merke="Kopier portal-lenke"
                      />
                      <form action={deleteCleaner}>
                        <input type="hidden" name="id" value={c.id} />
                        <Handling type="submit" vekt="naken">
                          Slett
                        </Handling>
                      </form>
                    </span>
                  }
                />
              ))}
            </Liste>
          </div>
        )}
      </Flate>

      {properties.length > 0 && (
        <Flate tittel="Legg til en vask selv">
          <form action={createTask} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Velg
                navn="property_id"
                merke="Eiendom"
                valg={properties.map((p) => ({ verdi: p.id, tekst: p.name }))}
              />
              <Felt navn="task_date" merke="Dato" type="date" required />
              <Velg
                navn="type"
                merke="Type"
                defaultValue="turnover"
                valg={[
                  { verdi: "turnover", tekst: "Utvask" },
                  { verdi: "deep", tekst: "Hovedrengjøring" },
                  { verdi: "periodic", tekst: "Periodisk" },
                ]}
              />
            </div>
            <div>
              <Handling type="submit" vekt="stille">
                Legg til
              </Handling>
            </div>
          </form>
        </Flate>
      )}

      <Flate tittel={`Oppgaver (${tasks.length})`}>
        {tasks.length === 0 ? (
          <Tomt
            tittel="Ingen oppgaver ennå."
            hva="Trykk «Generer fra bookinger», så lager Verta en utvask på hver utsjekk du har."
          />
        ) : (
          <Liste>
            {tasks.map((t) => {
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
              const bilder = photosByTask.get(t.id) ?? [];

              return (
                <Rad
                  key={t.id}
                  nar={kortDato(t.task_date)}
                  hva={`${nameById.get(t.property_id) ?? "—"} · ${TYPE_LABEL[t.type] ?? t.type}`}
                  handling={
                    <span className="flex flex-wrap items-center gap-1">
                      <Merke tone={STATUS_TONE[t.status] ?? "ro"}>
                        {STATUS_LABEL[t.status] ?? t.status}
                      </Merke>
                      <form
                        action={assignTask}
                        className="flex items-center gap-1"
                      >
                        <input type="hidden" name="id" value={t.id} />
                        <select
                          name="cleaner_id"
                          defaultValue={t.cleaner_id ?? ""}
                          aria-label="Vasker"
                          className={`${feltKlasse} h-9 w-auto cursor-pointer`}
                        >
                          <option value="" className="bg-hus-hev">
                            Ikke tildelt
                          </option>
                          {cleaners.map((c) => (
                            <option key={c.id} value={c.id} className="bg-hus-hev">
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <Handling type="submit" vekt="naken">
                          Lagre
                        </Handling>
                      </form>
                      <form action={deleteTask}>
                        <input type="hidden" name="id" value={t.id} />
                        <Handling type="submit" vekt="naken">
                          Slett
                        </Handling>
                      </form>
                    </span>
                  }
                  mer={
                    t.clock_in_at || bilder.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {t.clock_in_at && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-hus-svak">
                            <span>
                              Inn {klokke(t.clock_in_at)}
                              {t.clock_out_at
                                ? ` · ut ${klokke(t.clock_out_at)}`
                                : ""}
                            </span>
                            {dist != null && (
                              <span
                                className={
                                  dist <= 300 ? "text-hus-god" : "text-hus-obs"
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
                                className="text-hus-gull underline underline-offset-4"
                              >
                                Vis på kart
                              </a>
                            )}
                          </div>
                        )}
                        {bilder.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {bilder.map((ph) => {
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
                                    className="h-14 w-14 rounded-lg object-cover ring-1 ring-hus-linje"
                                  />
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : undefined
                  }
                />
              );
            })}
          </Liste>
        )}

        {cleaners.length === 0 && tasks.length > 0 && (
          <p className="mt-4 text-xs text-hus-svak">
            Legg til en vasker over for å kunne tildele oppgaver.
          </p>
        )}
      </Flate>
    </Side>
  );
}
