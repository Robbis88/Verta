"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { expenseSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export type ExpenseState = {
  error?: string;
  ok?: boolean;
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

export async function createExpense(
  _prev: ExpenseState,
  formData: FormData,
): Promise<ExpenseState> {
  const user = await requireUser();

  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Sjekk feltene under", fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  // RLS (owns_property) sikrer at eiendommen tilhører brukeren.
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    property_id: data.property_id,
    category: data.category,
    amount: data.amount,
    expense_date: data.expense_date,
    description: data.description || null,
  });
  if (error) return { error: error.message };

  await logAudit({
    user_id: user.id,
    action: "expense.created",
    resource_type: "property",
    resource_id: data.property_id,
    changes: { category: data.category, amount: data.amount },
  });

  revalidatePath("/dashboard/utgifter");
  return { ok: true };
}

export async function deleteExpense(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/dashboard/utgifter");
}
