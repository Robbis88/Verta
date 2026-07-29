"use client";

import { Handling } from "@/components/hus";

export function DeletePropertyButton({
  action,
  id,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Er du sikker på at du vil slette denne eiendommen?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Handling
        type="submit"
        vekt="stille"
        className="border-hus-kritisk/40 text-hus-kritisk hover:border-hus-kritisk hover:text-hus-kritisk"
      >
        Slett eiendom
      </Handling>
    </form>
  );
}
