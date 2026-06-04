"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser, getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { generateAccessCode } from "@/lib/nuki";
import { seamEnabled, createLockConnectWebview } from "@/lib/seam";

/**
 * Kobler til smartlås. Premium-only.
 * Med Seam-nøkkel: starter Connect Webview-flyten (eier logger inn på sin
 * lås-konto). Uten nøkkel: dev-stub som simulerer en tilkoblet lås.
 */
export async function connectSmartLock(formData: FormData): Promise<void> {
  const user = await requireUser();
  const propertyId = String(formData.get("property_id") ?? "");
  if (!propertyId) return;

  const profile = await getCurrentProfile();
  if (profile?.plan !== "premium") return; // Premium-funksjon

  const supabase = await createClient();

  if (seamEnabled) {
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const redirectUrl = `${site}/dashboard/properties/${propertyId}/smartlock/callback`;
    const { url, connectWebviewId } = await createLockConnectWebview(redirectUrl);

    // Rydd bort evt. tidligere ufullført forsøk, og lagre nytt som 'pending'.
    await supabase
      .from("smart_locks")
      .delete()
      .eq("property_id", propertyId)
      .eq("status", "pending");
    await supabase.from("smart_locks").insert({
      property_id: propertyId,
      provider: "seam",
      device_id: "pending",
      status: "pending",
      connect_webview_id: connectWebviewId,
    });

    await logAudit({
      user_id: user.id,
      action: "smartlock.connect.started",
      resource_type: "property",
      resource_id: propertyId,
    });

    redirect(url); // videre til Seam Connect Webview
  }

  // Dev-stub uten Seam-nøkkel: simulerer en tilkoblet lås.
  await supabase.from("smart_locks").insert({
    property_id: propertyId,
    provider: "nuki",
    device_id: "dev-mock-" + crypto.randomUUID().slice(0, 6),
    access_token_encrypted: "dev",
    status: "connected",
  });

  await logAudit({
    user_id: user.id,
    action: "smartlock.connected.dev",
    resource_type: "property",
    resource_id: propertyId,
  });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function disconnectSmartLock(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("smart_locks").delete().eq("id", id);

  await logAudit({
    user_id: user.id,
    action: "smartlock.disconnected",
    resource_type: "smart_lock",
    resource_id: id,
  });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export type CodeState = { code?: string };

/** Genererer en testkode (dev). Ekte flyt lager kode per booking + SMS. */
export async function generateTestCode(
  _prev: CodeState,
  _formData: FormData,
): Promise<CodeState> {
  void _prev;
  void _formData;
  await requireUser();
  return { code: generateAccessCode() };
}
