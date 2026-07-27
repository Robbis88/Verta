import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteExpense } from "./actions";
import { ExpenseForm } from "@/components/expenses/expense-form";
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

/**
 * Utgifter — modul 1 i UI-refaktoren (se UI-REFACTOR.md).
 *
 * Kun presentasjonen er endret: samme spørringer, samme `deleteExpense`, samme
 * `ExpenseForm` med samme felter. Siden åpner nå med situasjonen — hva du
 * faktisk har ført i år — før den viser skjema og liste.
 */

type Expense = {
  id: string;
  property_id: string;
  category: string;
  amount: number;
  expense_date: string;
  description: string | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  cleaning: "Rengjøring",
  maintenance: "Vedlikehold",
  supplies: "Forbruksvarer",
  utilities: "Strøm / kommunale",
  insurance: "Forsikring",
  fee: "Gebyr",
  other: "Annet",
};

/** «12. mar» — kort nok til venstre kolonne. */
function kortDato(iso: string): string {
  return new Date(`${iso}T00:00:00Z`)
    .toLocaleDateString("nb-NO", { day: "numeric", month: "short", timeZone: "UTC" })
    .replace(".", "");
}

export default async function UtgifterPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await requireUser();
  const { year: yearParam } = await searchParams;
  const currentYear = new Date().getUTCFullYear();
  const year = Number(yearParam) || currentYear;
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const supabase = await createClient();
  const { data: props } = await supabase
    .from("properties")
    .select("id,name")
    .order("name");
  const properties = (props ?? []) as { id: string; name: string }[];
  const nameById = new Map(properties.map((p) => [p.id, p.name]));

  const { data: expData } = await supabase
    .from("expenses")
    .select("id,property_id,category,amount,expense_date,description")
    .gte("expense_date", `${year}-01-01`)
    .lt("expense_date", `${year + 1}-01-01`)
    .order("expense_date", { ascending: false });
  const expenses = (expData ?? []) as Expense[];
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Avledet av tallene vi allerede har — ingen nye spørringer.
  const perKategori = new Map<string, number>();
  for (const e of expenses) {
    perKategori.set(
      e.category,
      (perKategori.get(e.category) ?? 0) + Number(e.amount),
    );
  }
  const storst = [...perKategori.entries()].sort((a, b) => b[1] - a[1])[0];
  const sist = expenses[0];

  const arValg = (
    <>
      {years.map((y) => (
        <Handling
          key={y}
          href={`/dashboard/utgifter?year=${y}`}
          vekt={y === year ? "gull" : "stille"}
        >
          {y}
        </Handling>
      ))}
    </>
  );

  if (properties.length === 0) {
    return (
      <Side>
        <Situasjon
          merke="Utgifter"
          tittel="Du har ingen bolig å føre utgifter på ennå."
          under="Legg inn boligen din først, så kan du begynne å samle fradrag."
        />
        <Flate>
          <Tomt
            tittel="Ingen bolig registrert."
            hva="Utgifter føres per bolig, og trekkes automatisk fra i skatterapporten."
            knappTekst="Legg til bolig"
            knappHref="/dashboard/properties/new"
          />
        </Flate>
      </Side>
    );
  }

  return (
    <Side>
      <Situasjon
        merke="Utgifter"
        tittel={
          total > 0
            ? `Du har ført ${formatNok(total)} i utgifter i ${year}.`
            : `Du har ikke ført noen utgifter i ${year} ennå.`
        }
        under={
          total > 0
            ? "Alt som står her trekkes fra i skatterapporten. Det er penger spart, ikke papirarbeid."
            : "Hver utgift du fører reduserer skatten din. Det tar tjue sekunder per bilag."
        }
        handling={arValg}
      />

      {total > 0 && (
        <TallRekke>
          <Tall verdi={formatNok(total)} navn={`Ført i ${year}`} tone="gull" />
          <Tall
            verdi={`${expenses.length}`}
            navn={expenses.length === 1 ? "bilag" : "bilag"}
          />
          <Tall
            verdi={storst ? (CATEGORY_LABEL[storst[0]] ?? storst[0]) : "—"}
            navn="største post"
          />
          <Tall
            verdi={sist ? kortDato(sist.expense_date) : "—"}
            navn="sist ført"
          />
        </TallRekke>
      )}

      <Flate
        tittel="Før en utgift"
        hva="Beløp, dato og hva det var. Resten ordner seg selv."
      >
        <ExpenseForm properties={properties} />
      </Flate>

      <Flate tittel={`Alt i ${year}`}>
        {expenses.length === 0 ? (
          <Tomt
            tittel={`Ingenting ført i ${year}.`}
            hva="Strøm, forsikring, vask, vedlikehold — alt som gjelder utleien hører hjemme her."
          />
        ) : (
          <Liste>
            {expenses.map((e) => (
              <Rad
                key={e.id}
                nar={kortDato(e.expense_date)}
                hva={
                  e.description
                    ? `${CATEGORY_LABEL[e.category] ?? e.category} · ${e.description}`
                    : (CATEGORY_LABEL[e.category] ?? e.category)
                }
                detalj={nameById.get(e.property_id) ?? undefined}
                verdi={formatNok(Number(e.amount))}
                handling={
                  <form action={deleteExpense}>
                    <input type="hidden" name="id" value={e.id} />
                    <Handling type="submit" vekt="naken">
                      Slett
                    </Handling>
                  </form>
                }
              />
            ))}
          </Liste>
        )}
      </Flate>
    </Side>
  );
}
