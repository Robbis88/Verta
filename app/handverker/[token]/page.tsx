import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { updateRequestByContractor } from "./actions";
import { Button } from "@/components/ui/button";

type Contractor = {
  id: string;
  name: string;
  trade: string | null;
};

type Request = {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
};

const STATUS_LABEL: Record<string, string> = {
  open: "Åpen",
  in_progress: "Pågår",
  resolved: "Løst",
};
const PRIORITY_LABEL: Record<string, string> = {
  low: "Lav",
  normal: "Normal",
  high: "Høy",
  urgent: "Haster",
};
const PRIORITY_STYLE: Record<string, string> = {
  urgent: "text-red-600",
  high: "text-amber-600",
  normal: "text-ink",
  low: "text-ink/50",
};

export const metadata: Metadata = { title: "Mine oppdrag — Verta" };

export default async function ContractorPortal({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: contractorData } = await supabase
    .from("contractors")
    .select("id,name,trade")
    .eq("access_token", token)
    .maybeSingle();
  if (!contractorData) notFound();
  const contractor = contractorData as Contractor;

  const { data: reqData } = await supabase
    .from("maintenance_requests")
    .select("id,property_id,title,description,status,priority")
    .eq("contractor_id", contractor.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  const requests = (reqData ?? []) as Request[];

  const propIds = [...new Set(requests.map((r) => r.property_id))];
  const { data: props } = propIds.length
    ? await supabase.from("properties").select("id,name,address").in("id", propIds)
    : { data: [] };
  const propById = new Map(
    ((props ?? []) as { id: string; name: string; address: string | null }[]).map(
      (p) => [p.id, p],
    ),
  );

  const active = requests.filter((r) => r.status !== "resolved");
  const done = requests.filter((r) => r.status === "resolved");

  return (
    <main className="min-h-screen bg-cloud">
      <header className="bg-navy px-6 py-8 text-white">
        <p className="text-sm text-gold-light">Mine oppdrag</p>
        <h1 className="mt-1 text-2xl font-bold">
          {contractor.name}
          {contractor.trade && (
            <span className="text-base font-normal text-white/70">
              {" "}
              · {contractor.trade}
            </span>
          )}
        </h1>
      </header>

      <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
        {active.length === 0 ? (
          <p className="rounded-xl border border-hairline bg-white p-6 text-center text-sm text-ink/60">
            Ingen aktive oppdrag akkurat nå. 🎉
          </p>
        ) : (
          active.map((r) => {
            const p = propById.get(r.property_id);
            return (
              <div
                key={r.id}
                className="rounded-xl border border-hairline bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">{r.title}</p>
                    <p className="text-sm text-ink/60">
                      {p?.name ?? "Eiendom"}
                      {p?.address ? ` · ${p.address}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-cloud px-3 py-1 text-xs font-medium text-navy">
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  Prioritet:{" "}
                  <span className={PRIORITY_STYLE[r.priority]}>
                    {PRIORITY_LABEL[r.priority] ?? r.priority}
                  </span>
                </p>
                {r.description && (
                  <p className="mt-1 text-sm text-ink/70">{r.description}</p>
                )}
                <div className="mt-4 flex gap-2">
                  {r.status !== "in_progress" && (
                    <form action={updateRequestByContractor}>
                      <input type="hidden" name="token" value={token} />
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="status" value="in_progress" />
                      <Button type="submit" variant="outline" size="sm">
                        Start
                      </Button>
                    </form>
                  )}
                  <form action={updateRequestByContractor}>
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="request_id" value={r.id} />
                    <input type="hidden" name="status" value="resolved" />
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-gold text-navy hover:bg-gold/90"
                    >
                      Marker fullført
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
              {done.map((r) => (
                <li key={r.id} className="text-sm text-ink/60">
                  ✓ {r.title} · {propById.get(r.property_id)?.name ?? "Eiendom"}
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
