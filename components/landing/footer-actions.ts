"use server";

import { subscribeNewsletter } from "@/lib/newsletter";

/** Nyhetsbrev-påmelding fra footeren. Krever gyldig e-post. */
export async function subscribeFooter(
  _prev: { ok: boolean } | null,
  formData: FormData,
): Promise<{ ok: boolean }> {
  const email = String(formData.get("email") ?? "").trim();
  const ok = email
    ? await subscribeNewsletter({ email, source: "footer" })
    : false;
  return { ok };
}
