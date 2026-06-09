import Link from "next/link";

import { requireUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Pick = {
  badge: string;
  title: string;
  body: string;
  buy: string;
};

const PICKS: Pick[] = [
  {
    badge: "Hytte / dårlig dekning",
    title: "Igloohome",
    body: "Lager tidsbegrensede koder som virker UTEN nett (offline algoPIN). Perfekt for hytter med dårlig mobildekning eller wifi.",
    buy: "Igloohome-lås med keypad",
  },
  {
    badge: "Hus / leilighet",
    title: "Yale Doorman (Home) + ConnectX",
    body: "Klassisk norsk dørlås med tastatur. Krever Wi-Fi-bro (ConnectX) og oppsett i Yale Home-appen for fjerntilgang. IKKE koblet til Verisure.",
    buy: "Yale Doorman Classic/L3 «Home» + Yale ConnectX Wi-Fi Bridge",
  },
  {
    badge: "Ettermontering",
    title: "Nuki",
    body: "Monteres oppå eksisterende låssylinder. Enkel å sette opp, populær i Europa. Krever wifi/bro for fjerntilgang.",
    buy: "Nuki Smart Lock (med Bridge/wifi)",
  },
  {
    badge: "Proff / flere enheter",
    title: "Salto",
    body: "Skybasert adgangskontroll for de som har mange enheter eller mer profesjonelle behov.",
    buy: "Salto KS-kompatibel lås",
  },
];

export default async function SmartlasGuidePage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Hvilken smartlås bør jeg kjøpe?</h1>
        <p className="text-sm text-muted-foreground">
          Verta kobler til smartlåser via Seam, og lager automatisk en
          adgangskode for hver booking. Her er hva vi anbefaler.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PICKS.map((p) => (
          <Card key={p.title}>
            <CardHeader>
              <span className="w-fit rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">
                {p.badge}
              </span>
              <CardTitle className="mt-2">{p.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <p className="text-ink">{p.body}</p>
              <p className="text-muted-foreground">
                <span className="font-medium text-navy">Kjøp:</span> {p.buy}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sjekkliste før du kjøper</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2 text-sm text-ink">
            <li>✅ Har <strong>tastatur (keypad)</strong> — det er der gjesten taster koden</li>
            <li>✅ Har <strong>wifi / fjerntilgang</strong> (egen wifi eller bro) — så koder kan lages når gjesten kommer</li>
            <li>
              ✅ Settes opp i <strong>leverandørens egen app</strong> (f.eks. Yale
              Home for Yale) — <strong>ikke</strong> låst til et alarmselskap som
              Verisure
            </li>
            <li>✅ Er et merke Verta støtter: <strong>Igloohome, Yale, Nuki, Salto, August, Schlage</strong> m.fl.</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Unntak: <strong>Igloohome</strong> trenger ikke nett — den lager koder
            offline, og er derfor det tryggeste valget for hytter.
          </p>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Klar til å koble til? Gå til en eiendom →{" "}
        <Link href="/dashboard/properties" className="underline">
          Eiendommer
        </Link>{" "}
        → «Koble til smartlås».
      </p>
    </div>
  );
}
