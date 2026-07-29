import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { payBoost } from "../actions";
import { BoostEditor } from "@/components/boosts/boost-editor";
import { formatNok } from "@/lib/utils";
import {
  Beskjed,
  Flate,
  Handling,
  Merke,
  Side,
  Situasjon,
} from "@/components/hus";
import type { Boost } from "@/lib/types";

/**
 * Én boost — modul 7. Kun presentasjon; samme spørringer og samme payBoost (id).
 */

const STATUS_TEKST: Record<string, string> = {
  pending: "Venter på betaling",
  approved: "Aktiv",
};

const STATUS_TONE: Record<string, "ro" | "obs" | "god"> = {
  pending: "obs",
  approved: "god",
};

const PLATTFORM: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  both: "Instagram og Facebook",
};

export default async function BoostDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; payment_failed?: string }>;
}) {
  const { id } = await params;
  const { paid, payment_failed } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.from("boosts").select("*").eq("id", id).single();
  if (!data) notFound();
  const boost = data as Boost;

  const { data: property } = await supabase
    .from("properties")
    .select("name,slug")
    .eq("id", boost.property_id)
    .single();

  const defaultText = boost.user_approved_text ?? boost.ai_generated_text ?? "";

  return (
    <Side>
      <Situasjon
        merke="Boost"
        tittel={`${property?.name ?? "Eiendom"} — ${formatNok(Number(boost.budget_nok))} på ${PLATTFORM[boost.platform] ?? boost.platform}`}
        under={`${boost.start_date} → ${boost.end_date}`}
        handling={
          <Merke tone={STATUS_TONE[boost.status] ?? "ro"}>
            {STATUS_TEKST[boost.status] ?? boost.status}
          </Merke>
        }
      />

      {paid && <Beskjed>Boosten er godkjent og betalt.</Beskjed>}
      {payment_failed && (
        <Beskjed tone="kritisk">
          Betalingen ble ikke fullført. Prøv igjen.
        </Beskjed>
      )}

      <Flate
        tittel="Annonsetekst"
        hva="Verta har skrevet et utkast. Rediger fritt — det er du som eier ordene."
      >
        <BoostEditor id={boost.id} defaultText={defaultText} />
      </Flate>

      {boost.status === "pending" && (
        <Flate
          tittel="Godkjenn og betal"
          hva="Ingenting publiseres før du har betalt."
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-hus-dempet">
              Betal {formatNok(Number(boost.budget_nok))} for å aktivere
              kampanjen.
            </p>
            <form action={payBoost}>
              <input type="hidden" name="id" value={boost.id} />
              <Handling type="submit" vekt="gull">
                Godkjenn og betal med Vipps
              </Handling>
            </form>
          </div>
        </Flate>
      )}

      <div>
        <Handling href="/dashboard/boosts" vekt="naken">
          ← Tilbake til kampanjer
        </Handling>
      </div>
    </Side>
  );
}
