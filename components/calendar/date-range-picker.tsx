"use client";

import { cn } from "@/lib/utils";

const WEEKDAYS = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];
const MONTH_NAMES = [
  "Januar",
  "Februar",
  "Mars",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Finnes en opptatt natt i [a, b)? (b = utsjekk, teller ikke som natt.) */
function rangeHasBooked(a: string, b: string, booked: Set<string>): boolean {
  const end = new Date(`${b}T00:00:00Z`);
  for (
    let d = new Date(`${a}T00:00:00Z`);
    d < end;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    if (booked.has(d.toISOString().slice(0, 10))) return true;
  }
  return false;
}

/**
 * Klikkbar dato-velger: klikk innsjekk, så utsjekk. Opptatte og passerte datoer
 * er deaktivert, og et intervall som krysser en opptatt natt tillates ikke.
 */
export function DateRangePicker({
  bookedDates,
  fromISO,
  months = 3,
  checkIn,
  checkOut,
  onSelect,
}: {
  bookedDates: string[];
  fromISO: string;
  months?: number;
  checkIn: string;
  checkOut: string;
  onSelect: (checkIn: string, checkOut: string) => void;
}) {
  const booked = new Set(bookedDates);
  const start = new Date(`${fromISO}T00:00:00Z`);
  const startYear = start.getUTCFullYear();
  const startMonth = start.getUTCMonth();

  function handleClick(iso: string) {
    // Ny start hvis ingen innsjekk, eller begge alt er valgt.
    if (!checkIn || (checkIn && checkOut)) {
      onSelect(iso, "");
      return;
    }
    // Innsjekk satt, mangler utsjekk.
    if (iso <= checkIn || rangeHasBooked(checkIn, iso, booked)) {
      onSelect(iso, "");
      return;
    }
    onSelect(checkIn, iso);
  }

  return (
    // Container-query: to måneder side ved side kun når SELVE boksen er bred
    // nok (ikke basert på skjermbredden) — ellers stables de. Viktig i den
    // smale booking-kolonnen på desktop.
    <div className="@container">
    <div className="grid gap-6 @md:grid-cols-2">
      {Array.from({ length: months }, (_, i) => {
        const year = startYear + Math.floor((startMonth + i) / 12);
        const month = (startMonth + i) % 12;
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
        const leading = (firstDow + 6) % 7; // mandag først

        const cells: (number | null)[] = [];
        for (let l = 0; l < leading; l++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);

        return (
          <div key={`${year}-${month}`} className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              {MONTH_NAMES[month]} {year}
            </p>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {WEEKDAYS.map((w) => (
                <span key={w} className="text-muted-foreground">
                  {w}
                </span>
              ))}
              {cells.map((day, idx) => {
                if (day === null) return <span key={`b${idx}`} />;
                const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
                const isBooked = booked.has(iso);
                const isPast = iso < fromISO;
                const disabled = isBooked || isPast;
                const isCheckIn = iso === checkIn;
                const isCheckOut = iso === checkOut;
                const inRange =
                  !!checkIn && !!checkOut && iso > checkIn && iso < checkOut;

                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleClick(iso)}
                    className={cn(
                      "rounded py-1 transition",
                      disabled &&
                        "cursor-not-allowed text-muted-foreground line-through",
                      !disabled && "hover:bg-gold/20",
                      (isCheckIn || isCheckOut) &&
                        "bg-navy font-semibold text-white hover:bg-navy",
                      inRange && "bg-gold/25",
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}
