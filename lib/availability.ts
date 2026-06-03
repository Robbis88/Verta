type DateRange = { check_in: string; check_out: string; status?: string };

/**
 * Returnerer settet av opptatte datoer (YYYY-MM-DD) fra bookinger.
 * Utsjekksdagen regnes som ledig (booking dekker check_in .. check_out-1).
 */
export function bookedDateSet(bookings: DateRange[]): Set<string> {
  const booked = new Set<string>();
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    const start = new Date(`${b.check_in}T00:00:00Z`);
    const end = new Date(`${b.check_out}T00:00:00Z`);
    for (let d = start; d < end; d.setUTCDate(d.getUTCDate() + 1)) {
      booked.add(d.toISOString().slice(0, 10));
    }
  }
  return booked;
}
