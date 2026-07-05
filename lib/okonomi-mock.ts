/**
 * Mockdata for Eiendomsøkonomi-modulen. Deterministisk seedet på eiendoms-id,
 * så tallene er stabile og varierer per eiendom. Byttes ut med ekte data senere
 * (bookinger, utgifter, lån osv.) — typene her er «kontrakten» mot UI-et.
 */

export type CostLine = { key: string; label: string; monthly: number };
export type IncomeSource = {
  key: string;
  label: string;
  thisMonth: number;
  ytd: number;
  lastYear: number;
};
export type Owner = {
  name: string;
  sharePct: number;
  paid: number;
  shouldPay: number;
};
export type TimelineEvent = {
  year: number;
  date: string;
  title: string;
  kind: "kjop" | "oppussing" | "vedlikehold" | "finans" | "verdi";
  amount?: number;
};
export type YearRow = {
  year: number;
  income: number;
  costs: number;
  result: number;
  value: number;
};

export type Economy = {
  propertyName: string;
  value: number;
  loan: number;
  interestRatePct: number;
  taxRatePct: number;
  costs: CostLine[];
  income: {
    sources: IncomeSource[];
    occupancyPct: number;
    avgNightly: number;
    bestMonth: string;
    worstMonth: string;
  };
  owners: Owner[];
  timeline: TimelineEvent[];
  history: YearRow[];
};

function seed(id: string): number {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return h;
}

const MONTHS = [
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

/** Bygger et komplett (mock) økonomibilde for én eiendom. */
export function getMockEconomy(id: string, name: string): Economy {
  const s = seed(id);
  const value = 3_000_000 + (s % 18) * 100_000; // 3,0–4,7 mill
  const loan = Math.round(value * (0.55 + ((s % 10) / 100))); // 55–64 %
  const interestRatePct = 5.4;
  const monthlyInterest = Math.round((loan * (interestRatePct / 100)) / 12);
  const avdrag = 3800 + (s % 5) * 200;

  const costs: CostLine[] = [
    { key: "renter", label: "Renter", monthly: monthlyInterest },
    { key: "avdrag", label: "Avdrag", monthly: avdrag },
    { key: "strom", label: "Strøm", monthly: 1650 + (s % 6) * 120 },
    { key: "forsikring", label: "Forsikring", monthly: 620 },
    { key: "kommunale", label: "Kommunale avgifter", monthly: 880 },
    { key: "eiendomsskatt", label: "Eiendomsskatt", monthly: 410 },
    { key: "internett", label: "Internett", monthly: 499 },
    { key: "alarm", label: "Alarm", monthly: 299 },
    { key: "broyting", label: "Brøyting/snømåking", monthly: 650 },
    { key: "vaskefirma", label: "Vaskefirma", monthly: 2400 + (s % 4) * 300 },
    { key: "vedlikehold", label: "Vedlikehold", monthly: 1500 },
    { key: "regnskap", label: "Regnskap", monthly: 400 },
    { key: "andre", label: "Andre kostnader", monthly: 450 },
  ];

  const abnb = 12800 + (s % 8) * 700;
  const booking = 6400 + (s % 6) * 500;
  const direkte = 5200 + (s % 5) * 600;
  const income = {
    sources: [
      { key: "airbnb", label: "Airbnb", thisMonth: abnb, ytd: abnb * 7, lastYear: abnb * 6.4 },
      { key: "booking", label: "Booking.com", thisMonth: booking, ytd: booking * 7, lastYear: booking * 7.3 },
      { key: "direkte", label: "Direktebooking", thisMonth: direkte, ytd: direkte * 7, lastYear: direkte * 4.8 },
      { key: "privat", label: "Privat utleie", thisMonth: 2000, ytd: 9000, lastYear: 12000 },
      { key: "andre", label: "Andre inntekter", thisMonth: 0, ytd: 3500, lastYear: 1500 },
    ] as IncomeSource[],
    occupancyPct: 58 + (s % 20),
    avgNightly: 1700 + (s % 9) * 90,
    bestMonth: MONTHS[6],
    worstMonth: MONTHS[10],
  };

  const owners: Owner[] = [
    { name: "Deg", sharePct: 40, paid: 142000, shouldPay: 120000 },
    { name: "Kari Nordmann", sharePct: 30, paid: 78000, shouldPay: 90000 },
    { name: "Ola Hansen", sharePct: 20, paid: 51000, shouldPay: 60000 },
    { name: "Per Berg", sharePct: 10, paid: 34000, shouldPay: 30000 },
  ];

  const timeline: TimelineEvent[] = [
    { year: 2019, date: "2019-06-01", title: "Kjøpte hytta", kind: "kjop", amount: 2_650_000 },
    { year: 2020, date: "2020-08-15", title: "Nytt bad", kind: "oppussing", amount: 185_000 },
    { year: 2021, date: "2021-05-20", title: "Ny varmepumpe", kind: "oppussing", amount: 42_000 },
    { year: 2022, date: "2022-07-10", title: "Malt utvendig", kind: "vedlikehold", amount: 65_000 },
    { year: 2023, date: "2023-06-05", title: "Ny terrasse", kind: "oppussing", amount: 120_000 },
    { year: 2024, date: "2024-03-01", title: "Refinansiering", kind: "finans" },
    { year: 2025, date: "2025-02-15", title: "Verdivurdering", kind: "verdi", amount: value },
  ];

  const history: YearRow[] = [2022, 2023, 2024, 2025].map((year, i) => {
    const inc = 210_000 + i * 26_000 + (s % 7) * 4000;
    const cost = 168_000 + i * 12_000;
    return { year, income: inc, costs: cost, result: inc - cost, value: value - (3 - i) * 140_000 };
  });

  return {
    propertyName: name,
    value,
    loan,
    interestRatePct,
    taxRatePct: 22,
    costs,
    income,
    owners,
    timeline,
    history,
  };
}

/** Sum av alle månedlige kostnader. */
export function monthlyCostTotal(e: Economy): number {
  return e.costs.reduce((sum, c) => sum + c.monthly, 0);
}

/** Sum av alle månedlige inntekter (denne måneden). */
export function monthlyIncomeTotal(e: Economy): number {
  return e.income.sources.reduce((sum, s) => sum + s.thisMonth, 0);
}
