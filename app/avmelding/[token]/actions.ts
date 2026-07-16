"use server";

import { redirect } from "next/navigation";

import { unsubscribeByToken } from "@/lib/newsletter";

/** Melder av nyhetsbrevet via token. POST (ikke GET) unngår prefetch-avmelding. */
export async function unsubscribe(token: string): Promise<void> {
  await unsubscribeByToken(token);
  redirect(`/avmelding/${token}?avmeldt=1`);
}
