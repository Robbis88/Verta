import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * Sender velkomst-e-post én gang per bruker. Bruker admin-klienten for å
 * lese/sette `welcomed_at` idempotent. Feiler aldri innloggingen.
 */
async function sendWelcomeOnce(userId: string, email: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("users")
      .select("welcomed_at,name")
      .eq("id", userId)
      .single();
    if (data && !data.welcomed_at) {
      await sendWelcomeEmail({ to: email, name: data.name });
      await admin
        .from("users")
        .update({ welcomed_at: new Date().toISOString() })
        .eq("id", userId);
    }
  } catch (err) {
    console.error("Velkomst-e-post feilet:", err);
  }
}

/**
 * Tar imot magic-link / OAuth-redirect, veksler koden inn i en sesjon (PKCE)
 * og sender brukeren videre til dashbordet.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) await sendWelcomeOnce(user.id, user.email);

      if (next) return NextResponse.redirect(`${origin}${next}`);

      // Nye brukere uten eiendom sendes til onboarding.
      const { count } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true });
      const destination = count ? "/dashboard" : "/onboarding";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
