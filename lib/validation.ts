import { z } from "zod";

/** Delte zod-skjemaer for input-validering i server actions. */

export const propertySchema = z.object({
  name: z.string().min(2, "Navn må ha minst 2 tegn").max(100),
  address: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  bedrooms: z.coerce.number().int().min(0).max(50).optional(),
  bathrooms: z.coerce.number().int().min(0).max(50).optional(),
  max_guests: z.coerce.number().int().min(1, "Minst 1 gjest").max(100).optional(),
  base_nightly_rate: z.coerce.number().min(0).max(1_000_000).optional(),
  cleaning_fee: z.coerce.number().min(0).max(1_000_000).optional(),
  access_info: z.string().max(1000).optional().or(z.literal("")),
  wifi_name: z.string().max(100).optional().or(z.literal("")),
  wifi_password: z.string().max(100).optional().or(z.literal("")),
  house_rules: z.string().max(2000).optional().or(z.literal("")),
  checkout_info: z.string().max(2000).optional().or(z.literal("")),
  booking_mode: z.enum(["instant", "request"]).optional(),
  beds: z.coerce.number().int().min(0).max(100).optional(),
  sleeping_arrangements: z.string().max(1000).optional().or(z.literal("")),
  check_in_time: z.string().max(20).optional().or(z.literal("")),
  check_out_time: z.string().max(20).optional().or(z.literal("")),
});
export type PropertyInput = z.infer<typeof propertySchema>;

export const bookingSchema = z
  .object({
    guest_name: z.string().min(2, "Oppgi navn").max(100),
    guest_email: z.string().email("Ugyldig e-post").optional().or(z.literal("")),
    guest_phone: z.string().max(30).optional().or(z.literal("")),
    check_in: z.string().min(1, "Velg innsjekk"),
    check_out: z.string().min(1, "Velg utsjekk"),
    num_guests: z.coerce.number().int().min(1).max(100).optional(),
    guest_message: z.string().max(1000).optional().or(z.literal("")),
  })
  .refine((d) => d.check_out > d.check_in, {
    message: "Utsjekk må være etter innsjekk",
    path: ["check_out"],
  });
export type BookingInput = z.infer<typeof bookingSchema>;

export const seasonalRateSchema = z
  .object({
    property_id: z.string().uuid("Velg en eiendom"),
    name: z.string().min(1, "Gi sesongen et navn").max(60),
    date_from: z.string().min(1, "Velg fra-dato"),
    date_to: z.string().min(1, "Velg til-dato"),
    nightly_rate: z.coerce.number().min(1, "Pris må være over 0").max(1_000_000),
  })
  .refine((d) => d.date_to >= d.date_from, {
    message: "Til-dato må være lik eller etter fra-dato",
    path: ["date_to"],
  });
export type SeasonalRateInput = z.infer<typeof seasonalRateSchema>;

export const expenseSchema = z.object({
  property_id: z.string().uuid("Velg en eiendom"),
  category: z.enum([
    "cleaning",
    "maintenance",
    "supplies",
    "insurance",
    "fee",
    "utilities",
    "other",
  ]),
  amount: z.coerce.number().min(1, "Beløp må være over 0").max(10_000_000),
  expense_date: z.string().min(1, "Velg dato"),
  description: z.string().max(300).optional().or(z.literal("")),
});
export type ExpenseInput = z.infer<typeof expenseSchema>;

export const boostSchema = z
  .object({
    property_id: z.string().uuid("Velg en eiendom"),
    budget_nok: z.coerce.number().min(100, "Minst 100 kr").max(10000, "Maks 10 000 kr"),
    platform: z.enum(["instagram", "facebook", "both"]),
    start_date: z.string().min(1, "Velg startdato"),
    end_date: z.string().min(1, "Velg sluttdato"),
  })
  .refine((d) => d.end_date > d.start_date, {
    message: "Sluttdato må være etter startdato",
    path: ["end_date"],
  });
export type BoostInput = z.infer<typeof boostSchema>;

export const ownerBookingSchema = z
  .object({
    guest_name: z.string().min(2, "Oppgi navn").max(100),
    guest_email: z.string().email("Ugyldig e-post").optional().or(z.literal("")),
    source: z.enum([
      "airbnb",
      "booking",
      "verta_direct",
      "verta_instagram",
      "verta_facebook",
    ]),
    total_price: z.coerce.number().min(0).max(1_000_000).optional(),
    check_in: z.string().min(1, "Velg innsjekk"),
    check_out: z.string().min(1, "Velg utsjekk"),
  })
  .refine((d) => d.check_out > d.check_in, {
    message: "Utsjekk må være etter innsjekk",
    path: ["check_out"],
  });
export type OwnerBookingInput = z.infer<typeof ownerBookingSchema>;
