"use client";

import { Button } from "@/components/ui/button";

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
      <Button type="submit" variant="destructive">
        Slett eiendom
      </Button>
    </form>
  );
}
