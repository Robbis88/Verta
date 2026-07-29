import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteMessage } from "./actions";
import { GuestReplyTool, ReviewReplyTool } from "@/components/messages/reply-tools";
import {
  Flate,
  Handling,
  Liste,
  Merke,
  Rad,
  Side,
  Situasjon,
  Tomt,
} from "@/components/hus";

/**
 * Meldinger — modul 5 i UI-refaktoren. Kun presentasjon; samme spørringer og
 * samme `deleteMessage`.
 */

type Message = {
  id: string;
  property_id: string;
  direction: string;
  channel: string;
  body: string;
  created_at: string;
};

const KANAL: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "E-post",
  other: "Annet",
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
  const flereBoliger = properties.length > 1;

  return (
    <Side bred>
      <Situasjon
        merke="Meldinger"
        tittel="Du trenger ikke finne ordene selv."
        under="Lim inn det gjesten skrev, så foreslår Verta et svar på gjestens språk — med fakta hentet fra din bolig. Du redigerer fritt før du sender."
      />

      {properties.length === 0 ? (
        <Flate>
          <Tomt
            tittel="Ingen bolig registrert."
            hva="Verta trenger å vite noe om boligen for å kunne svare på WiFi, dørkode og husregler."
            knappTekst="Legg til bolig"
            knappHref="/dashboard/properties/new"
          />
        </Flate>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <GuestReplyTool properties={properties} />
          <ReviewReplyTool properties={properties} />
        </div>
      )}

      <Flate
        tittel={`Logg (${messages.length})`}
        hva="Samtaler du har valgt å logge. Verta bruker dem som kontekst neste gang."
      >
        {messages.length === 0 ? (
          <Tomt
            tittel="Ingen loggede meldinger ennå."
            hva="Trykk «Logg samtalen» etter et svar, så husker Verta hva som er sagt."
          />
        ) : (
          <Liste>
            {messages.map((m) => (
              <Rad
                key={m.id}
                hva={
                  <span className="flex items-center gap-2">
                    <Merke tone={m.direction === "incoming" ? "ro" : "gull"}>
                      {m.direction === "incoming" ? "Inn" : "Ut"}
                    </Merke>
                    <span className="truncate">{m.body}</span>
                  </span>
                }
                detalj={[
                  flereBoliger ? nameById.get(m.property_id) : null,
                  KANAL[m.channel] ?? m.channel,
                  m.created_at.slice(0, 10),
                ]
                  .filter(Boolean)
                  .join(" · ")}
                handling={
                  <form action={deleteMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <Handling type="submit" vekt="naken">
                      Slett
                    </Handling>
                  </form>
                }
              />
            ))}
          </Liste>
        )}
      </Flate>
    </Side>
  );
}
