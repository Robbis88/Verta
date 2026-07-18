import Link from "next/link";

import { FooterSignup } from "./footer-signup";

const columns = [
  {
    heading: "Verta",
    links: [
      { label: "Finn hytter", href: "/hytter" },
      { label: "Slik funker det", href: "/#slik-funker-det" },
      { label: "Priser", href: "/#priser" },
      { label: "Kom i gang", href: "/registrer" },
    ],
  },
  {
    heading: "Juridisk",
    links: [
      { label: "Vilkår", href: "/vilkar" },
      { label: "Salgsvilkår", href: "/salgsvilkar" },
      { label: "Personvern", href: "/personvern" },
      { label: "Databehandleravtale", href: "/databehandleravtale" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Kontakt", href: "mailto:hei@verta.no" },
      { label: "Logg inn", href: "/login" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-navy px-6 py-16 text-white">
      <div className="mx-auto mb-8 max-w-6xl">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="mb-4 font-semibold">{col.heading}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 transition hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-4 font-semibold">Nytt fra Verta</h3>
            <FooterSignup />
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-white/10 pt-8 md:flex-row">
        <p className="text-sm text-gold">
          © 2026 Verta AS. Alle rettigheter reservert.
        </p>
        <p className="text-sm text-gold">Laget i Norge</p>
      </div>
    </footer>
  );
}
