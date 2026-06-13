import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          Verta
        </Link>
        <div className="hidden items-center gap-7 text-sm text-white/70 md:flex">
          <a href="#funksjoner" className="hover:text-white">Funksjoner</a>
          <a href="#innsikt" className="hover:text-white">Innsikt</a>
          <a href="#integrasjoner" className="hover:text-white">Integrasjoner</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-white/80 hover:text-white sm:block"
          >
            Logg inn
          </Link>
          <a
            href="mailto:hei@verta.no?subject=Book%20demo%20av%20Verta"
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold/90"
          >
            Book demo
          </a>
        </div>
      </nav>
    </header>
  );
}
