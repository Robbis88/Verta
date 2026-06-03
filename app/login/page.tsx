"use client";

import { useActionState } from "react";

import { signInWithEmail, type LoginState } from "./actions";
import { VippsLoginButton } from "@/components/auth/vipps-login-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const vippsEnabled = process.env.NEXT_PUBLIC_VIPPS_ENABLED === "true";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(signInWithEmail, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Logg inn i Verta</CardTitle>
          <CardDescription>
            Vi sender deg en innloggingslenke på e-post.
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
          {state.sent ? (
            <p className="text-sm">
              Sjekk innboksen din — vi har sendt en innloggingslenke til{" "}
              <strong>{state.email}</strong>.
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
              <Button type="submit" size="lg" disabled={pending}>
                {pending ? "Sender…" : "Send innloggingslenke"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Innlogging med Vipps kommer snart.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
