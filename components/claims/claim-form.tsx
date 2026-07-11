"use client";

import { useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const BUCKET = "incident-photos";
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

type CreateUpload = (
  bookingId: string,
  contentType: string,
) => Promise<{ path: string; token: string; publicUrl: string } | null>;

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
  const [photos, setPhotos] = useState<string[]>([]);
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
        setPhotos((p) => [...p, signed.publicUrl]);
      } catch {
        setError("Noe gikk galt under opplastingen.");
      }
    }
    setUploading(false);
  }

  return (
    <form action={createAction} className="flex max-w-lg flex-col gap-4">
      <input type="hidden" name="booking_id" value={bookingId} />
      {photos.map((url) => (
        <input key={url} type="hidden" name="photos" value={url} />
      ))}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="amount">Beløp (kr)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min={1}
          step={1}
          required
          placeholder="F.eks. 1500"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Beskriv skaden — f.eks. «Madrass tilsølt, måtte renses/erstattes»."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Bilder (bevis)</Label>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt="Skadebilde"
                className="aspect-square w-full rounded-md object-cover"
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
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Laster opp…" : "Last opp bilder"}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div>
        <Button type="submit" disabled={uploading}>
          Send krav til gjesten
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Gjesten får kravet på e-post med bildene og betaler via en lenke. Kortet
        belastes først når de betaler.
      </p>
    </form>
  );
}
