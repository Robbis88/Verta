"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
      <p className="text-sm text-muted-foreground">
        Denne teksten vises på den offentlige siden{" "}
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold underline"
        >
          {publicUrl.replace(/^https?:\/\//, "")}
        </a>
        . Generer med AI, velg tone, og finpuss selv.
      </p>

      <form action={saveAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={propertyId} />
        <Textarea
          name="public_listing"
          rows={8}
          defaultValue={listing}
          key={listing}
          placeholder="Ingen annonsetekst ennå. Trykk «Generer med AI», eller skriv din egen."
        />
        <div>
          <Button type="submit" size="sm">
            Lagre tekst
          </Button>
        </div>
      </form>

      <form
        action={(fd) => startRegen(() => regenerateAction(fd))}
        className="flex flex-wrap items-center gap-2 border-t border-hairline pt-4"
      >
        <input type="hidden" name="id" value={propertyId} />
        <input type="hidden" name="tone" value={tone} />
        <span className="text-sm text-muted-foreground">Tone:</span>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {TONES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={regenerating}
        >
          {regenerating ? "Genererer…" : "Generer med AI"}
        </Button>
      </form>
    </div>
  );
}
