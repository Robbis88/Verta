/**
 * Vipps ePayment + access token.
 * Aktiveres når merchant-credentials finnes (ellers dev-fallback i actions).
 * Skrevet mot det offisielle ePayment-API-et, men krever live-test med
 * ekte nøkler. Spec §4.2 brukte utdatert ecomm/v2 — vi bruker ePayment.
 * Se IMPLEMENTATION_NOTES.md / SETUP.md.
 */

const BASE = process.env.VIPPS_API_BASE ?? "https://api.vipps.no";

export const vippsEnabled = Boolean(
  process.env.VIPPS_CLIENT_ID &&
    process.env.VIPPS_CLIENT_SECRET &&
    process.env.VIPPS_SUBSCRIPTION_KEY &&
    process.env.VIPPS_MSN,
);

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${BASE}/accesstoken/get`, {
    method: "POST",
    headers: {
      client_id: process.env.VIPPS_CLIENT_ID!,
      client_secret: process.env.VIPPS_CLIENT_SECRET!,
      "Ocp-Apim-Subscription-Key": process.env.VIPPS_SUBSCRIPTION_KEY!,
      "Merchant-Serial-Number": process.env.VIPPS_MSN!,
    },
  });
  if (!res.ok) {
    throw new Error(`Vipps access token feilet: ${res.status}`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

function headers(token: string, idempotencyKey?: string): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Ocp-Apim-Subscription-Key": process.env.VIPPS_SUBSCRIPTION_KEY!,
    "Merchant-Serial-Number": process.env.VIPPS_MSN!,
    "Vipps-System-Name": "verta",
  };
  if (idempotencyKey) h["Idempotency-Key"] = idempotencyKey;
  return h;
}

/** Oppretter en ePayment og returnerer redirect-URL til Vipps-landingssiden. */
export async function createVippsPayment(input: {
  amountNok: number;
  reference: string;
  returnUrl: string;
  description?: string;
}): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/epayment/v1/payments`, {
    method: "POST",
    headers: headers(token, input.reference),
    body: JSON.stringify({
      amount: { currency: "NOK", value: Math.round(input.amountNok * 100) },
      paymentMethod: { type: "WALLET" },
      reference: input.reference,
      returnUrl: input.returnUrl,
      userFlow: "WEB_REDIRECT",
      paymentDescription: input.description ?? "Verta",
    }),
  });
  if (!res.ok) {
    throw new Error(`Vipps betaling feilet: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { redirectUrl: string };
  return json.redirectUrl;
}

/** Henter betalingsstatus, f.eks. "CREATED" | "AUTHORIZED" | "TERMINATED". */
export async function getVippsPaymentState(reference: string): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/epayment/v1/payments/${reference}`, {
    headers: headers(token),
  });
  if (!res.ok) {
    throw new Error(`Vipps status feilet: ${res.status}`);
  }
  const json = (await res.json()) as { state: string };
  return json.state;
}
