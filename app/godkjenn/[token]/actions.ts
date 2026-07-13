"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { approveRequest, rejectRequest } from "@/lib/booking-requests";

/** Slår opp booking-id fra eier-tokenet (tokenet er tilgangsnøkkelen). */
async function bookingIdForToken(token: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("bookings")
    .select("id")
    .eq("owner_token", token)
    .maybeSingle();
  return data?.id ?? null;
}

/** Godkjenner forespørselen fra e-postlenken (uten innlogging). */
export async function approveByToken(token: string): Promise<void> {
  const id = await bookingIdForToken(token);
  if (!id) redirect(`/godkjenn/${token}?resultat=ukjent`);

  const res = await approveRequest(id);
  if (res.ok) redirect(`/godkjenn/${token}?resultat=godkjent`);
  const resultat =
    res.reason === "no_payouts"
      ? "utbetaling"
      : res.reason === "conflict"
        ? "opptatt"
        : "behandlet";
  redirect(`/godkjenn/${token}?resultat=${resultat}`);
}

/** Avslår forespørselen fra e-postlenken (uten innlogging). */
export async function rejectByToken(token: string): Promise<void> {
  const id = await bookingIdForToken(token);
  if (!id) redirect(`/godkjenn/${token}?resultat=ukjent`);

  await rejectRequest(id);
  redirect(`/godkjenn/${token}?resultat=avslatt`);
}
