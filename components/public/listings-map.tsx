"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";

import { formatNok } from "@/lib/utils";

export type MapPin = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  price: number | null;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Interaktivt kart over hytter, med pris-nåler som åpner en popup med lenke til
 * /bo. Leaflet + OpenStreetMap (ingen API-nøkkel). Leaflet lastes dynamisk i
 * useEffect så den aldri kjører under server-rendering.
 */
export function ListingsMap({ pins }: { pins: MapPin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || pins.length === 0) return;

    let map: Leaflet.Map | undefined;
    let cancelled = false;

    (async () => {
      const mod = await import("leaflet");
      const L: typeof Leaflet =
        (mod as { default?: typeof Leaflet }).default ??
        (mod as unknown as typeof Leaflet);
      if (cancelled || !el) return;

      map = L.map(el, { scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);

      const latlngs: [number, number][] = [];
      for (const p of pins) {
        const label = p.price != null ? formatNok(p.price) : "Se pris";
        const icon = L.divIcon({
          className: "",
          html:
            `<div style="white-space:nowrap;background:#081b33;color:#fff;` +
            `font-size:12px;font-weight:600;padding:4px 8px;border-radius:9999px;` +
            `box-shadow:0 2px 6px rgba(0,0,0,.3)">${esc(label)}</div>`,
          iconSize: [1, 1],
          iconAnchor: [0, 0],
        });
        L.marker([p.lat, p.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<a href="/bo/${encodeURIComponent(p.slug)}" ` +
              `style="color:#081b33;font-weight:600;text-decoration:underline">` +
              `${esc(p.name)}</a>`,
          );
        latlngs.push([p.lat, p.lng]);
      }

      if (latlngs.length === 1) {
        map.setView(latlngs[0], 11);
      } else {
        map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [pins]);

  if (pins.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="z-0 h-[420px] w-full overflow-hidden rounded-2xl border border-hairline"
    />
  );
}
