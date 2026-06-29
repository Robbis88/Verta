"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

type DbClient = Awaited<ReturnType<typeof createClient>>;

export async function addContractor(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("contractors").insert({
    user_id: user.id,
    name,
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    trade: String(formData.get("trade") ?? "").trim() || null,
  });
  revalidatePath("/dashboard/vedlikehold");
}

export async function deleteContractor(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("contractors").delete().eq("id", id);
  revalidatePath("/dashboard/vedlikehold");
}

export async function createRequest(formData: FormData): Promise<void> {
  const user = await requireUser();
  const propertyId = String(formData.get("property_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!propertyId || !title) return;

  const supabase = await createClient();
  await supabase.from("maintenance_requests").insert({
    property_id: propertyId,
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    priority: String(formData.get("priority") ?? "normal"),
    status: "open",
  });
  await logAudit({
    user_id: user.id,
    action: "maintenance.created",
    resource_type: "property",
    resource_id: propertyId,
  });
  revalidatePath("/dashboard/vedlikehold");
}

/**
 * Holder utgiftsposten i synk med saken: løst + kostnad → opprett/oppdater
 * en 'maintenance'-utgift; ellers fjern den. Mates inn i skatterapporten.
 */
async function syncFinance(
  supabase: DbClient,
  req: {
    id: string;
    property_id: string;
    title: string;
    status: string;
    cost: number | null;
    expense_id: string | null;
  },
) {
  const shouldHaveExpense = req.status === "resolved" && (req.cost ?? 0) > 0;

  if (shouldHaveExpense) {
    if (req.expense_id) {
      await supabase
        .from("expenses")
        .update({ amount: req.cost })
        .eq("id", req.expense_id);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const { data: expense } = await supabase
        .from("expenses")
        .insert({
          property_id: req.property_id,
          category: "maintenance",
          amount: req.cost,
          expense_date: today,
          description: `Vedlikehold: ${req.title}`,
        })
        .select("id")
        .single();
      await supabase
        .from("maintenance_requests")
        .update({ expense_id: expense?.id ?? null })
        .eq("id", req.id);
    }
  } else if (req.expense_id) {
    await supabase.from("expenses").delete().eq("id", req.expense_id);
    await supabase
      .from("maintenance_requests")
      .update({ expense_id: null })
      .eq("id", req.id);
  }
}

export async function updateRequest(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const status = String(formData.get("status") ?? "open");
  const priority = String(formData.get("priority") ?? "normal");
  const contractorId = String(formData.get("contractor_id") ?? "").trim();
  const costRaw = String(formData.get("cost") ?? "").trim();
  const cost = costRaw ? Number(costRaw) : null;

  const supabase = await createClient();
  await supabase
    .from("maintenance_requests")
    .update({
      status,
      priority,
      contractor_id: contractorId || null,
      cost,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  const { data: req } = await supabase
    .from("maintenance_requests")
    .select("id,property_id,title,status,cost,expense_id")
    .eq("id", id)
    .single();
  if (req) await syncFinance(supabase, req);

  revalidatePath("/dashboard/vedlikehold");
}

export async function deleteRequest(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();

  const { data: req } = await supabase
    .from("maintenance_requests")
    .select("expense_id")
    .eq("id", id)
    .maybeSingle();
  if (req?.expense_id) {
    await supabase.from("expenses").delete().eq("id", req.expense_id);
  }
  await supabase.from("maintenance_requests").delete().eq("id", id);
  revalidatePath("/dashboard/vedlikehold");
}
