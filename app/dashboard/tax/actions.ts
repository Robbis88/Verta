"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { computeTaxReport } from "@/lib/tax";
import { logAudit } from "@/lib/audit";

export async function generateTaxReport(formData: FormData): Promise<void> {
  const user = await requireUser();
  const year =
    Number(formData.get("year")) || new Date().getUTCFullYear();

  await computeTaxReport(year);
  await logAudit({
    user_id: user.id,
    action: "tax.generated",
    resource_type: "tax_report",
    changes: { year },
  });
  revalidatePath("/dashboard/tax");
}
