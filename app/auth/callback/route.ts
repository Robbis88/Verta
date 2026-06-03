import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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
