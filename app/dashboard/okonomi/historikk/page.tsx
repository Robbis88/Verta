import { getEconomyContext, getTimeline } from "@/lib/okonomi";
import { formatNok } from "@/lib/utils";
import { EmptyOkonomi } from "@/components/okonomi/ui";
import { addEvent, deleteEvent } from "../actions";
import { Felt, Flate, Handling, Merke, Tabell, Velg } from "@/components/hus";

/**
 * Historikk — modul 6. Kun presentasjon; samme tall og samme actions
 * (addEvent, deleteEvent) med uendrede feltnavn.
 */

const KIND_LABEL: Record<string, string> = {
  kjop: "Kjøp",
  oppussing: "Oppussing",
  vedlikehold: "Vedlikehold",
  finans: "Finans",
  verdi: "Verdivurdering",
};

/** De gamle badge-fargene oversatt til husets fem toner. */
const KIND_TONE: Record<string, "ro" | "gull" | "obs" | "god"> = {
  kjop: "gull",
  oppussing: "ro",
  vedlikehold: "god",
  finans: "ro",
  verdi: "obs",
};

const KIND_VALG = [
  { verdi: "kjop", tekst: "Kjøp" },
  { verdi: "oppussing", tekst: "Oppussing" },
  { verdi: "vedlikehold", tekst: "Vedlikehold" },
  { verdi: "finans", tekst: "Finans" },
  { verdi: "verdi", tekst: "Verdivurdering" },
];

export default async function HistorikkPage({
  searchParams,
}: {
  searchParams: Promise<{ eiendom?: string }>;
}) {
  const { eiendom } = await searchParams;
  const { selected, economy } = await getEconomyContext(eiendom);
  if (!selected || !economy) return <EmptyOkonomi />;

  const events = await getTimeline(selected.id);

  const forste = economy.history[0];
  const siste = economy.history[economy.history.length - 1];
  const vekst =
    forste && siste && forste.value > 0
      ? Math.round(((siste.value - forste.value) / forste.value) * 100)
      : null;

  return (
    <>
      <p className="text-sm text-hus-dempet">
        {vekst != null ? (
          <>
            {economy.propertyName} har gått fra{" "}
            <span className="text-hus-blekk">{formatNok(forste.value)}</span> i{" "}
            {forste.year} til{" "}
            <span className="text-hus-gull-lys">{formatNok(siste.value)}</span> i{" "}
            {siste.year} — {vekst >= 0 ? "opp" : "ned"} {Math.abs(vekst)} %.
          </>
        ) : (
          <>Alt som har skjedd med {economy.propertyName}, år for år.</>
        )}
      </p>

      <Flate
        tittel="Utvikling år for år"
        hva="Inn, ut og hva boligen var verdt ved utgangen av året."
      >
        <Tabell
          kolonner={["År", "Inntekt", "Kostnad", "Resultat", "Verdi"]}
          rader={economy.history.map((h) => [
            h.year,
            formatNok(h.income),
            formatNok(h.costs),
            <span
              key="res"
              className={h.result >= 0 ? "text-hus-god" : "text-hus-kritisk"}
            >
              {formatNok(h.result)}
            </span>,
            formatNok(h.value),
          ])}
        />
      </Flate>

      <Flate
        tittel="Tidslinje"
        hva="Hendelsene som forklarer tallene — kjøp, oppussing, refinansiering."
      >
        <div className="flex flex-col gap-5">
          {events.length === 0 ? (
            <p className="text-sm text-hus-dempet">
              Ingen hendelser ennå. Legg til den første under.
            </p>
          ) : (
            <ol className="flex flex-col">
              {events.map((e) => (
                <li key={e.id} className="flex gap-4">
                  <div className="flex w-12 shrink-0 flex-col items-center">
                    <span className="text-sm tabular-nums text-hus-gull-lys">
                      {e.year}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-1 h-full w-px bg-hus-linje"
                    />
                  </div>
                  <div className="flex flex-1 items-start justify-between gap-3 pb-5">
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-hus-blekk">{e.title}</span>
                        <Merke tone={KIND_TONE[e.kind] ?? "ro"}>
                          {KIND_LABEL[e.kind] ?? e.kind}
                        </Merke>
                      </div>
                      {e.amount != null && (
                        <span className="text-xs tabular-nums text-hus-svak">
                          {formatNok(e.amount)}
                        </span>
                      )}
                    </div>
                    <form action={deleteEvent}>
                      <input type="hidden" name="id" value={e.id} />
                      <Handling type="submit" vekt="naken">
                        <span aria-hidden="true">✕</span>
                        <span className="sr-only">Slett hendelse</span>
                      </Handling>
                    </form>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <form
            action={addEvent}
            className="flex flex-col gap-4 border-t border-hus-linje pt-5"
          >
            <input type="hidden" name="property_id" value={selected.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Felt navn="title" merke="Hendelse" required placeholder="Nytt tak" />
              <Velg
                navn="kind"
                merke="Type"
                defaultValue="vedlikehold"
                valg={KIND_VALG}
              />
              <Felt navn="event_date" merke="Dato" type="date" required />
              <Felt navn="amount" merke="Beløp (kr)" type="number" min={0} />
            </div>
            <div>
              <Handling type="submit" vekt="stille">
                Legg til
              </Handling>
            </div>
          </form>
        </div>
      </Flate>
    </>
  );
}
