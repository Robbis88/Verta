import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const columns = [
  {
    heading: "Verta",
    links: [
      { label: "Om oss", href: "#" },
      { label: "Kontakt", href: "#" },
      { label: "Blogg", href: "#" },
    ],
  },
  {
    heading: "Juridisk",
    links: [
      { label: "Vilkår", href: "#" },
      { label: "Personvern", href: "/personvern" },
      { label: "Cookies", href: "/personvern" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Hjelp", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Chat", href: "#" },
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
            <div className="flex flex-col gap-2">
              <Input
                type="email"
                placeholder="din@epost.no"
                className="border-white/20 bg-white/5 text-white placeholder:text-white/50"
              />
              <Button
                type="button"
                className="h-auto rounded-lg bg-gold py-2 font-semibold text-navy hover:bg-gold/90"
              >
                Abonner
              </Button>
              <p className="text-xs text-white/50">
                Vi sender 1 e-post per måned.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-white/10 pt-8 md:flex-row">
        <p className="text-sm text-gold">
          © 2026 Verta AS. Alle rettigheter reservert.
        </p>
        <p className="text-sm text-gold">Made in Norway 🇳🇴</p>
      </div>
    </footer>
  );
}
