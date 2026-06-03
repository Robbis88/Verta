import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase-klient for bruk på serveren (Server Components, Route Handlers,
 * Server Actions). I Next.js 16 er `cookies()` asynkron.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Kalt fra en Server Component der cookies ikke kan settes.
            // Session-oppdatering håndteres i proxy.ts, så dette er trygt å ignorere.
          }
        },
      },
    },
  );
}
