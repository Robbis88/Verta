import { createClient } from "@/lib/supabase/server";
import { generateTaxReport } from "./actions";
import { PrintButton } from "@/components/tax/print-button";
import { formatNok } from "@/lib/utils";
import {
  Flate,
  Handling,
  Liste,
  Rad,
  Side,
  Situasjon,
  Tall,
  TallRekke,
  Tomt,
} from "@/components/hus";
import type { TaxReport } from "@/lib/tax";

/**
 * Skatterapport — modul 2 i UI-refaktoren. Kun presentasjon.
 *
 * Samme spørring, samme `generateTaxReport`, samme to skattemodeller og samme
 * forbehold. Rapporten er bygget av Rad med `sterk` på sumlinjene i stedet for
 * en <table>, så den arver husets utskriftsstil: mørk på skjerm, hvitt papir
 * når du skriver den ut.
 */
export default async function TaxPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const currentYear = new Date().getUTCFullYear();
  const year = Number(yearParam) || currentYear;
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const supabase = await createClient();
  const { data } = await supabase
    .from("tax_reports")
    .select("*")
    .eq("year", year)
    .single();
  const report = data as TaxReport | null;

  const arValg = (
    <span className="hus-ikke-print flex flex-wrap gap-2">
      {years.map((y) => (
        <Handling
          key={y}
          href={`/dashboard/tax?year=${y}`}
          vekt={y === year ? "gull" : "stille"}
        >
          {y}
        </Handling>
      ))}
    </span>
  );

  if (!report) {
    return (
      <Side>
        <Situasjon
          merke="Skatt"
          tittel={`Du har ingen skatterapport for ${year} ennå.`}
          under="Verta regner ut grunnlaget fra bookingene og utgiftene dine. Det tar noen sekunder."
          handling={arValg}
        />
        <Flate>
          <Tomt
            tittel={`Ingen rapport for ${year}.`}
            hva="Alt Verta trenger ligger allerede i systemet — inntekter per kanal og førte utgifter."
          />
          <form action={generateTaxReport} className="flex justify-center">
            <input type="hidden" name="year" value={year} />
            <Handling type="submit" vekt="gull">
              Lag rapporten for {year}
            </Handling>
          </form>
        </Flate>
      </Side>
    );
  }

  const kilder: { navn: string; belop: number }[] = [
    { navn: "Airbnb", belop: report.income_from_airbnb },
    { navn: "Booking.com", belop: report.income_from_booking },
    { navn: "Direkte booking", belop: report.income_from_verta_direct },
    { navn: "Verta-kanaler", belop: report.income_from_verta_boosts },
  ];

  const netto = report.net_income ?? report.total_income;

  return (
    <Side>
      <Situasjon
        merke="Skatt"
        tittel={`Du hadde ${formatNok(report.total_income)} i utleieinntekt i ${report.year}.`}
        under={`Etter fribeløp og fradrag er ${formatNok(report.taxable_income)} skattepliktig, hvis dette er egen bolig. Er det hytte eller sekundærbolig, er tallet ${formatNok(netto)}.`}
        handling={arValg}
      />

      <TallRekke>
        <Tall
          verdi={formatNok(report.total_income)}
          navn="sum inntekt"
          tone="gull"
        />
        <Tall
          verdi={formatNok(report.total_expenses ?? 0)}
          navn="førte utgifter"
        />
        <Tall verdi={formatNok(netto)} navn="netto (hytte)" />
        <Tall
          verdi={formatNok(report.taxable_income)}
          navn="skattepliktig (egen bolig)"
          tone="obs"
        />
      </TallRekke>

      <Flate
        tittel={`Skatterapport ${report.year}`}
        hva="Utleieinntekter og beregnet skattepliktig beløp."
      >
        <Liste>
          {kilder.map((k) => (
            <Rad key={k.navn} hva={k.navn} verdi={formatNok(k.belop)} />
          ))}
          <Rad hva="Sum inntekt" verdi={formatNok(report.total_income)} sterk />
          <Rad
            hva="Provisjon betalt til Verta"
            verdi={formatNok(report.verta_commission_paid)}
          />
          <Rad
            hva="Fradragsberettigede utgifter"
            verdi={`−${formatNok(report.total_expenses ?? 0)}`}
          />
          <Rad
            hva="Netto utleieresultat"
            detalj="hytte / sekundærbolig — regnskapsligning"
            verdi={formatNok(netto)}
            sterk
          />
          <Rad hva="Fribeløp (egen bolig)" verdi={`−${formatNok(15000)}`} />
          <Rad
            hva="Skattepliktig inntekt (85 %)"
            detalj="korttidsutleie av egen bolig"
            verdi={formatNok(report.taxable_income)}
            tone="gull"
            sterk
          />
        </Liste>

        <p className="mt-6 text-xs leading-relaxed text-hus-svak">
          To modeller vises: <strong className="text-hus-dempet">egen bolig</strong>{" "}
          (fribeløp 15 000 kr + 85 %) og{" "}
          <strong className="text-hus-dempet">hytte/sekundærbolig</strong> (netto
          inntekt minus utgifter). Hvilken som gjelder avhenger av din situasjon —
          sjekk reglene hos Skatteetaten.
        </p>
      </Flate>

      <div className="hus-ikke-print flex flex-wrap gap-2">
        <PrintButton />
        <Handling href={`/api/tax/${year}`} vekt="stille">
          Last ned JSON
        </Handling>
        <form action={generateTaxReport}>
          <input type="hidden" name="year" value={year} />
          <Handling type="submit" vekt="naken">
            Oppdater tallene
          </Handling>
        </form>
      </div>
    </Side>
  );
}
