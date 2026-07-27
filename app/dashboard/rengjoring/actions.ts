"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { generateTasksForUser } from "@/lib/cleaning";
import { logAudit } from "@/lib/audit";

export async function addCleaner(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const supabase = await createClient();
  await supabase.from("cleaners").insert({
    user_id: user.id,
    name,
    email: email || null,
    phone: phone || null,
  });
  revalidatePath("/dashboard/rengjoring");
}

export async function deleteCleaner(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("cleaners").delete().eq("id", id);
  revalidatePath("/dashboard/rengjoring");
}

export async function createTask(formData: FormData): Promise<void> {
  await requireUser();
  const propertyId = String(formData.get("property_id") ?? "");
  const taskDate = String(formData.get("task_date") ?? "");
  const type = String(formData.get("type") ?? "turnover");
  if (!propertyId || !taskDate) return;

  const supabase = await createClient();
  await supabase.from("cleaning_tasks").insert({
    property_id: propertyId,
    task_date: taskDate,
    type,
    status: "pending",
  });
  revalidatePath("/dashboard/rengjoring");
}

export async function assignTask(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const cleanerId = String(formData.get("cleaner_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("cleaning_tasks")
    .update({
      cleaner_id: cleanerId || null,
      status: cleanerId ? "assigned" : "pending",
    })
    .eq("id", id);
  revalidatePath("/dashboard/rengjoring");
  // Valgfritt `next`: lar Besetningen i Huset tildele uten å miste siden sin.
  // Kun interne stier. Uten feltet oppfører handlingen seg nøyaktig som før.
  const neste = String(formData.get("next") ?? "");
  if (/^\/[^/]/.test(neste)) revalidatePath(neste);
}

export async function deleteTask(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("cleaning_tasks").delete().eq("id", id);
  revalidatePath("/dashboard/rengjoring");
}

export async function generateTasks(): Promise<void> {
  const user = await requireUser();
  const result = await generateTasksForUser();
  await logAudit({
    user_id: user.id,
    action: "cleaning.tasks.generated",
    resource_type: "user",
    resource_id: user.id,
    changes: { created: result.created },
  });
  revalidatePath("/dashboard/rengjoring");
}
