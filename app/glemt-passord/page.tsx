"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";

import {
  requestPasswordReset,
  type ResetState,
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

const initial: ResetState = {};

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <Image src={IMG.hero} alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/85 via-navy/75 to-navy/90" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold tracking-tight text-white">
            Verta
          </Link>
        </div>

        <Card className="border-white/10 bg-white/95 shadow-2xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-navy">Glemt passord</CardTitle>
            <CardDescription>
              Vi sender deg en lenke for å lage nytt passord.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.sent ? (
              <p className="text-sm">
                Hvis det finnes en konto med den e-posten, har vi sendt en
                lenke for å nullstille passordet.
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
                    placeholder="navn@eksempel.no"
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
                  {pending ? "Sender…" : "Send nullstillingslenke"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <Link href="/login" className="font-medium text-navy underline">
                    Tilbake til innlogging
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
