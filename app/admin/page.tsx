import Link from "next/link";

import { requireAdmin, getAdminMetrics, getAdminUsers } from "@/lib/admin";
import { PLANS } from "@/lib/constants";
import { formatNok } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminPage() {
  await requireAdmin();

  const m = await getAdminMetrics();
  const users = await getAdminUsers();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-white/10 bg-navy px-4 py-3 text-white sm:px-6">
        <div className="flex items-baseline gap-3">
          <Link
            href="/dashboard"
            className="text-lg font-bold tracking-tight text-gold"
          >
            Verta
          </Link>
          <span className="text-sm text-white/70">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/kanaler"
            className="text-sm text-gold-light hover:text-gold"
          >
            Kanaler
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-white/70 hover:text-white"
          >
            ← Til dashbordet
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold text-navy">Plattformoversikt</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Brukere" value={String(m.users)} />
        <Stat title="MRR" value={formatNok(m.mrrNok)} />
        <Stat title="Eiendommer" value={String(m.properties)} />
        <Stat title="Bookinger" value={String(m.bookings)} />
        <Stat title="Boost (aktive)" value={`${m.activeBoosts} / ${m.boosts}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Brukere per plan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((plan) => (
              <div key={plan} className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {PLANS[plan].label}
                </span>
                <span className="font-medium">{m.byTier[plan]}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provisjon</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row label="Totalt" value={formatNok(m.commissionTotal)} />
            <Row label="Utbetalt" value={formatNok(m.commissionPaid)} />
            <Row label="Utestående" value={formatNok(m.commissionPending)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brukere ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen brukere ennå.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 font-medium">E-post</th>
                    <th className="py-2 font-medium">Plan</th>
                    <th className="py-2 text-right font-medium">Eiendommer</th>
                    <th className="py-2 text-right font-medium">Registrert</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2">{u.email}</td>
                      <td className="py-2">{PLANS[u.plan]?.label ?? u.plan}</td>
                      <td className="py-2 text-right">{u.properties}</td>
                      <td className="py-2 text-right text-muted-foreground">
                        {u.created_at.slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      </main>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
