"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";

import {
  signUpWithPassword,
  type SignupState,
} from "@/app/login/actions";
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

const initial: SignupState = {};

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signUpWithPassword, initial);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <Image src={IMG.hero} alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/85 via-navy/75 to-navy/90" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold tracking-tight text-white">
            Verta
          </Link>
          <p className="mt-2 text-sm text-gold-light">Opprett konto</p>
        </div>

        <Card className="border-white/10 bg-white/95 shadow-2xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-navy">Registrer deg</CardTitle>
            <CardDescription>Velg e-post og passord.</CardDescription>
          </CardHeader>
          <CardContent>
            {state.confirm ? (
              <p className="text-sm">
                Nesten i mål! Vi har sendt en bekreftelseslenke til{" "}
                <strong>{state.email}</strong>. Klikk på den for å fullføre
                registreringen.
              </p>
            ) : (
              <form action={action} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">E-post</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    defaultValue={state.email ?? ""}
                    placeholder="navn@eksempel.no"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Passord (minst 8 tegn)</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirm">Gjenta passord</Label>
                  <Input
                    id="confirm"
                    name="confirm"
                    type="password"
                    required
                    autoComplete="new-password"
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
                  {pending ? "Oppretter…" : "Opprett konto"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Har du allerede konto?{" "}
                  <Link href="/login" className="font-medium text-navy underline">
                    Logg inn
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
