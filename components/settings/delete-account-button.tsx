"use client";

import { deleteAccount } from "@/lib/actions/gdpr";
import { Button } from "@/components/ui/button";

export function DeleteAccountButton() {
  return (
    <form
      action={deleteAccount}
      onSubmit={(e) => {
        if (
          !confirm(
            "Slette kontoen din og ALLE data (eiendommer, bookinger, osv.)? Dette kan ikke angres.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="destructive">
        Slett konto og alle data
      </Button>
    </form>
  );
}
