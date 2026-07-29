"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Felt, Handling, Kvittering } from "@/components/hus";

/**
 * Tofaktor — modul 8. Kun presentasjon; samme kall mot supabase.auth.mfa
 * (listFactors, enroll, challengeAndVerify, unenroll).
 */

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
        <div className="flex flex-col gap-3">
          <p className="text-sm text-hus-god">Tofaktor er aktivert.</p>
          {active.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="min-w-0 truncate text-hus-dempet">
                Autentiseringsapp ({f.friendly_name || "TOTP"})
              </span>
              <Handling
                type="button"
                vekt="naken"
                disabled={loading}
                onClick={() => disable(f.id)}
              >
                Deaktiver
              </Handling>
            </div>
          ))}
        </div>
      )}

      {active.length === 0 && !enrolling && (
        <div className="flex flex-col items-start gap-4">
          <p className="text-sm leading-relaxed text-hus-dempet">
            Beskytt kontoen med en autentiseringsapp (Google Authenticator, Authy
            o.l.).
          </p>
          <Handling
            type="button"
            vekt="gull"
            onClick={startEnroll}
            disabled={loading}
          >
            {loading ? "…" : "Aktiver tofaktor"}
          </Handling>
        </div>
      )}

      {enrolling && (
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-hus-dempet">
            Skann QR-koden i autentiseringsappen, og skriv inn engangskoden:
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enrolling.qrCode}
            alt="QR-kode for tofaktor"
            className="h-44 w-44 rounded-xl border border-hus-linje bg-white p-2"
          />
          <p className="text-xs text-hus-svak">
            Eller skriv inn nøkkelen manuelt:{" "}
            <code className="text-hus-dempet">{enrolling.secret}</code>
          </p>
          <div className="max-w-[12rem]">
            <Felt
              navn="totp"
              merke="Engangskode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              placeholder="123456"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Handling
              type="button"
              vekt="gull"
              onClick={confirmEnroll}
              disabled={loading}
            >
              {loading ? "Sjekker …" : "Bekreft"}
            </Handling>
            <Handling
              type="button"
              vekt="naken"
              onClick={() => {
                setEnrolling(null);
                setCode("");
              }}
            >
              Avbryt
            </Handling>
          </div>
        </div>
      )}

      <Kvittering feil={error ?? undefined} />
    </div>
  );
}
