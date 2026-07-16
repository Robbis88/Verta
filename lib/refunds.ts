import { stripe } from "@/lib/stripe";

/**
 * Trygg refusjon av en DESTINATION CHARGE (vaskeoppdrag, utstyrsutleie).
 *
 * Ved destination charges ligger pengene på mottakerens konto (vasker/eier) mens
 * Verta beholdt et formidlingsgebyr. Refunderer man uten `reverse_transfer`,
 * betaler Verta hele beløpet ut av egen lomme mens mottakeren beholder sitt.
 * Denne helperen setter derfor ALLTID:
 *  - reverse_transfer: true      → henter beløpet tilbake fra mottakerens konto
 *  - refund_application_fee: true → returnerer Vertas gebyr proporsjonalt
 * slik at alle parter går i null og Verta aldri taper penger på en refusjon.
 *
 * @param paymentIntentId  Payment intent fra betalingen.
 * @param amount           Valgfritt delbeløp i kroner (utelatt = full refusjon).
 */
export async function refundDestinationCharge(
  paymentIntentId: string,
  amount?: number,
): Promise<{ ok: boolean; error?: string }> {
  if (!stripe) return { ok: false, error: "Stripe er ikke konfigurert" };
  if (!paymentIntentId) return { ok: false, error: "Mangler betalings-id" };
  try {
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reverse_transfer: true,
      refund_application_fee: true,
      ...(amount && amount > 0 ? { amount: Math.round(amount * 100) } : {}),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "ukjent feil",
    };
  }
}
