type ICalEvent = {
  uid: string;
  start: string; // YYYY-MM-DD (inklusiv)
  end: string; // YYYY-MM-DD (eksklusiv, = utsjekk)
  summary: string;
};

function toDateValue(iso: string): string {
  return iso.replaceAll("-", "");
}

function escapeText(text: string): string {
  return text.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

/**
 * Bygger en iCalendar-streng (all-day VEVENTs) av bookinger.
 * `dtstamp` er et UTC-tidsstempel på formatet YYYYMMDDTHHMMSSZ.
 */
export function buildICalendar(
  events: ICalEvent[],
  calendarName: string,
  dtstamp: string,
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Verta//Booking//NO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];

  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${toDateValue(e.start)}`,
      `DTEND;VALUE=DATE:${toDateValue(e.end)}`,
      `SUMMARY:${escapeText(e.summary)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
