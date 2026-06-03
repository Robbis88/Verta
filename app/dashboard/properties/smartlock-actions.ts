"use server";

import { revalidatePath } from "next/cache";

import { requireUser, getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { nukiEnabled, generateAccessCode } from "@/lib/nuki";

/** Kobler til smartlås. Premium-only. Dev-stub uten Nuki-credentials. */
export async function connectSmartLock(formData: FormData): Promise<void> {
  const user = await requireUser();
  const propertyId = String(formData.get("property_id") ?? "");
  if (!propertyId) return;

  const profile = await getCurrentProfile();
  if (profile?.plan !== "premium") return; // Premium-funksjon

  if (nukiEnabled) {
    // TODO: start Nuki-OAuth og lagre krypterte tokens.
    throw new Error("Nuki-OAuth er ikke ferdig konfigurert ennå.");
  }

  const supabase = await createClient();
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
