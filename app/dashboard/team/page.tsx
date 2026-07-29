import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addCoHost, removeCoHost } from "./actions";
import { Kopier } from "@/components/hus/kopier";
import {
  Felt,
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
 * Team — modul 8. Kun presentasjon; samme spørring og samme actions
 * (addCoHost: email, removeCoHost: id).
 */

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

  const aktive = members.filter((m) => m.accepted_at).length;
  const venter = members.length - aktive;

  return (
    <Side>
      <Situasjon
        merke="Team"
        tittel={
          members.length === 0
            ? "Du driver huset alene."
            : venter > 0
              ? `${aktive} hjelper deg, ${venter} har ikke svart ennå.`
              : `${aktive} hjelper deg med driften.`
        }
        under="En co-host kan logge inn og hjelpe med bookinger, oppgaver og meldinger. De kan ikke endre abonnement, slette kontoen eller opprette nye eiendommer."
      />

      <Flate
        tittel="Inviter co-host"
        hva="De må logge inn med samme e-post for å godta invitasjonen."
      >
        <form action={addCoHost} className="flex flex-col gap-4">
          <Felt
            navn="email"
            merke="E-post"
            type="email"
            required
            placeholder="navn@eksempel.no"
          />
          <div>
            <Handling type="submit" vekt="gull">
              Inviter
            </Handling>
          </div>
        </form>
        <p className="mt-4 text-xs text-hus-svak">
          Etter invitasjon: kopier lenken i listen under og send den til
          co-hosten.
        </p>
      </Flate>

      <Flate tittel={`Co-hosts (${members.length})`}>
        {members.length === 0 ? (
          <Tomt
            tittel="Ingen co-hosts ennå."
            hva="Har du noen som svarer gjester eller møter vaskehjelpen, slipper du å være eneste kontaktpunkt."
          />
        ) : (
          <Liste>
            {members.map((m) => (
              <Rad
                key={m.id}
                hva={
                  <span className="flex items-center gap-2">
                    <span className="truncate">{m.member_email}</span>
                    <Merke tone={m.accepted_at ? "god" : "obs"}>
                      {m.accepted_at ? "Aktiv" : "Venter"}
                    </Merke>
                  </span>
                }
                handling={
                  <span className="flex items-center gap-1">
                    {!m.accepted_at && (
                      <Kopier
                        tekst={`${site}/team/aksepter/${m.invite_token}`}
                        merke="Kopier invitasjonslenke"
                      />
                    )}
                    <form action={removeCoHost}>
                      <input type="hidden" name="id" value={m.id} />
                      <Handling type="submit" vekt="naken">
                        Fjern
                      </Handling>
                    </form>
                  </span>
                }
              />
            ))}
          </Liste>
        )}
      </Flate>
    </Side>
  );
}
