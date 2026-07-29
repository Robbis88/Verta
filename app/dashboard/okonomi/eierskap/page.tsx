import { getEconomyContext, getOwnership } from "@/lib/okonomi";
import { formatNok } from "@/lib/utils";
import { StatCard, MiniBar, EmptyOkonomi } from "@/components/okonomi/ui";
import { DemoAction } from "@/components/okonomi/demo-action";
import { addOwner, deleteOwner, addContribution } from "../actions";
import { Beskjed, Felt, Flate, Handling, Kort, Velg } from "@/components/hus";

/**
 * Delt eierskap — modul 6. Kun presentasjon; samme oppgjørsberegning og samme
 * actions (addOwner, deleteOwner, addContribution) med uendrede feltnavn.
 */
export default async function EierskapPage({
  searchParams,
}: {
  searchParams: Promise<{ eiendom?: string }>;
}) {
  const { eiendom } = await searchParams;
  const { selected, economy } = await getEconomyContext(eiendom);
  if (!selected || !economy) return <EmptyOkonomi />;

  const { owners, total } = await getOwnership(selected.id);

  const balances = owners.map((o) => ({
    name: o.name,
    balance: o.paid - o.shouldPay,
  }));
  const mostPaid = [...balances].sort((a, b) => b.balance - a.balance)[0];

  // Oppgjørsforslag: match de som har lagt ut for mye mot de som skylder.
  const creditors = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance);
  const debtors = balances
    .filter((b) => b.balance < 0)
    .map((b) => ({ name: b.name, balance: -b.balance }))
    .sort((a, b) => b.balance - a.balance);
  const transfers: { from: string; to: string; amount: number }[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const amt = Math.min(creditors[ci].balance, debtors[di].balance);
    if (amt > 0) {
      transfers.push({ from: debtors[di].name, to: creditors[ci].name, amount: amt });
    }
    creditors[ci].balance -= amt;
    debtors[di].balance -= amt;
    if (creditors[ci].balance <= 0) ci++;
    if (debtors[di].balance <= 0) di++;
  }

  const shareSum = owners.reduce((s, o) => s + o.sharePct, 0);

  return (
    <>
      <p className="text-sm text-hus-dempet">
        {owners.length === 0 ? (
          <>
            Ingen medeiere er registrert på {economy.propertyName} ennå. Legg dem
            inn, så holder Verta regnskapet mellom dere.
          </>
        ) : transfers.length === 0 ? (
          <>
            {economy.propertyName} eies av {owners.length} personer, og alt er
            gjort opp — ingen skylder noen noe.
          </>
        ) : (
          <>
            {economy.propertyName} eies av {owners.length} personer.{" "}
            {transfers.length === 1
              ? "Én overføring står"
              : `${transfers.length} overføringer står`}{" "}
            igjen før alt er gjort opp.
          </>
        )}
      </p>

      {owners.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Antall eiere" value={String(owners.length)} />
          <StatCard label="Totalt innbetalt" value={formatNok(total)} tone="gold" />
          <StatCard
            label="Har lagt ut mest"
            value={mostPaid?.name ?? "–"}
            sub={mostPaid ? formatNok(mostPaid.balance) : undefined}
          />
        </div>
      )}

      <Flate tittel="Eiere" hva="Hvem eier hvor mye, og hvem har lagt ut for hva.">
        <div className="flex flex-col gap-5">
          {owners.length === 0 ? (
            <p className="text-sm text-hus-dempet">
              Ingen medeiere registrert. Legg til eierne under.
            </p>
          ) : (
            owners.map((o) => {
              const balance = o.paid - o.shouldPay;
              return (
                <div key={o.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="min-w-0 truncate text-hus-blekk">
                      {o.name}{" "}
                      <span className="text-hus-svak">· {o.sharePct} %</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span
                        className={
                          balance >= 0
                            ? "tabular-nums text-hus-god"
                            : "tabular-nums text-hus-kritisk"
                        }
                      >
                        {balance >= 0 ? "Til gode " : "Skylder "}
                        {formatNok(Math.abs(balance))}
                      </span>
                      <form action={deleteOwner}>
                        <input type="hidden" name="id" value={o.id} />
                        <Handling type="submit" vekt="naken">
                          <span aria-hidden="true">✕</span>
                          <span className="sr-only">Fjern eier</span>
                        </Handling>
                      </form>
                    </span>
                  </div>
                  <MiniBar pct={o.sharePct} />
                  <div className="flex justify-between text-xs text-hus-svak tabular-nums">
                    <span>Betalt: {formatNok(o.paid)}</span>
                    <span>Skulle betalt: {formatNok(o.shouldPay)}</span>
                  </div>
                </div>
              );
            })
          )}

          {shareSum !== 100 && owners.length > 0 && (
            <Beskjed tone="obs">
              Eierandelene summerer til {shareSum} % (bør være 100 %).
            </Beskjed>
          )}

          <form
            action={addOwner}
            className="flex flex-col gap-4 border-t border-hus-linje pt-5"
          >
            <input type="hidden" name="property_id" value={selected.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Felt navn="name" merke="Navn" required />
              <Felt
                navn="share_pct"
                merke="Andel %"
                type="number"
                min={0}
                max={100}
                step={0.1}
              />
            </div>
            <div>
              <Handling type="submit" vekt="stille">
                Legg til eier
              </Handling>
            </div>
          </form>
        </div>
      </Flate>

      {owners.length > 0 && (
        <Flate
          tittel="Registrer innbetaling"
          hva="Når én av dere legger ut for noe, føres det her."
        >
          <form action={addContribution} className="flex flex-col gap-4">
            <input type="hidden" name="property_id" value={selected.id} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Velg
                navn="owner_id"
                merke="Eier"
                valg={owners.map((o) => ({ verdi: o.id, tekst: o.name }))}
              />
              <Felt
                navn="amount"
                merke="Beløp (kr)"
                type="number"
                min={1}
                required
              />
              <Felt navn="note" merke="Notat" placeholder="F.eks. nytt tak" />
            </div>
            <div>
              <Handling type="submit" vekt="gull">
                Registrer
              </Handling>
            </div>
          </form>
        </Flate>
      )}

      {owners.length > 0 && (
        <Flate
          tittel="Forslag til oppgjør"
          hva="Færrest mulig overføringer for å gjøre opp mellom dere."
        >
          <div className="flex flex-col gap-4">
            {transfers.length === 0 ? (
              <p className="text-sm text-hus-dempet">
                Alt er gjort opp — ingen skylder noe.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {transfers.map((t, i) => (
                  <li key={i}>
                    <Kort>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="min-w-0 text-hus-dempet">
                          <span className="text-hus-blekk">{t.from}</span> betaler{" "}
                          <span className="text-hus-blekk">{t.to}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-hus-gull-lys">
                          {formatNok(t.amount)}
                        </span>
                      </div>
                    </Kort>
                  </li>
                ))}
              </ul>
            )}
            <div>
              <DemoAction
                label="Lag oppgjør"
                done="Oppgjør opprettet og sendt til medeierne (demo)."
              />
            </div>
          </div>
        </Flate>
      )}
    </>
  );
}
