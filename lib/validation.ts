import { z } from "zod";

/** Delte zod-skjemaer for input-validering i server actions. */

export const propertySchema = z.object({
  name: z.string().min(2, "Navn må ha minst 2 tegn").max(100),
  address: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  bedrooms: z.coerce.number().int().min(0).max(50).optional(),
  bathrooms: z.coerce.number().int().min(0).max(50).optional(),
  max_guests: z.coerce.number().int().min(1, "Minst 1 gjest").max(100).optional(),
});
export type PropertyInput = z.infer<typeof propertySchema>;

export const bookingSchema = z
  .object({
    guest_name: z.string().min(2, "Oppgi navn").max(100),
    guest_email: z.string().email("Ugyldig e-post").optional().or(z.literal("")),
    guest_phone: z.string().max(30).optional().or(z.literal("")),
    check_in: z.string().min(1, "Velg innsjekk"),
    check_out: z.string().min(1, "Velg utsjekk"),
  })
  .refine((d) => d.check_out > d.check_in, {
    message: "Utsjekk må være etter innsjekk",
    path: ["check_out"],
  });
export type BookingInput = z.infer<typeof bookingSchema>;
