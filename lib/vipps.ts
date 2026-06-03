/**
 * Vipps ePayment. Aktiveres kun når merchant-credentials finnes.
 * Til da kjører boost-betaling i dev-fallback (se app/dashboard/boosts/actions.ts).
 *
 * NB: Spec §4.2 bruker det utdaterte ecomm/v2-API-et — vi bruker ePayment.
 * Se IMPLEMENTATION_NOTES.md.
 */
export const vippsEnabled = Boolean(
  process.env.VIPPS_CLIENT_ID && process.env.VIPPS_SUBSCRIPTION_KEY,
);

/**
 * Oppretter en Vipps ePayment-betaling og returnerer redirect-URL.
 * Foreløpig en stub — ferdigstilles når Vipps merchant er på plass.
 */
export type VippsPaymentInput = {
  amountNok: number;
  reference: string;
  phone?: string;
  returnUrl: string;
};

export async function createVippsPayment(
  input: VippsPaymentInput,
): Promise<string> {
  void input; // brukes når ePayment-integrasjonen ferdigstilles
  throw new Error("Vipps ePayment er ikke ferdig konfigurert ennå.");
}
