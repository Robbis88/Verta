"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <form onSubmit={submit} className="flex max-w-sm flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Sett eller endre passordet du logger inn med.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-password">Nytt passord</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-confirm">Gjenta passord</Label>
        <Input
          id="new-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {done && <p className="text-sm text-emerald-600">Passordet er lagret ✓</p>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Lagrer…" : "Lagre passord"}
        </Button>
      </div>
    </form>
  );
}
