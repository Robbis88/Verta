"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";

import { signInWithPassword, type LoginState } from "./actions";
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
  const [state, action, pending] = useActionState(signInWithPassword, initial);

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
            <CardDescription>Logg inn med e-post og passord.</CardDescription>
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

            <form action={action} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="navn@eksempel.no"
                  defaultValue={state.email ?? ""}
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
              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={pending}
                className="bg-gold font-semibold text-navy hover:bg-gold/90"
              >
                {pending ? "Logger inn…" : "Logg inn"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Ny bruker?{" "}
              <Link href="/registrer" className="font-medium text-navy underline">
                Registrer deg
              </Link>
            </p>
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
