import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          Verta
        </Link>
        <div className="hidden items-center gap-7 text-sm text-white/70 md:flex">
          <a href="#slik-funker-det" className="hover:text-white">
            Slik funker det
          </a>
          <a href="#priser" className="hover:text-white">Priser</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-white/80 hover:text-white sm:block"
          >
            Logg inn
          </Link>
          <Link
            href="/registrer"
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold/90"
          >
            Kom i gang
          </Link>
        </div>
      </nav>
    </header>
  );
}
