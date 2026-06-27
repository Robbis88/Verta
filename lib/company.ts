/**
 * Selskaps- og compliance-detaljer ett sted. Fyll inn org.nr og adresse når
 * Verta AS er registrert i Brønnøysund — da oppdateres alle juridiske sider.
 */
export const COMPANY = {
  legalName: "Verta AS",
  orgNr: "under registrering", // TODO: sett inn org.nr ved registrering
  address: "—", // TODO: forretningsadresse
  contactEmail: "hei@verta.no",
  privacyEmail: "personvern@verta.no",
  /** Dato for siste oppdatering av de juridiske sidene. */
  lastUpdated: "27. juni 2026",
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
