"use client";

import { useState, useTransition } from "react";

import { feltKlasse, Handling, Omrade } from "@/components/hus";
import { cn } from "@/lib/utils";

type Action = (formData: FormData) => Promise<void>;

const TONES = [
  { value: "vennlig og inspirerende", label: "Vennlig og inspirerende" },
  { value: "elegant og eksklusiv", label: "Elegant og eksklusiv" },
  { value: "avslappet og lun", label: "Avslappet og lun" },
  { value: "energisk og eventyrlysten", label: "Energisk og eventyrlysten" },
  { value: "kort og saklig", label: "Kort og saklig" },
];

/**
 * Lar eieren redigere den AI-genererte annonseteksten som vises på den
 * offentlige boligvisningen, og regenerere den i valgt tone.
 */
export function PublicListingEditor({
  propertyId,
  listing,
  saveAction,
  regenerateAction,
  publicUrl,
}: {
  propertyId: string;
  listing: string;
  saveAction: Action;
  regenerateAction: Action;
  publicUrl: string;
}) {
  const [tone, setTone] = useState(TONES[0].value);
  const [regenerating, startRegen] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-hus-dempet">
        Denne teksten vises på den offentlige siden{" "}
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-hus-gull-lys underline"
        >
          {publicUrl.replace(/^https?:\/\//, "")}
        </a>
        . Generer med AI, velg tone, og finpuss selv.
      </p>

      <form action={saveAction} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={propertyId} />
        <Omrade
          navn="public_listing"
          merke="Annonsetekst"
          rows={8}
          defaultValue={listing}
          key={listing}
          placeholder="Ingen annonsetekst ennå. Trykk «Generer med AI», eller skriv din egen."
        />
        <div>
          <Handling type="submit" vekt="gull">
            Lagre tekst
          </Handling>
        </div>
      </form>

      <form
        action={(fd) => startRegen(() => regenerateAction(fd))}
        className="flex flex-wrap items-center gap-3 border-t border-hus-linje pt-4"
      >
        <input type="hidden" name="id" value={propertyId} />
        <input type="hidden" name="tone" value={tone} />
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-hus-svak">
          Tone
        </span>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className={cn(feltKlasse, "w-auto cursor-pointer")}
        >
          {TONES.map((t) => (
            <option
              key={t.value}
              value={t.value}
              className="bg-hus-hev text-hus-blekk"
            >
              {t.label}
            </option>
          ))}
        </select>
        <Handling type="submit" vekt="stille" disabled={regenerating}>
          {regenerating ? "Genererer …" : "Generer med AI"}
        </Handling>
      </form>
    </div>
  );
}
