/**
 * Kanonisk liste over modulene i Verta: navn, rute og én linje om hva den er til.
 *
 * Delt mellom den gamle toppmenyen (components/dashboard/dashboard-nav.tsx) og
 * «Alt»-skjermen i huset (components/hjem/alt-rom.tsx), så de aldri kommer ut
 * av synk. Legger noen til en modul her, dukker den opp begge steder.
 */

export type NavGruppeId =
  | "huset"
  | "gjestene"
  | "folkene"
  | "pengene"
  | "utover"
  | "deg";

export type NavItem = {
  label: string;
  href: string;
  /** Hva modulen er til — vises som underlinje og brukes av søket. */
  hint: string;
  gruppe: NavGruppeId;
  /** Kun synlig for admin. */
  adminOnly?: boolean;
};

export const NAV_ITEMS: readonly NavItem[] = [
  // Huset
  {
    label: "Eiendommer",
    href: "/dashboard/properties",
    hint: "boligene dine: detaljer, bilder, utstyr, kalender, iCal og smartlås",
    gruppe: "huset",
  },
  {
    label: "Vedlikehold",
    href: "/dashboard/vedlikehold",
    hint: "reparasjoner og saker — løst sak med kostnad blir en utgift automatisk",
    gruppe: "huset",
  },
  {
    label: "Lager",
    href: "/dashboard/lager",
    hint: "forbruksvarer og handleliste når noe går tomt",
    gruppe: "huset",
  },
  {
    label: "Smartlås",
    href: "/dashboard/smartlas-guide",
    hint: "kom i gang med Nuki, Igloohome eller Salto — eller nøkkelboks",
    gruppe: "huset",
  },

  // Gjestene
  {
    label: "Meldinger",
    href: "/dashboard/meldinger",
    hint: "AI-forslag til svar på gjestemeldinger og anmeldelser",
    gruppe: "gjestene",
  },
  {
    label: "Skade",
    href: "/dashboard/skade",
    hint: "skadekrav mot gjest med bilder og betalingslenke",
    gruppe: "gjestene",
  },

  // Folkene
  {
    label: "Rengjøring",
    href: "/dashboard/rengjoring",
    hint: "vaskeoppgaver, vaskere og deres egen portal",
    gruppe: "folkene",
  },
  {
    label: "Finn vaskehjelp",
    href: "/dashboard/finn-vaskehjelp",
    hint: "finn ledige vaskere i nærheten og send forespørsel",
    gruppe: "folkene",
  },
  {
    label: "Team",
    href: "/dashboard/team",
    hint: "inviter co-host som kan hjelpe deg med driften",
    gruppe: "folkene",
  },

  // Pengene
  {
    label: "Eiendomsøkonomi",
    href: "/dashboard/okonomi",
    hint: "verdi, lån, egenkapital og historikk for boligen",
    gruppe: "pengene",
  },
  {
    label: "Utgifter",
    href: "/dashboard/utgifter",
    hint: "registrer kostnader — de går rett inn i skatterapporten",
    gruppe: "pengene",
  },
  {
    label: "Provisjon",
    href: "/dashboard/commissions",
    hint: "provisjon på bookinger som kom fra Vertas egne kanaler",
    gruppe: "pengene",
  },
  {
    label: "Skatt",
    href: "/dashboard/tax",
    hint: "underlag til skattemeldingen: leieinntekt, fribeløp og kostnader",
    gruppe: "pengene",
  },

  // Utover
  {
    label: "Prising",
    href: "/dashboard/prising",
    hint: "AI-forslag på nattpris og sesongpriser",
    gruppe: "utover",
  },
  {
    label: "Varsler",
    href: "/dashboard/varsler",
    hint: "tomme perioder og lavt belegg, med ferdig kampanje",
    gruppe: "utover",
  },
  {
    label: "Boost",
    href: "/dashboard/boosts",
    hint: "betalt markedsføring av ledige datoer på Vertas kanaler",
    gruppe: "utover",
  },

  // Deg
  {
    label: "Oversikt",
    href: "/dashboard",
    hint: "det gamle dashbordet med alle tall og grafer",
    gruppe: "deg",
  },
  {
    label: "Sikkerhet",
    href: "/dashboard/sikkerhet",
    hint: "passord, tofaktor og revisjonslogg",
    gruppe: "deg",
  },
  {
    label: "Innstillinger",
    href: "/dashboard/settings",
    hint: "konto, abonnement og fakturering",
    gruppe: "deg",
  },
  {
    label: "Admin",
    href: "/admin",
    hint: "plattformadministrasjon",
    gruppe: "deg",
    adminOnly: true,
  },
] as const;

export const NAV_GRUPPER: { id: NavGruppeId; tittel: string; hva: string }[] = [
  { id: "huset", tittel: "Huset", hva: "Selve boligen og alt som står i den" },
  { id: "gjestene", tittel: "Gjestene", hva: "De som bor hos deg" },
  { id: "folkene", tittel: "Folkene", hva: "De som passer huset for deg" },
  { id: "pengene", tittel: "Pengene", hva: "Inn, ut, lån og skatt" },
  { id: "utover", tittel: "Utover", hva: "Å få flere gjester" },
  { id: "deg", tittel: "Deg", hva: "Kontoen og det gamle dashbordet" },
];

/** Modulene gruppert for «Alt»-skjermen. Admin-moduler tas med kun for admin. */
export function navGrupper(admin: boolean) {
  const synlige = NAV_ITEMS.filter((i) => !i.adminOnly || admin);
  return NAV_GRUPPER.map((g) => ({
    ...g,
    items: synlige.filter((i) => i.gruppe === g.id),
  })).filter((g) => g.items.length > 0);
}
