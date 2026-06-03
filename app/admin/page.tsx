import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { isAdmin, getAdminMetrics } from "@/lib/admin";
import { PLANS } from "@/lib/constants";
import { formatNok } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!isAdmin(user?.email)) notFound();

  const m = await getAdminMetrics();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin — plattform</h1>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Til dashbordet
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Brukere" value={String(m.users)} />
        <Stat title="MRR" value={formatNok(m.mrrNok)} />
        <Stat title="Eiendommer" value={String(m.properties)} />
        <Stat title="Bookinger" value={String(m.bookings)} />
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
