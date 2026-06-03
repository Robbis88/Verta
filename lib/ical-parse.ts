export type ParsedEvent = { uid: string; start: string; end: string };

function toISODate(value: string): string {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 8);
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function addDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Minimal iCal-parser: henter VEVENT-er med UID + start/slutt-dato.
 * Håndterer linjefolding og DTSTART/DTEND både som DATE og DATETIME.
 */
export function parseICal(text: string): ParsedEvent[] {
  const unfolded = text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
  const lines = unfolded.split("\n");

  const events: ParsedEvent[] = [];
  let cur: { uid?: string; start?: string; end?: string } | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = {};
    } else if (line === "END:VEVENT") {
      if (cur?.start) {
        let end = cur.end ?? addDay(cur.start);
        if (end <= cur.start) end = addDay(cur.start);
        events.push({
          uid: cur.uid ?? `${cur.start}_${end}`,
          start: cur.start,
          end,
        });
      }
      cur = null;
    } else if (cur) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const name = line.slice(0, idx).split(";")[0].toUpperCase();
      const value = line.slice(idx + 1).trim();
      if (name === "UID") cur.uid = value;
      else if (name === "DTSTART") cur.start = toISODate(value);
      else if (name === "DTEND") cur.end = toISODate(value);
    }
  }

  return events;
}
