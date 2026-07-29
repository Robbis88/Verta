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

function MonthGrid({
  year,
  month,
  booked,
}: {
  year: number;
  month: number;
  booked: Set<string>;
}) {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0=søn
  const leading = (firstDow + 6) % 7; // mandag-først

  const cells: (number | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-hus-gull">
        {MONTH_NAMES[month]} {year}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs tabular-nums">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-hus-svak">
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`b${i}`} />;
          const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
          const isBooked = booked.has(iso);
          return (
            <span
              key={iso}
              className={cn(
                "rounded-md py-1",
                isBooked
                  ? "bg-white/[0.06] text-hus-svak line-through"
                  : "text-hus-dempet",
              )}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Viser tilgjengelighet for et antall måneder fra og med en startdato. */
export function AvailabilityCalendar({
  bookedDates,
  fromISO,
  months = 3,
}: {
  bookedDates: string[];
  fromISO: string;
  months?: number;
}) {
  const booked = new Set(bookedDates);
  const start = new Date(`${fromISO}T00:00:00Z`);
  const startYear = start.getUTCFullYear();
  const startMonth = start.getUTCMonth();

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: months }, (_, i) => {
        const year = startYear + Math.floor((startMonth + i) / 12);
        const month = (startMonth + i) % 12;
        return (
          <MonthGrid key={`${year}-${month}`} year={year} month={month} booked={booked} />
        );
      })}
    </div>
  );
}
