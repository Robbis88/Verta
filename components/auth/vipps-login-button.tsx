"use client";

import type { Provider } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function VippsLoginButton() {
  async function login() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      // Konfigureres som custom OIDC-provider i Supabase (se SETUP.md).
      provider: "custom:vipps" as unknown as Provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <Button
      type="button"
      onClick={login}
      className="bg-[#ff5b24] text-white hover:bg-[#ff5b24]/90"
    >
      Logg inn med Vipps
    </Button>
  );
}
