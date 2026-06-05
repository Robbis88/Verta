import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteMessage } from "./actions";
import { GuestReplyTool, ReviewReplyTool } from "@/components/messages/reply-tools";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Message = {
  id: string;
  property_id: string;
  direction: string;
  channel: string;
  body: string;
  created_at: string;
};

export default async function MeldingerPage() {
  await requireUser();
  const supabase = await createClient();

  const { data: props } = await supabase
    .from("properties")
    .select("id,name")
    .order("name");
  const properties = (props ?? []) as { id: string; name: string }[];

  const { data: msgs } = await supabase
    .from("messages")
    .select("id,property_id,direction,channel,body,created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  const messages = (msgs ?? []) as Message[];
  const nameById = new Map(properties.map((p) => [p.id, p.name]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Meldinger</h1>
        <p className="text-sm text-muted-foreground">
          La Verta foreslå svar på gjestemeldinger og anmeldelser — på
          gjestens språk, basert på fakta om eiendommen din.
        </p>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Legg til en eiendom først, så kan du få AI-svar tilpasset den.{" "}
            <Link href="/dashboard/properties/new" className="underline">
              Legg til eiendom
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <GuestReplyTool properties={properties} />
          <ReviewReplyTool properties={properties} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Logg ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen loggede meldinger ennå.
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {messages.map((m) => (
                <li key={m.id} className="flex items-start gap-3 py-3 text-sm">
                  <Badge>{m.direction === "incoming" ? "Inn" : "Ut"}</Badge>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      {nameById.get(m.property_id) ?? "—"} · {m.channel} ·{" "}
                      {m.created_at.slice(0, 10)}
                    </p>
                    <p className="whitespace-pre-line">{m.body}</p>
                  </div>
                  <form action={deleteMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Slett
                    </Button>
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
