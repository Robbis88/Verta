"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; sent?: boolean; email?: string };
export type SignupState = { error?: string; confirm?: boolean; email?: string };
export type ResetState = { error?: string; sent?: boolean };

async function siteOrigin(): Promise<string> {
  return (
    (await headers()).get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

/** Innlogging med e-post + passord. */
export async function signInWithPassword(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Fyll inn e-post og passord", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Feil e-post eller passord", email };

  redirect("/dashboard");
}

/** Registrering med e-post + passord. */
export async function signUpWithPassword(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!email) return { error: "Skriv inn e-postadressen din" };
  if (password.length < 8) return { error: "Passord må ha minst 8 tegn", email };
  if (password !== confirm) return { error: "Passordene er ikke like", email };

  const supabase = await createClient();
  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: error.message, email };

  // Supabase skjuler at en konto allerede finnes (enumeration-beskyttelse):
  // ingen error, men data.user.identities er tom. Vis en myk, hjelpsom melding
  // i stedet for en falsk "vi har sendt bekreftelseslenke".
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return {
      error:
        "Denne e-posten er kanskje allerede registrert. Prøv å logge inn, eller bruk «Glemt passord».",
      email,
    };
  }

  // Hvis e-postbekreftelse er av, får vi en sesjon med en gang.
  if (data.session) redirect("/onboarding");
  return { confirm: true, email };
}

/** Sender lenke for å nullstille passord (avslører ikke om kontoen finnes). */
export async function requestPasswordReset(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Skriv inn e-postadressen din" };

  const supabase = await createClient();
  const origin = await siteOrigin();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-passord`,
  });
  return { sent: true };
}

/** Dev-innlogging: magic-link på e-post (beholdt som alternativ til passord). */
export async function signInWithEmail(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Skriv inn e-postadressen din" };

  const supabase = await createClient();
  const origin = await siteOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: error.message, email };
  return { sent: true, email };
}
