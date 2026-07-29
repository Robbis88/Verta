"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Felt, Handling, Kvittering } from "@/components/hus";

/**
 * Sett passord — modul 8. Kun presentasjon; samme kall mot
 * supabase.auth.updateUser og samme validering.
 */
export function SetPassword() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (password.length < 8) return setError("Passord må ha minst 8 tegn");
    if (password !== confirm) return setError("Passordene er ikke like");

    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      setError("Kunne ikke oppdatere passordet. Prøv igjen.");
      return;
    }
    setPassword("");
    setConfirm("");
    setDone(true);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Felt
          navn="new-password"
          merke="Nytt passord"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Felt
          navn="new-confirm"
          merke="Gjenta passord"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <Kvittering
        feil={error ?? undefined}
        ok={done ? "Passordet er lagret." : undefined}
      />
      <div>
        <Handling type="submit" vekt="gull" disabled={pending}>
          {pending ? "Lagrer …" : "Lagre passord"}
        </Handling>
      </div>
    </form>
  );
}
