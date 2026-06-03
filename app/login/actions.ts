"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; sent?: boolean; email?: string };

/**
 * Dev-innlogging: sender en magic-link på e-post (Supabase OTP, PKCE-flyt).
 * Byttes ut med Vipps OIDC (`signInWithOAuth({ provider: 'custom:vipps' })`)
 * når merchant er klart — se IMPLEMENTATION_NOTES.md.
 */
export async function signInWithEmail(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Skriv inn e-postadressen din" };

  const supabase = await createClient();
  const origin =
    (await headers()).get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: error.message, email };
  return { sent: true, email };
}
