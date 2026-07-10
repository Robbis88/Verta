import { createAdminClient } from "@/lib/supabase/admin";
import { serviceFeeOf } from "@/lib/constants";

/**
 * Beregner booking-totaler fra eiendommens lagrede priser.
 * Hver natt prises til en evt. sesongpris som dekker datoen, ellers baseprisen.
 * Rengjøringsgebyret legges til én gang. Uten basepris (og uten dekkende
 * sesongpris) returneres null — da lar vi total_price stå tomt som før.
 */

export type SeasonRate = {
  date_from: string; // ISO yyyy-mm-dd
  date_to: string; // ISO yyyy-mm-dd, inklusiv
  nightly_rate: number;
};

export type PriceConfig = {
  baseNightlyRate: number | null;
  cleaningFee: number | null;
  seasons: SeasonRate[];
};

export type Quote = {
  nights: number;
  nightlyTotal: number;
  cleaningFee: number;
  /** Vertas tjenestegebyr (7,5 % av total) — gjesten betaler dette på toppen. */
  serviceFee: number;
  /** Utleierens inntekt: netter + rengjøring (uendret betydning). */
  total: number;
  /** Det gjesten faktisk betaler: total + serviceFee. */
  guestTotal: number;
};

/** Listen av netter (ISO-datoer) en gjest betaler for: innsjekk t.o.m. natten før utsjekk. */
function nightDates(checkIn: string, checkOut: string): string[] {
  const out: string[] = [];
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** Pris for én natt: sesongpris som dekker datoen (sist startende vinner), ellers basepris. */
function rateForNight(dateISO: string, config: PriceConfig): number | null {
  const covering = config.seasons
    .filter((s) => dateISO >= s.date_from && dateISO <= s.date_to)
    .sort((a, b) => a.date_from.localeCompare(b.date_from));
  const season = covering[covering.length - 1];
  if (season) return Number(season.nightly_rate);
  return config.baseNightlyRate != null ? Number(config.baseNightlyRate) : null;
}

/**
 * Beregner et pristilbud fra en pris-konfig. Returnerer null hvis ingen natt
 * kan prises (verken sesong- eller basepris satt).
 */
export function quoteFromConfig(
  checkIn: string,
  checkOut: string,
  config: PriceConfig,
): Quote | null {
  const nights = nightDates(checkIn, checkOut);
  if (nights.length === 0) return null;

  let nightlyTotal = 0;
  for (const night of nights) {
    const rate = rateForNight(night, config);
    if (rate == null) return null; // mangler pris for minst én natt
    nightlyTotal += rate;
  }

  const cleaningFee = config.cleaningFee != null ? Number(config.cleaningFee) : 0;
  const total = Math.round((nightlyTotal + cleaningFee) * 100) / 100;
  const serviceFee = serviceFeeOf(total);
  const guestTotal = Math.round((total + serviceFee) * 100) / 100;
  return {
    nights: nights.length,
    nightlyTotal,
    cleaningFee,
    serviceFee,
    total,
    guestTotal,
  };
}

/** Henter en eiendoms pris-konfig (basepris, gebyr, sesonger) via admin-klienten. */
export async function getPriceConfig(propertyId: string): Promise<PriceConfig> {
  const supabase = createAdminClient();
  const [{ data: property }, { data: seasons }] = await Promise.all([
    supabase
      .from("properties")
      .select("base_nightly_rate,cleaning_fee")
      .eq("id", propertyId)
      .single(),
    supabase
      .from("seasonal_rates")
      .select("date_from,date_to,nightly_rate")
      .eq("property_id", propertyId),
  ]);

  return {
    baseNightlyRate: property?.base_nightly_rate ?? null,
    cleaningFee: property?.cleaning_fee ?? null,
    seasons: (seasons ?? []) as SeasonRate[],
  };
}

/** Beregner et fullt pristilbud for en eiendom og et datointervall. */
export async function quoteBookingTotal(
  propertyId: string,
  checkIn: string,
  checkOut: string,
): Promise<Quote | null> {
  const config = await getPriceConfig(propertyId);
  return quoteFromConfig(checkIn, checkOut, config);
}

/** Som over, men returnerer kun totalbeløpet (eller null) — for lagring på booking. */
export async function calculateBookingTotal(
  propertyId: string,
  checkIn: string,
  checkOut: string,
): Promise<number | null> {
  const quote = await quoteBookingTotal(propertyId, checkIn, checkOut);
  return quote?.total ?? null;
}
