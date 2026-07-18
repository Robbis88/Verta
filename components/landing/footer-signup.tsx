"use client";

import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { subscribeFooter } from "./footer-actions";

export function FooterSignup() {
  const [state, action, pending] = useActionState(subscribeFooter, null);

  if (state?.ok) {
    return (
      <p className="text-sm text-white/80">
        Takk! Du er meldt på. Vi sender maks 1 e-post i måneden. 🎉
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <Input
        name="email"
        type="email"
        required
        placeholder="din@epost.no"
        className="border-white/20 bg-white/5 text-white placeholder:text-white/50"
      />
      <Button
        type="submit"
        disabled={pending}
        className="h-auto rounded-lg bg-gold py-2 font-semibold text-navy hover:bg-gold/90 disabled:opacity-60"
      >
        {pending ? "Sender…" : "Abonner"}
      </Button>
      <p className="text-xs text-white/50">
        Ved å abonnere godtar du å motta nyhetsbrev. Meld deg av når som helst.
      </p>
    </form>
  );
}
