import Image from "next/image";
import { Check } from "lucide-react";

import { IMG } from "@/lib/images";

const points = [
  "Norske skatteregler innebygd",
  "Hytte på fjellet eller leilighet ved sjøen",
  "Én kalender for alle kanaler",
];

export function Showcase() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-sm">
          <Image
            src={IMG.rorbuer}
            alt="Røde rorbuer ved fjorden i Lofoten"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-5">
          <p className="text-sm font-semibold tracking-wide text-gold">
            BYGGET FOR NORGE
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Laget for norske hytter og leiligheter
          </h2>
          <p className="leading-relaxed text-ink">
            Verta er bygget for norske utleiere — fra hytta på fjellet til
            leiligheten ved sjøen. Du beholder kontrollen, sparer gebyrer, og
            slipper skatte- og kalenderrotet.
          </p>
          <ul className="flex flex-col gap-3">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-ink">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <Check className="size-4" strokeWidth={2} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
