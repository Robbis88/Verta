import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addCoHost, removeCoHost } from "./actions";
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

type Member = {
  id: string;
  member_email: string;
  invite_token: string;
  accepted_at: string | null;
};

export default async function TeamPage() {
  await requireUser();
  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const { data } = await supabase
    .from("team_members")
    .select("id,member_email,invite_token,accepted_at")
    .order("created_at", { ascending: false });
  const members = (data ?? []) as Member[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="text-sm text-muted-foreground">
          Inviter en co-host som kan logge inn og hjelpe med driften
          (bookinger, oppgaver, meldinger). De kan ikke endre abonnement,
          slette kontoen eller opprette nye eiendommer.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inviter co-host</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={addCoHost}
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" name="email" type="email" required placeholder="navn@eksempel.no" />
            </div>
            <Button type="submit">Inviter</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Etter invitasjon: kopier lenken under og send den til co-host. De må
            logge inn med samme e-post for å godta.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Co-hosts ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen co-hosts ennå.
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="font-medium">{m.member_email}</span>
                  <span className="flex items-center gap-2">
                    <Badge>{m.accepted_at ? "Aktiv" : "Venter"}</Badge>
                    {!m.accepted_at && (
                      <CopyButton
                        text={`${site}/team/aksepter/${m.invite_token}`}
                        label="Kopier invitasjonslenke"
                      />
                    )}
                    <form action={removeCoHost}>
                      <input type="hidden" name="id" value={m.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Fjern
                      </Button>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
