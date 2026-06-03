import Link from "next/link";

export const metadata = {
  title: "Personvern — Verta",
};

export default function PersonvernPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Til forsiden
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy">
        Personvernerklæring
      </h1>
      <div className="mt-6 flex flex-col gap-4 text-ink">
        <p>
          Verta AS behandler personopplysninger i samsvar med
          personvernforordningen (GDPR). Denne siden beskriver kort hvilke data
          vi samler inn og hvordan de brukes.
        </p>
        <h2 className="text-xl font-semibold text-navy">Hvilke data vi lagrer</h2>
        <p>
          Konto­informasjon (navn, e-post, telefon), eiendommene dine,
          bookinger, markedsføringskampanjer og skatterelaterte beregninger.
          Vi lagrer ikke fødselsnummer.
        </p>
        <h2 className="text-xl font-semibold text-navy">Dine rettigheter</h2>
        <p>
          Du kan når som helst laste ned alle dine data eller slette kontoen din
          under Innstillinger i dashbordet.
        </p>
        <h2 className="text-xl font-semibold text-navy">Informasjonskapsler</h2>
        <p>
          Vi bruker nødvendige informasjonskapsler for innlogging, og valgfrie
          for analyse dersom du samtykker.
        </p>
        <p className="text-sm text-muted-foreground">
          Dette er en foreløpig erklæring og vil bli utfylt før lansering.
        </p>
      </div>
    </main>
  );
}
