"use client";

import { cancelBooking } from "@/app/dashboard/properties/booking-actions";
import { Handling } from "@/components/hus";

export function CancelBookingButton({
  id,
  propertyId,
}: {
  id: string;
  propertyId: string;
}) {
  return (
    <form
      action={cancelBooking}
      onSubmit={(e) => {
        if (!confirm("Avbryte denne bookingen?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="property_id" value={propertyId} />
      <Handling type="submit" vekt="naken">
        Avbryt
      </Handling>
    </form>
  );
}
