"use client";

import { useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const BUCKET = "property-videos";
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB
const ALLOWED = ["video/mp4", "video/webm"];

type CreateUpload = (
  propertyId: string,
  contentType: string,
) => Promise<{ path: string; token: string } | null>;
type SetVideo = (propertyId: string, path: string) => Promise<void>;
type RemoveVideo = (propertyId: string) => Promise<void>;

/**
 * Laster opp en hero-video direkte til Supabase Storage via en signert URL,
 * så vi omgår Vercels grense på request-størrelse. Viser gjeldende video og
 * lar eieren bytte eller fjerne den.
 */
export function VideoUploader({
  propertyId,
  videoUrl,
  createUpload,
  setVideo,
  removeVideo,
}: {
  propertyId: string;
  videoUrl: string | null;
  createUpload: CreateUpload;
  setVideo: SetVideo;
  removeVideo: RemoveVideo;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onFile(file: File) {
    if (!ALLOWED.includes(file.type)) {
      setStatus("Kun mp4 eller webm.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("Videoen er for stor (maks 100 MB).");
      return;
    }
    setBusy(true);
    setStatus("Laster opp… dette kan ta litt tid.");
    try {
      const signed = await createUpload(propertyId, file.type);
      if (!signed) {
        setStatus("Kunne ikke starte opplasting.");
        setBusy(false);
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(signed.path, signed.token, file);
      if (error) {
        setStatus("Opplasting feilet. Prøv igjen.");
        setBusy(false);
        return;
      }
      await setVideo(propertyId, signed.path);
      setStatus("Video lastet opp ✓");
    } catch {
      setStatus("Noe gikk galt under opplastingen.");
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {videoUrl ? (
        <video
          src={videoUrl}
          controls
          className="w-full max-w-md rounded-lg border border-hairline"
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Ingen video ennå. En kort video vises som bakgrunn øverst på den
          offentlige siden.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Laster opp…" : videoUrl ? "Bytt video" : "Last opp video"}
        </Button>
        {videoUrl && !busy && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => removeVideo(propertyId)}
          >
            Fjern video
          </Button>
        )}
      </div>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
      <p className="text-xs text-muted-foreground">
        mp4 eller webm, maks 100 MB. Hold den kort (10–30 sek) for rask lasting.
      </p>
    </div>
  );
}
