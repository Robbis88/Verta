import { createAdminClient } from "@/lib/supabase/admin";
import { vippsEnabled } from "@/lib/vipps";

/**
 * Vipps ePayment callback for boost-betalinger.
 * Aktiveres når Vipps merchant er konfigurert. Forventer en referanse som
 * peker til en boost, og setter status til 'approved' når betalingen er fullført.
 */
export async function POST(request: Request) {
  if (!vippsEnabled) {
    return Response.json({ ok: true, note: "vipps disabled" });
  }

  const body = (await request.json().catch(() => null)) as {
    reference?: string;
    name?: string;
  } | null;

  // TODO: verifiser Vipps-signatur før vi stoler på callbacken.
  const reference = body?.reference;
  const completed = body?.name === "AUTHORIZED" || body?.name === "CAPTURED";

  if (reference && completed) {
    const boostId = reference.replace(/^boost_/, "");
    const supabase = createAdminClient();
    await supabase
      .from("boosts")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", boostId);
  }

  return Response.json({ ok: true });
}
