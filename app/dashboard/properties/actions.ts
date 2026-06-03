"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser, getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { propertyLimit } from "@/lib/constants";
import { propertySchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export type PropertyFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createProperty(
  _prev: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const user = await requireUser();

  const parsed = propertySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Sjekk feltene under", fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  // Feature-gating Layer 2 (RLS er Layer 1).
  const { count } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true });
  const limit = propertyLimit(
    profile?.plan ?? "gratis",
    profile?.extra_properties_count ?? 0,
  );
  if ((count ?? 0) >= limit) {
    return {
      error: `Du kan ikke ha mer enn ${limit} eiendom på ${profile?.plan ?? "gratis"}-planen.`,
    };
  }

  const data = parsed.data;
  const slug = `${slugify(data.name)}-${crypto.randomUUID().slice(0, 6)}`;

  const { data: created, error } = await supabase
    .from("properties")
    .insert({
      user_id: user.id,
      name: data.name,
      slug,
      address: data.address || null,
      description: data.description || null,
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      max_guests: data.max_guests ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit({
    user_id: user.id,
    action: "property.created",
    resource_type: "property",
    resource_id: created.id,
  });

  revalidatePath("/dashboard/properties");
  redirect(`/dashboard/properties/${created.id}`);
}

export async function updateProperty(
  _prev: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Mangler eiendoms-id" };

  const parsed = propertySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Sjekk feltene under", fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const data = parsed.data;

  // RLS sikrer at bare eieren kan oppdatere.
  const { error } = await supabase
    .from("properties")
    .update({
      name: data.name,
      address: data.address || null,
      description: data.description || null,
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      max_guests: data.max_guests ?? null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit({
    user_id: user.id,
    action: "property.updated",
    resource_type: "property",
    resource_id: id,
  });

  revalidatePath("/dashboard/properties");
  revalidatePath(`/dashboard/properties/${id}`);
  redirect(`/dashboard/properties/${id}`);
}

export async function deleteProperty(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("properties").delete().eq("id", id);

  if (!error) {
    await logAudit({
      user_id: user.id,
      action: "property.deleted",
      resource_type: "property",
      resource_id: id,
      severity: "warning",
    });
  }

  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}
