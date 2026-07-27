"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Aksebaren — hele navigasjonen i huset, på fire ord.
 *
 *   ROM = boligen innvendig (utstyr, adgang, lager, historikk, folk, skader)
 *   TID = de neste 90 døgnene: opphold, tomme netter, vask
 *   ORD = Vera som operativsystem — si hva du lurer på
 *   ALT = hele modul-listen, komplett, bak én dør
 *
 * Ligger i app/hjem/layout.tsx og gjelder derfor hele huset.
 */

const AKSER = [
  { navn: "Rom", href: "/hjem/rom", hva: "Huset innvendig" },
  { navn: "Tid", href: "/hjem/tid", hva: "Det som kommer" },
  { navn: "Ord", href: "/hjem/ord", hva: "Spør om hva som helst" },
  { navn: "Alt", href: "/hjem/alt", hva: "Hele systemet" },
];

export function HusAkser() {
  const pathname = usePathname();

  return (
    <>
      <nav className="vh-akser" aria-label="Navigasjon i huset">
        <Link
          href="/hjem"
          className={`vh-akse vh-akse--hjem ${pathname === "/hjem" ? "er-aktiv" : ""}`}
          aria-current={pathname === "/hjem" ? "page" : undefined}
        >
          <span className="vh-akse-navn">Huset</span>
        </Link>
        <span className="vh-akse-skille" aria-hidden="true" />
        {AKSER.map((a) => {
          const aktiv = pathname === a.href || pathname.startsWith(`${a.href}/`);
          return (
            <Link
              key={a.href}
              href={a.href}
              className={`vh-akse ${aktiv ? "er-aktiv" : ""}`}
              aria-current={aktiv ? "page" : undefined}
            >
              <span className="vh-akse-navn">{a.navn}</span>
              <span className="vh-akse-hva">{a.hva}</span>
            </Link>
          );
        })}
      </nav>
      <AkseStil />
    </>
  );
}

function AkseStil() {
  return (
    <style>{`
.vh-akser{position:fixed;left:50%;bottom:clamp(16px,3vh,30px);transform:translateX(-50%);
  z-index:30;display:flex;align-items:stretch;gap:2px;padding:6px;border-radius:999px;
  background:rgba(4,17,31,.78);border:1px solid rgba(216,166,106,.18);
  backdrop-filter:blur(20px) saturate(1.2);-webkit-backdrop-filter:blur(20px) saturate(1.2);
  box-shadow:0 18px 50px rgba(0,0,0,.5);max-width:calc(100vw - 24px);
  opacity:0;animation:vhAkseInn 1.1s ease .8s forwards}
@keyframes vhAkseInn{from{opacity:0;transform:translateX(-50%) translateY(10px)}
  to{opacity:1;transform:translateX(-50%) translateY(0)}}

.vh-akse{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
  padding:9px 18px;border-radius:999px;text-decoration:none;min-width:76px;
  transition:background .45s cubic-bezier(.2,.7,.2,1)}
.vh-akse:hover{background:rgba(216,166,106,.10)}
.vh-akse.er-aktiv{background:rgba(216,166,106,.17)}
.vh-akse-navn{font-size:15px;font-weight:500;letter-spacing:.01em;color:#f5f7fa;line-height:1.15}
.vh-akse.er-aktiv .vh-akse-navn{color:#f2c38b}
.vh-akse-hva{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#7d8ba0;
  white-space:nowrap;line-height:1.4}
.vh-akse--hjem{min-width:0;padding:9px 16px}
.vh-akse--hjem .vh-akse-navn{font-size:12px;font-weight:600;letter-spacing:.16em;
  text-transform:uppercase;color:#7d8ba0}
.vh-akse--hjem:hover .vh-akse-navn,.vh-akse--hjem.er-aktiv .vh-akse-navn{color:#d8a66a}
.vh-akse-skille{width:1px;margin:8px 4px;background:rgba(216,166,106,.18)}
.vh-akse:focus-visible{outline:1px solid #d8a66a;outline-offset:3px}

@media (max-width:560px){
  .vh-akse-hva{display:none}
  .vh-akse{padding:11px 14px;min-width:60px}
  .vh-akse--hjem{padding:11px 12px}
}
@media (prefers-reduced-motion:reduce){
  .vh-akser{opacity:1!important;animation:none!important}
}
`}</style>
  );
}
