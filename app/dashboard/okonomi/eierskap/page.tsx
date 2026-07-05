import { getEconomyContext, getOwnership } from "@/lib/okonomi";
import { formatNok } from "@/lib/utils";
import { StatCard, MiniBar, EmptyOkonomi } from "@/components/okonomi/ui";
import { DemoAction } from "@/components/okonomi/demo-action";
import { addOwner, deleteOwner, addContribution } from "../actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Delt eierskap</h2>
        <p className="text-sm text-muted-foreground">{economy.propertyName}</p>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Eiere</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {owners.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen medeiere registrert. Legg til eierne under.
            </p>
          ) : (
            owners.map((o) => {
              const balance = o.paid - o.shouldPay;
              return (
                <div key={o.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-navy">
                      {o.name}{" "}
                      <span className="text-muted-foreground">· {o.sharePct} %</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span
                        className={balance >= 0 ? "text-emerald-600" : "text-red-600"}
                      >
                        {balance >= 0 ? "Til gode " : "Skylder "}
                        {formatNok(Math.abs(balance))}
                      </span>
                      <form action={deleteOwner}>
                        <input type="hidden" name="id" value={o.id} />
                        <button
                          type="submit"
                          className="text-xs text-muted-foreground hover:text-destructive"
                          aria-label="Fjern eier"
                        >
                          ✕
                        </button>
                      </form>
                    </span>
                  </div>
                  <MiniBar pct={o.sharePct} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Betalt: {formatNok(o.paid)}</span>
                    <span>Skulle betalt: {formatNok(o.shouldPay)}</span>
                  </div>
                </div>
              );
            })
          )}

          {shareSum !== 100 && owners.length > 0 && (
            <p className="text-xs text-amber-600">
              Eierandelene summerer til {shareSum} % (bør være 100 %).
            </p>
          )}

          <form
            action={addOwner}
            className="flex flex-wrap items-end gap-3 border-t border-hairline pt-4"
          >
            <input type="hidden" name="property_id" value={selected.id} />
            <div className="flex flex-col gap-1">
              <Label>Navn</Label>
              <Input name="name" required className="w-44" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Andel %</Label>
              <Input
                name="share_pct"
                type="number"
                min={0}
                max={100}
                step={0.1}
                className="w-24"
              />
            </div>
            <Button type="submit" size="sm" variant="outline">
              Legg til eier
            </Button>
          </form>
        </CardContent>
      </Card>

      {owners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registrer innbetaling</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addContribution} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="property_id" value={selected.id} />
              <div className="flex flex-col gap-1">
                <Label>Eier</Label>
                <select
                  name="owner_id"
                  className="h-9 w-44 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                >
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <Label>Beløp (kr)</Label>
                <Input name="amount" type="number" min={1} className="w-32" required />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Notat</Label>
                <Input name="note" className="w-44" placeholder="F.eks. nytt tak" />
              </div>
              <Button type="submit" size="sm">
                Registrer
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {owners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Forslag til oppgjør</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {transfers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Alt er gjort opp — ingen skylder noe.
              </p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {transfers.map((t, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-hairline px-3 py-2"
                  >
                    <span>
                      <span className="font-medium text-navy">{t.from}</span>{" "}
                      betaler{" "}
                      <span className="font-medium text-navy">{t.to}</span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatNok(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <DemoAction
              label="Lag oppgjør"
              done="Oppgjør opprettet og sendt til medeierne (demo)."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
