"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { feltKlasse } from "@/components/hus";
import type { PropertyRef } from "@/lib/okonomi";

const TABS = [
  { href: "/dashboard/okonomi", label: "Oversikt" },
  { href: "/dashboard/okonomi/kostnader", label: "Hva koster hytten?" },
  { href: "/dashboard/okonomi/inntekter", label: "Inntekter" },
  { href: "/dashboard/okonomi/eierskap", label: "Delt eierskap" },
  { href: "/dashboard/okonomi/historikk", label: "Historikk" },
  { href: "/dashboard/okonomi/bankrapport", label: "Bankrapport" },
];

/**
 * Fanene i Eiendomsøkonomi — modul 6. Kun presentasjon; samme ruter, samme
 * `?eiendom=`-parameter og samme oppførsel i boligvelgeren.
 */
export function OkonomiNav({ properties }: { properties: PropertyRef[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const eiendom = params.get("eiendom") ?? properties[0]?.id ?? "";
  const qs = eiendom ? `?eiendom=${eiendom}` : "";

  return (
    <div className="hus-stig flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-hus-gull">
            Eiendomsøkonomi
          </p>
          <h1 className="mt-3 text-3xl font-light leading-tight text-hus-blekk sm:text-4xl">
            Hva boligen er verdt, og hva den koster deg.
          </h1>
        </div>
        {properties.length > 1 && (
          <select
            value={eiendom}
            aria-label="Eiendom"
            onChange={(e) => {
              const p = new URLSearchParams(Array.from(params));
              p.set("eiendom", e.target.value);
              router.push(`${pathname}?${p.toString()}`);
            }}
            className={`${feltKlasse} h-10 w-auto cursor-pointer`}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id} className="bg-hus-hev">
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-hus-linje">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={`${t.href}${qs}`}
              className={cn(
                "rounded-t-md px-3 py-2.5 text-sm transition-colors",
                active
                  ? "border-b-2 border-hus-gull font-medium text-hus-blekk"
                  : "text-hus-svak hover:text-hus-dempet",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
