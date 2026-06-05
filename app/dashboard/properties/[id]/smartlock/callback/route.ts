import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { getConnectedLock } from "@/lib/seam";

/**
 * Eieren havner her etter å ha fullført Seam Connect Webview. Vi finner den
 * ventende smart_locks-raden, henter den tilkoblede låsen og lagrer den.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id: propertyId } = await params;
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const back = `${site}/dashboard/properties/${propertyId}`;

  const supabase = await createClient();
  const { data: pending } = await supabase
    .from("smart_locks")
    .select("id,connect_webview_id")
    .eq("property_id", propertyId)
    .eq("status", "pending")
    .maybeSingle();

  if (!pending?.connect_webview_id) {
    return NextResponse.redirect(`${back}?lock=error`);
  }

  // Seam kan bruke et lite øyeblikk på å opprette enheten etter innlogging.
  let lock: Awaited<ReturnType<typeof getConnectedLock>> = null;
  for (let i = 0; i < 5 && !lock; i++) {
    lock = await getConnectedLock(pending.connect_webview_id);
    if (!lock) await new Promise((r) => setTimeout(r, 1000));
  }

  if (!lock) {
    await supabase
      .from("smart_locks")
      .update({ status: "error" })
      .eq("id", pending.id);
    return NextResponse.redirect(`${back}?lock=error`);
  }

  await supabase
    .from("smart_locks")
    .update({
      provider: lock.provider,
      device_id: lock.deviceId,
      connected_account_id: lock.connectedAccountId,
      status: "connected",
    })
    .eq("id", pending.id);

  await logAudit({
    user_id: user.id,
    action: "smartlock.connected",
    resource_type: "property",
    resource_id: propertyId,
  });

  return NextResponse.redirect(`${back}?lock=connected`);
}
