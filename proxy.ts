import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Proxy (tidligere "middleware" i Next.js < 16).
 * Oppdaterer Supabase-sesjonen før hver matchende request.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match alle stier unntatt:
     * - _next/static (statiske filer)
     * - _next/image (bildeoptimalisering)
     * - favicon.ico og vanlige bildefiler
     * Legg til andre offentlige stier ved behov.
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
