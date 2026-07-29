"use client";

import { useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Felt, Handling, Kvittering, Omrade } from "@/components/hus";

const BUCKET = "incident-photos";
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

type CreateUpload = (
  bookingId: string,
  contentType: string,
) => Promise<{ path: string; token: string } | null>;

/**
 * Skjema for å melde skade: beløp, beskrivelse og bilder. Bildene lastes opp
 * direkte til Storage (signert URL), og URL-ene sendes med skjemaet.
 */
export function ClaimForm({
  bookingId,
  createAction,
  uploadAction,
}: {
  bookingId: string;
  createAction: (formData: FormData) => Promise<void>;
  uploadAction: CreateUpload;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<{ path: string; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList) {
    setError(null);
    setUploading(true);
    const supabase = createClient();
    for (const file of Array.from(files)) {
      if (!ALLOWED.includes(file.type) || file.size > MAX_BYTES) {
        setError("Kun JPG/PNG/WebP, maks 10 MB per bilde.");
        continue;
      }
      try {
        const signed = await uploadAction(bookingId, file.type);
        if (!signed) {
          setError("Kunne ikke starte opplasting.");
          continue;
        }
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .uploadToSignedUrl(signed.path, signed.token, file);
        if (upErr) {
          setError("Opplasting feilet.");
          continue;
        }
        // Lagre stien (sendes med skjemaet); forhåndsvis fra den lokale fila.
        setPhotos((p) => [
          ...p,
          { path: signed.path, preview: URL.createObjectURL(file) },
        ]);
      } catch {
        setError("Noe gikk galt under opplastingen.");
      }
    }
    setUploading(false);
  }

  return (
    <form action={createAction} className="flex flex-col gap-4">
      <input type="hidden" name="booking_id" value={bookingId} />
      {photos.map((p) => (
        <input key={p.path} type="hidden" name="photos" value={p.path} />
      ))}

      <Felt
        navn="amount"
        merke="Beløp (kr)"
        type="number"
        min={1}
        step={1}
        required
        placeholder="F.eks. 1500"
      />

      <Omrade
        navn="description"
        merke="Beskrivelse"
        rows={3}
        placeholder="Beskriv skaden — f.eks. «Madrass tilsølt, måtte renses/erstattes»."
      />

      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-hus-svak">
          Bilder (bevis)
        </span>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.path}
                src={p.preview}
                alt="Skadebilde"
                className="aspect-square w-full rounded-xl border border-hus-linje object-cover"
              />
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div>
          <Handling
            type="button"
            vekt="stille"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Laster opp …" : "Last opp bilder"}
          </Handling>
        </div>
        <Kvittering feil={error ?? undefined} />
      </div>

      <div>
        <Handling type="submit" vekt="gull" disabled={uploading}>
          Send krav til gjesten
        </Handling>
      </div>
      <p className="text-xs text-hus-svak">
        Gjesten får kravet på e-post med bildene og betaler via en lenke. Kortet
        belastes først når de betaler.
      </p>
    </form>
  );
}
