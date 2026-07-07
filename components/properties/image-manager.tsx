"use client";

import { useRef, useTransition } from "react";

import { Button } from "@/components/ui/button";

type ImageAction = (formData: FormData) => Promise<void>;

/**
 * Laster opp og fjerner eiendomsbilder. Opplasting skjer med en gang du velger
 * en fil; hvert bilde har en slette-knapp. Bildene vises på den offentlige
 * booking-siden.
 */
export function ImageManager({
  propertyId,
  images,
  uploadAction,
  deleteAction,
}: {
  propertyId: string;
  images: string[];
  uploadAction: ImageAction;
  deleteAction: ImageAction;
}) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-4">
      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((url) => (
            <div key={url} className="group relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-full w-full rounded-md object-cover"
              />
              <form
                action={deleteAction}
                className="absolute right-1 top-1 opacity-0 transition group-hover:opacity-100"
              >
                <input type="hidden" name="property_id" value={propertyId} />
                <input type="hidden" name="url" value={url} />
                <button
                  type="submit"
                  className="rounded-full bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-black/80"
                  aria-label="Slett bilde"
                >
                  ✕
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Ingen bilder ennå.</p>
      )}

      <form ref={formRef} action={uploadAction} className="flex flex-col gap-2">
        <input type="hidden" name="property_id" value={propertyId} />
        {/* Skjult filfelt — knappen under åpner filvelgeren, og opplasting
            starter først når en fil faktisk er valgt (umulig å sende tomt). */}
        <input
          ref={inputRef}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              startTransition(() => formRef.current?.requestSubmit());
            }
          }}
        />
        <div>
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? "Laster opp…" : "Velg bilde og last opp"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG eller WebP, maks 8 MB. Første bilde brukes som hovedbilde.
        </p>
      </form>
    </div>
  );
}
