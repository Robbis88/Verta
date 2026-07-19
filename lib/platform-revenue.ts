import "server-only";

import { stripe } from "@/lib/stripe";

/**
 * Vertas plattforminntekt = summen av 10 %-formidlingsgebyrene (leie, vask,
 * tillegg) trukket via Stripe `application_fee`. Vi leser rett fra Stripe
 * (Application Fees) fordi det er den faktiske pengestrømmen — netto etter
 * refusjon — uten fare for drift mot vår egen database.
 */

export type RevenueCategory = "leie" | "vask" | "tillegg" | "annet";

export type PlatformRevenue = {
  /** false når Stripe ikke er konfigurert (dev). */
  configured: boolean;
  year: number;
  /** Netto inntekt hele året (kr). */
  totalNok: number;
  /** Netto per måned (12 tall, kr). */
  monthNok: number[];
  /** Antall gebyr-genererende transaksjoner. */
  count: number;
  /** Netto fordelt på type. */
  byCategory: Record<RevenueCategory, number>;
};

function categorize(kind: string | undefined): RevenueCategory {
  if (kind === "rental") return "leie";
  if (kind === "service") return "vask";
  if (kind === "stay_extra") return "tillegg";
  return "annet";
}

export async function getPlatformRevenue(year: number): Promise<PlatformRevenue> {
  const base: PlatformRevenue = {
    configured: false,
    year,
    totalNok: 0,
    monthNok: Array(12).fill(0),
    count: 0,
    byCategory: { leie: 0, vask: 0, tillegg: 0, annet: 0 },
  };
  if (!stripe) return base;
  base.configured = true;

  const gte = Math.floor(Date.UTC(year, 0, 1) / 1000);
  const lt = Math.floor(Date.UTC(year + 1, 0, 1) / 1000);

  // Auto-paginert. Vi utvider charge→payment_intent for å lese vår metadata.kind
  // og fordele på type. Netto = beløp minus evt. refundert andel.
  for await (const fee of stripe.applicationFees.list({
    created: { gte, lt },
    limit: 100,
    expand: ["data.charge.payment_intent"],
  })) {
    const net = (fee.amount - fee.amount_refunded) / 100;
    if (net === 0) continue;
    base.totalNok += net;
    base.count += 1;
    base.monthNok[new Date(fee.created * 1000).getUTCMonth()] += net;

    const charge = typeof fee.charge === "string" ? null : fee.charge;
    const pi =
      charge && charge.payment_intent && typeof charge.payment_intent !== "string"
        ? charge.payment_intent
        : null;
    const kind =
      pi?.metadata?.kind ??
      (charge?.metadata?.kind as string | undefined) ??
      undefined;
    base.byCategory[categorize(kind)] += net;
  }

  const round = (n: number) => Math.round(n * 100) / 100;
  base.totalNok = round(base.totalNok);
  base.monthNok = base.monthNok.map(round);
  for (const k of Object.keys(base.byCategory) as RevenueCategory[]) {
    base.byCategory[k] = round(base.byCategory[k]);
  }
  return base;
}
