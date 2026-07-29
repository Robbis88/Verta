import { createClient } from "@/lib/supabase/server";
import { formatNok } from "@/lib/utils";
import {
  Flate,
  Liste,
  Rad,
  Side,
  Situasjon,
  Tall,
  TallRekke,
  Tomt,
} from "@/components/hus";

/**
 * Provisjon — modul 2 i UI-refaktoren. Kun presentasjon; samme spørring.
 *
 * Siden er ren historikk: Verta tar ikke lenger provisjon. Det sier den nå
 * først, i stedet for å vise tall som ser ut som en løpende kostnad.
 */

type CommissionRow = {
  id: string;
  period: string;
  total_revenue: number | null;
  commission_amount: number | null;
  status: string;
};

const STATUS_TEKST: Record<string, string> = {
  paid: "betalt",
  pending: "venter",
  invoiced: "fakturert",
};

export default async function CommissionsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("commissions")
    .select("id,period,total_revenue,commission_amount,status")
    .order("period", { ascending: false });
  const commissions = (data ?? []) as CommissionRow[];

  const lifetime = commissions.reduce(
    (sum, c) => sum + (Number(c.commission_amount) || 0),
    0,
  );
  const omsetning = commissions.reduce(
    (sum, c) => sum + (Number(c.total_revenue) || 0),
    0,
  );

  return (
    <Side>
      <Situasjon
        merke="Provisjon"
        tittel={
          commissions.length === 0
            ? "Du har aldri betalt provisjon til Verta."
            : "Verta tar ikke lenger provisjon fra deg."
        }
        under="Gjestene betaler et tjenestegebyr på 7,5 % ved bestilling, så du får hele ditt beløp. Alt under er historikk."
      />

      {commissions.length > 0 && (
        <TallRekke>
          <Tall verdi={formatNok(lifetime)} navn="betalt totalt" tone="gull" />
          <Tall verdi={formatNok(omsetning)} navn="omsetning i perioden" />
          <Tall verdi={`${commissions.length}`} navn="perioder" />
          <Tall verdi={commissions[0]?.period ?? "—"} navn="siste periode" />
        </TallRekke>
      )}

      <Flate tittel="Historikk">
        {commissions.length === 0 ? (
          <Tomt
            tittel="Ingenting å vise."
            hva="Du har ikke betalt provisjon til Verta. Det kommer heller ikke til å skje — modellen er byttet ut."
          />
        ) : (
          <Liste>
            {commissions.map((c) => (
              <Rad
                key={c.id}
                nar={c.period}
                hva={`Omsetning ${formatNok(Number(c.total_revenue) || 0)}`}
                detalj={STATUS_TEKST[c.status] ?? c.status}
                verdi={formatNok(Number(c.commission_amount) || 0)}
                tone="gull"
              />
            ))}
          </Liste>
        )}
      </Flate>
    </Side>
  );
}
