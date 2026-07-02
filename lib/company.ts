/**
 * Selskaps- og compliance-detaljer ett sted. Verta driftes av R-G Invest AS
 * (Verta AS finnes ikke). Fyll inn org.nr og forretningsadresse for R-G Invest AS
 * → da oppdateres alle juridiske sider automatisk.
 */
export const COMPANY = {
  legalName: "R-G Invest AS",
  orgNr: "937 861 621",
  address: "Sundby-Hvorups vei 99, 5178 Loddefjord",
  contactEmail: "hei@verta.no",
  privacyEmail: "personvern@verta.no",
  /** Dato for siste oppdatering av de juridiske sidene. */
  lastUpdated: "2. juli 2026",
} as const;

/** Underdatabehandlere Verta bruker for å levere tjenesten (GDPR art. 28 nr. 4). */
export const SUBPROCESSORS: {
  name: string;
  purpose: string;
  location: string;
}[] = [
  {
    name: "Supabase",
    purpose: "Database, innlogging og fillagring",
    location: "EU (Frankfurt)",
  },
  {
    name: "Vercel",
    purpose: "Hosting og drift av applikasjonen",
    location: "EU / USA (SCC)",
  },
  {
    name: "Stripe",
    purpose: "Abonnementsbetaling",
    location: "EU / USA (SCC)",
  },
  {
    name: "Vipps MobilePay",
    purpose: "Innlogging og betaling",
    location: "Norge / EØS",
  },
  {
    name: "Resend",
    purpose: "Utsending av e-post (bekreftelser og varsler)",
    location: "EU / USA (SCC)",
  },
  {
    name: "Seam",
    purpose: "Smartlås-integrasjon (adgangskoder)",
    location: "EU / USA (SCC)",
  },
  {
    name: "Anthropic",
    purpose: "AI-funksjoner (tekstforslag og prisanbefalinger)",
    location: "USA (SCC)",
  },
];
