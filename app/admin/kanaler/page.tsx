import Link from "next/link";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLATFORMS, platformLabel } from "@/lib/social";
import { connectChannel, disconnectChannel, markBoostPublished } from "./actions";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Account = { platform: string; handle: string | null; status: string };
type Boost = {
  id: string;
  property_id: string;
  platform: string;
  status: string;
  ai_generated_text: string | null;
  user_approved_text: string | null;
};

export default async function KanalerPage() {
  await requireAdmin();

  const supabase = createAdminClient();

  const { data: accData } = await supabase
    .from("social_accounts")
    .select("platform,handle,status");
  const byPlatform = new Map(
    ((accData ?? []) as Account[]).map((a) => [a.platform, a]),
  );

  const { data: boostData } = await supabase
    .from("boosts")
    .select("id,property_id,platform,status,ai_generated_text,user_approved_text")
    .is("published_at", null)
    .in("status", ["approved", "active"])
    .order("created_at", { ascending: true });
  const queue = (boostData ?? []) as Boost[];

  const propIds = [...new Set(queue.map((b) => b.property_id))];
  const { data: props } = propIds.length
    ? await supabase.from("properties").select("id,name").in("id", propIds)
    : { data: [] };
  const nameById = new Map(
    ((props ?? []) as { id: string; name: string }[]).map((p) => [p.id, p.name]),
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-white/10 bg-navy px-4 py-3 text-white sm:px-6">
        <div className="flex items-baseline gap-3">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight text-gold">
            Verta
          </Link>
          <span className="text-sm text-white/70">Admin · Kanaler</span>
        </div>
        <Link href="/admin" className="text-sm text-white/70 hover:text-white">
          ← Til admin
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Verta-kanaler</h1>
          <p className="text-sm text-muted-foreground">
            Vertas egne sosiale kontoer. Boost-poster fra eiere publiseres hit —
            automatisk der API er på plass, ellers fra køen under.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kanaler</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {PLATFORMS.map((p) => {
                const acc = byPlatform.get(p.key);
                return (
                  <li
                    key={p.key}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{p.label}</span>{" "}
                      <Badge>
                        {p.capability === "auto" ? "Auto-publisering" : "Kun annonser"}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{p.note}</p>
                    </div>
                    {acc ? (
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600">
                          Tilkoblet{acc.handle ? ` · ${acc.handle}` : ""}
                        </span>
                        <form action={disconnectChannel}>
                          <input type="hidden" name="platform" value={p.key} />
                          <Button type="submit" variant="ghost" size="sm">
                            Koble fra
                          </Button>
                        </form>
                      </div>
                    ) : (
                      <form action={connectChannel} className="flex items-center gap-1">
                        <input type="hidden" name="platform" value={p.key} />
                        <Input name="handle" placeholder="@brukernavn" className="h-9 w-40" />
                        <Button type="submit" variant="outline" size="sm">
                          Koble til
                        </Button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publiseringskø ({queue.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {queue.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ingen boosts venter på publisering.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {queue.map((b) => {
                  const text = b.user_approved_text || b.ai_generated_text || "";
                  return (
                    <li key={b.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {nameById.get(b.property_id) ?? "Eiendom"}
                        </span>
                        <Badge>{platformLabel(b.platform)}</Badge>
                      </div>
                      {text && (
                        <div className="flex flex-col gap-2">
                          <p className="whitespace-pre-line rounded bg-muted p-3 text-sm">
                            {text}
                          </p>
                          <div>
                            <CopyButton text={text} label="Kopier tekst" />
                          </div>
                        </div>
                      )}
                      <form
                        action={markBoostPublished}
                        className="mt-3 flex items-end gap-2 border-t pt-3"
                      >
                        <input type="hidden" name="boost_id" value={b.id} />
                        <Input
                          name="url"
                          placeholder="Lenke til publisert innlegg (valgfritt)"
                          className="h-9 flex-1"
                        />
                        <Button type="submit" size="sm">
                          Marker publisert
                        </Button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
