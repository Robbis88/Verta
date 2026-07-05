import { getEconomyContext } from "@/lib/okonomi";
import { formatNok } from "@/lib/utils";
import { StatCard, MiniBar, EmptyOkonomi } from "@/components/okonomi/ui";
import { DemoAction } from "@/components/okonomi/demo-action";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EierskapPage({
  searchParams,
}: {
  searchParams: Promise<{ eiendom?: string }>;
}) {
  const { eiendom } = await searchParams;
  const { selected, economy } = await getEconomyContext(eiendom);
  if (!selected || !economy) return <EmptyOkonomi />;

  const owners = economy.owners;
  const balances = owners.map((o) => ({
    name: o.name,
    balance: o.paid - o.shouldPay,
  }));
  const mostPaid = [...balances].sort((a, b) => b.balance - a.balance)[0];

  // Enkelt oppgjørsforslag: match de som har lagt ut for mye mot de som skylder.
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Delt eierskap</h2>
        <p className="text-sm text-muted-foreground">{economy.propertyName}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Antall eiere" value={String(owners.length)} />
        <StatCard label="Har lagt ut mest" value={mostPaid.name} tone="gold" sub={formatNok(mostPaid.balance)} />
        <StatCard label="Overføringer i oppgjør" value={String(transfers.length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eiere</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {owners.map((o) => {
            const balance = o.paid - o.shouldPay;
            return (
              <div key={o.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-navy">
                    {o.name}{" "}
                    <span className="text-muted-foreground">
                      · {o.sharePct} %
                    </span>
                  </span>
                  <span
                    className={
                      balance >= 0 ? "text-emerald-600" : "text-red-600"
                    }
                  >
                    {balance >= 0 ? "Til gode " : "Skylder "}
                    {formatNok(Math.abs(balance))}
                  </span>
                </div>
                <MiniBar pct={o.sharePct} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Betalt: {formatNok(o.paid)}</span>
                  <span>Skulle betalt: {formatNok(o.shouldPay)}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

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
    </div>
  );
}
