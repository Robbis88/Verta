import { DashboardPreview } from "./DashboardPreview";

export function ProductScreens() {
  return (
    <section className="bg-cloud px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Se hele driften i ett blikk
          </h2>
          <p className="mt-4 text-lg text-ink">
            Inntekter, beleggsgrad, kalender og oppgaver — samlet i ett tydelig
            dashboard.
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
