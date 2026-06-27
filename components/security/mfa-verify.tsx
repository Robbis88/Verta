"use client";

import Link from "next/link";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Trapper opp en innlogget sesjon fra AAL1 til AAL2 ved å bekrefte en
 * engangskode fra brukerens registrerte autentiseringsapp.
 */
export function MfaVerify({ next }: { next: string }) {
  const supabase = createClient();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noFactor, setNoFactor] = useState(false);

  async function verify() {
    setLoading(true);
    setError(null);

    const { data: f } = await supabase.auth.mfa.listFactors();
    const factor = (f?.totp ?? []).find((x) => x.status === "verified");
    if (!factor) {
      setNoFactor(true);
      setLoading(false);
      return;
    }

    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
      factorId: factor.id,
    });
    if (chErr || !ch) {
      setError("Kunne ikke starte verifisering. Prøv igjen.");
      setLoading(false);
      return;
    }

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: ch.id,
      code: code.trim(),
    });
    if (vErr) {
      setError("Feil kode — prøv igjen.");
      setLoading(false);
      return;
    }

    window.location.assign(next);
  }

  if (noFactor) {
    return (
      <p className="text-sm text-muted-foreground">
        Kontoen har ingen autentiseringsapp registrert.{" "}
        <Link href="/dashboard/sikkerhet" className="underline">
          Aktiver tofaktor
        </Link>{" "}
        først.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="totp">Engangskode</Label>
        <Input
          id="totp"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          className="w-40"
        />
      </div>
      <div>
        <Button type="button" onClick={verify} disabled={loading || code.length < 6}>
          {loading ? "Bekrefter…" : "Bekreft"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
