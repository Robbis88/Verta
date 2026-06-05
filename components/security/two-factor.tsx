"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Factor = { id: string; friendly_name?: string | null; status: string };
type Enrolling = { factorId: string; qrCode: string; secret: string };

export function TwoFactor() {
  const supabase = createClient();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState<Enrolling | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFactors() {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp ?? []) as Factor[]);
  }

  useEffect(() => {
    loadFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEnroll() {
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEnrolling({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
  }

  async function confirmEnroll() {
    if (!enrolling) return;
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrolling.factorId,
      code: code.trim(),
    });
    setLoading(false);
    if (error) {
      setError("Feil kode — prøv igjen.");
      return;
    }
    setEnrolling(null);
    setCode("");
    await loadFactors();
  }

  async function disable(factorId: string) {
    setLoading(true);
    await supabase.auth.mfa.unenroll({ factorId });
    setLoading(false);
    await loadFactors();
  }

  const active = factors.filter((f) => f.status === "verified");

  return (
    <div className="flex flex-col gap-4">
      {active.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-emerald-600">
            Tofaktor er aktivert ✓
          </p>
          {active.map((f) => (
            <div key={f.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Autentiseringsapp ({f.friendly_name || "TOTP"})
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => disable(f.id)}
              >
                Deaktiver
              </Button>
            </div>
          ))}
        </div>
      )}

      {active.length === 0 && !enrolling && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Beskytt kontoen med en autentiseringsapp (Google Authenticator,
            Authy o.l.).
          </p>
          <Button type="button" onClick={startEnroll} disabled={loading}>
            {loading ? "…" : "Aktiver tofaktor"}
          </Button>
        </div>
      )}

      {enrolling && (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            Skann QR-koden i autentiseringsappen, og skriv inn engangskoden:
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enrolling.qrCode}
            alt="QR-kode for tofaktor"
            className="h-44 w-44 rounded-lg border bg-white p-2"
          />
          <p className="text-xs text-muted-foreground">
            Eller skriv inn nøkkelen manuelt: <code>{enrolling.secret}</code>
          </p>
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="totp">Engangskode</Label>
              <Input
                id="totp"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                placeholder="123456"
                className="w-32"
              />
            </div>
            <Button type="button" onClick={confirmEnroll} disabled={loading}>
              {loading ? "Sjekker…" : "Bekreft"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEnrolling(null);
                setCode("");
              }}
            >
              Avbryt
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
