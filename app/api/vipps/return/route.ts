import { NextResponse } from "next/server";

import { getVippsPaymentState } from "@/lib/vipps";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Returnpunkt etter Vipps ePayment. Sjekker betalingsstatus og aktiverer
 * boosten hvis den er autorisert.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const boostId = searchParams.get("boost");
  if (!boostId) return NextResponse.redirect(`${origin}/dashboard/boosts`);

  let authorized = false;
  try {
    const state = await getVippsPaymentState(`boost-${boostId}`);
    authorized = state === "AUTHORIZED";
  } catch {
    authorized = false;
  }

  if (authorized) {
    const supabase = createAdminClient();
    await supabase
      .from("boosts")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", boostId);
    return NextResponse.redirect(
      `${origin}/dashboard/boosts/${boostId}?paid=1`,
    );
  }

  return NextResponse.redirect(
    `${origin}/dashboard/boosts/${boostId}?payment_failed=1`,
  );
}
