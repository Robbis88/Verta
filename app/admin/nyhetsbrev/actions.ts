"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewsletterEmail } from "@/lib/email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verta.no";

/** Sender en testkopi kun til admin selv (for å sjekke før ekte utsending). */
export async function sendNewsletterTest(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject || !body || !user?.email) {
    redirect("/admin/nyhetsbrev");
  }

  await sendNewsletterEmail({
    to: user!.email!,
    subject: `[TEST] ${subject}`,
    bodyText: body,
    unsubscribeUrl: `${SITE_URL}/avmelding/test`,
  });
  redirect("/admin/nyhetsbrev?test=1");
}

/**
 * Sender nyhetsbrevet til alle aktive abonnenter (med samtykke). Krever
 * bekreftelse i skjemaet. Sender i batcher for å være snill mot rate-limits,
 * og logger kampanjen.
 */
export async function sendNewsletter(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const confirmed = formData.get("confirm") === "on";
  if (!subject || !body || !confirmed) {
    redirect("/admin/nyhetsbrev?feil=1");
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("email,unsubscribe_token")
    .is("unsubscribed_at", null);
  const subs = (data ?? []) as { email: string; unsubscribe_token: string }[];

  let sent = 0;
  const batchSize = 20;
  for (let i = 0; i < subs.length; i += batchSize) {
    const batch = subs.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((s) =>
        sendNewsletterEmail({
          to: s.email,
          subject,
          bodyText: body,
          unsubscribeUrl: `${SITE_URL}/avmelding/${s.unsubscribe_token}`,
        }),
      ),
    );
    sent += results.filter((r) => r.status === "fulfilled" && r.value).length;
  }

  await supabase.from("newsletter_campaigns").insert({
    subject,
    body,
    recipient_count: subs.length,
    sent_count: sent,
    created_by: user?.email ?? null,
  });

  revalidatePath("/admin/nyhetsbrev");
  redirect(`/admin/nyhetsbrev?sendt=${sent}`);
}
