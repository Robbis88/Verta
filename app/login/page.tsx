"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";

import {
  signInWithPassword,
  signInWithEmail,
  type LoginState,
} from "./actions";
import { VippsLoginButton } from "@/components/auth/vipps-login-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IMG } from "@/lib/images";

const vippsEnabled = process.env.NEXT_PUBLIC_VIPPS_ENABLED === "true";

const initial: LoginState = {};

export default function LoginPage() {
  const [pwState, pwAction, pwPending] = useActionState(
    signInWithPassword,
    initial,
  );
  const [mlState, mlAction, mlPending] = useActionState(
    signInWithEmail,
    initial,
  );
  const [email, setEmail] = useState("");
  const [showMagic, setShowMagic] = useState(false);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <Image src={IMG.hero} alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/85 via-navy/75 to-navy/90" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold tracking-tight text-white">
            Verta
          </Link>
          <p className="mt-2 text-sm text-gold-light">
            Full kontroll over dine utleieeiendommer
          </p>
        </div>

        <Card className="border-white/10 bg-white/95 shadow-2xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-navy">Logg inn</CardTitle>
            <CardDescription>
              Logg inn med e-post og passord.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {vippsEnabled && (
              <>
                <VippsLoginButton />
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  eller
                  <span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            {mlState.sent ? (
              <p className="text-sm">
                Sjekk innboksen din — vi har sendt en innloggingslenke til{" "}
                <strong>{mlState.email}</strong>.
              </p>
            ) : (
              <>
                <form action={pwAction} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">E-post</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="navn@eksempel.no"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Passord</Label>
                      <Link
                        href="/glemt-passord"
                        className="text-xs text-muted-foreground hover:text-navy"
                      >
                        Glemt passord?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  {pwState.error && (
                    <p className="text-sm text-destructive">{pwState.error}</p>
                  )}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={pwPending}
                    className="bg-gold font-semibold text-navy hover:bg-gold/90"
                  >
                    {pwPending ? "Logger inn…" : "Logg inn"}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  Ny bruker?{" "}
                  <Link href="/registrer" className="font-medium text-navy underline">
                    Registrer deg
                  </Link>
                </p>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  eller
                  <span className="h-px flex-1 bg-border" />
                </div>

                {showMagic ? (
                  <form action={mlAction} className="flex flex-col gap-2">
                    <input type="hidden" name="email" value={email} />
                    {mlState.error && (
                      <p className="text-sm text-destructive">{mlState.error}</p>
                    )}
                    <Button type="submit" variant="outline" disabled={mlPending}>
                      {mlPending
                        ? "Sender…"
                        : `Send engangslenke til ${email || "e-posten min"}`}
                    </Button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowMagic(true)}
                    className="text-center text-xs text-muted-foreground hover:text-navy"
                  >
                    Foretrekker du engangslenke på e-post?
                  </button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-white/60">
          <Link href="/" className="hover:text-white">
            ← Tilbake til forsiden
          </Link>
        </p>
      </div>
    </main>
  );
}
