import { requireUser } from "@/lib/auth";
import { Flate, Handling, Kort, Merke, Side, Situasjon } from "@/components/hus";

/**
 * Smartlås-guiden — modul 7. Kun presentasjon; ren lesesside.
 */

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

const SJEKKLISTE = [
  <>
    Har <strong className="font-medium text-hus-blekk">tastatur (keypad)</strong>{" "}
    — det er der gjesten taster koden
  </>,
  <>
    Har{" "}
    <strong className="font-medium text-hus-blekk">wifi / fjerntilgang</strong>{" "}
    (egen wifi eller bro) — så koder kan lages når gjesten kommer
  </>,
  <>
    Settes opp i{" "}
    <strong className="font-medium text-hus-blekk">
      leverandørens egen app
    </strong>{" "}
    (f.eks. Yale Home for Yale) —{" "}
    <strong className="font-medium text-hus-blekk">ikke</strong> låst til et
    alarmselskap som Verisure
  </>,
  <>
    Er et merke Verta støtter:{" "}
    <strong className="font-medium text-hus-blekk">
      Igloohome, Yale, Nuki, Salto, August, Schlage
    </strong>{" "}
    m.fl.
  </>,
];

export default async function SmartlasGuidePage() {
  await requireUser();

  return (
    <Side>
      <Situasjon
        merke="Smartlås"
        tittel="Gjesten skal komme seg inn uten at du er der."
        under="Verta kobler til smartlåser via Seam og lager automatisk en adgangskode for hver booking. Her er låsene vi anbefaler."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {PICKS.map((p) => (
          <Kort key={p.title}>
            <div className="flex flex-col gap-3">
              <Merke tone="gull">{p.badge}</Merke>
              <p className="text-base font-light text-hus-blekk">{p.title}</p>
              <p className="text-sm leading-relaxed text-hus-dempet">{p.body}</p>
              <p className="text-sm text-hus-svak">
                <span className="text-hus-dempet">Kjøp:</span> {p.buy}
              </p>
            </div>
          </Kort>
        ))}
      </div>

      <Flate
        tittel="Sjekkliste før du kjøper"
        hva="Fire ting som avgjør om låsen fungerer sammen med Verta."
      >
        <ul className="flex flex-col gap-3">
          {SJEKKLISTE.map((punkt, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-hus-dempet">
              <span aria-hidden="true" className="shrink-0 text-hus-god">
                ✓
              </span>
              <span>{punkt}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 border-t border-hus-linje pt-5 text-sm leading-relaxed text-hus-svak">
          Unntak:{" "}
          <strong className="font-medium text-hus-dempet">Igloohome</strong>{" "}
          trenger ikke nett — den lager koder offline, og er derfor det tryggeste
          valget for hytter.
        </p>
      </Flate>

      <Flate
        tittel="Når låsen er kjøpt"
        hva="Koblingen gjøres per bolig, og tar under et minutt."
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-hus-dempet">
            Gå til boligen og velg «Koble til smartlås».
          </p>
          <Handling href="/dashboard/properties" vekt="gull">
            Til eiendommene
          </Handling>
        </div>
      </Flate>
    </Side>
  );
}
