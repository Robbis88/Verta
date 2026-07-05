"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import type { PropertyRef } from "@/lib/okonomi";

const TABS = [
  { href: "/dashboard/okonomi", label: "Oversikt" },
  { href: "/dashboard/okonomi/kostnader", label: "Hva koster hytten?" },
  { href: "/dashboard/okonomi/inntekter", label: "Inntekter" },
  { href: "/dashboard/okonomi/eierskap", label: "Delt eierskap" },
  { href: "/dashboard/okonomi/historikk", label: "Historikk" },
  { href: "/dashboard/okonomi/bankrapport", label: "Bankrapport" },
];

export function OkonomiNav({ properties }: { properties: PropertyRef[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const eiendom = params.get("eiendom") ?? properties[0]?.id ?? "";
  const qs = eiendom ? `?eiendom=${eiendom}` : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Eiendomsøkonomi</h1>
        {properties.length > 1 && (
          <select
            value={eiendom}
            onChange={(e) => {
              const p = new URLSearchParams(Array.from(params));
              p.set("eiendom", e.target.value);
              router.push(`${pathname}?${p.toString()}`);
            }}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-hairline">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={`${t.href}${qs}`}
              className={cn(
                "rounded-t-md px-3 py-2 text-sm transition",
                active
                  ? "border-b-2 border-gold font-medium text-navy"
                  : "text-muted-foreground hover:text-foreground",
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
