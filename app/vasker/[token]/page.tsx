import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { updateTaskByCleaner } from "./actions";
import { Button } from "@/components/ui/button";

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

  const { data: cleaner } = await supabase
    .from("cleaners")
    .select("id,name")
    .eq("access_token", token)
    .maybeSingle();
  if (!cleaner) notFound();

  const { data: taskData } = await supabase
    .from("cleaning_tasks")
    .select("id,property_id,task_date,type,status,notes")
    .eq("cleaner_id", cleaner.id)
    .order("task_date", { ascending: true });
  const tasks = (taskData ?? []) as Task[];

  const propIds = [...new Set(tasks.map((t) => t.property_id))];
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

        <p className="mt-2 text-center text-xs text-ink/50">Levert av Verta</p>
      </div>
    </main>
  );
}
