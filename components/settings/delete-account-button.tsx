"use client";

import { deleteAccount } from "@/lib/actions/gdpr";
import { Handling } from "@/components/hus";

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
      <Handling
        type="submit"
        vekt="stille"
        className="border-hus-kritisk/40 text-hus-kritisk hover:border-hus-kritisk hover:text-hus-kritisk"
      >
        Slett konto og alle data
      </Handling>
    </form>
  );
}
