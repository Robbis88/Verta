import "server-only";

import type { createClient } from "@/lib/supabase/server";

/**
 * Dataloadere for «huset» — de to romlige aksene på /hjem.
 *
 *   ROM  = boligen innvendig (utstyr, adgang, lager, historikk, folk, skader)
 *   TID  = de neste ~90 døgnene som en elv (opphold, tomme netter, vask)
 *
 * Prinsipp: KUN lesing. Ingen tabell, kolonne, migrasjon, server action eller
 * forretningslogikk er endret for dette laget — alt her er nye SELECT-er over
 * data som allerede finnes, satt sammen på en ny måte. Hver loader er isolert
 * med try/catch, så en modul uten kjørt SQL aldri velter skjermen.
 */

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function netterMellom(a: string, b: string): number {
  const d1 = new Date(`${a}T00:00:00Z`).getTime();
  const d2 = new Date(`${b}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((d2 - d1) / 86400000));
}

/** Legger på property_id-filter når én bestemt bolig er valgt. */
type MedEq = { eq(column: string, value: string): unknown };
function medBolig<Q>(q: Q, propertyId: string | null): Q {
  if (!propertyId) return q;
  return (q as MedEq).eq("property_id", propertyId) as Q;
}

// ---------------------------------------------------------------------------
// AKSE 1 — ROM
// ---------------------------------------------------------------------------

export type SoneId =
  | "soverom"
  | "bad"
  | "kjokken"
  | "stue"
  | "ute"
  | "teknikk"
  | "adgang"
  | "lager"
  | "nokler"
  | "historikk"
  | "folk"
  | "skader";

export type SoneTing = {
  id: string;
  navn: string;
  /** Én linje under navnet: alder, antall, hvem, når. */
  detalj: string | null;
  /** Krever oppmerksomhet — får rommet til å lyse. */
  varsel: boolean;
  href: string;
};

export type Sone = {
  id: SoneId;
  navn: string;
  /** Hva sonen er, i én setning. */
  hva: string;
  ting: SoneTing[];
  varsler: number;
  /** Hvor man går for å endre eller legge til. */
  href: string;
};

export type Sak = {
  id: string;
  tittel: string;
  prioritet: string;
};

export type Husplan = {
  soner: Sone[];
  saker: Sak[];
  soverom: number | null;
  bad: number | null;
};

const SONE_META: Record<SoneId, { navn: string; hva: string; href: string }> = {
  soverom: {
    navn: "Soverom",
    hva: "Senger og alt som står på soverommene.",
    href: "/dashboard/properties",
  },
  bad: {
    navn: "Bad",
    hva: "Dusj, vann og alt som kan lekke.",
    href: "/dashboard/properties",
  },
  kjokken: {
    navn: "Kjøkken",
    hva: "Hvitevarer og det gjestene lager mat med.",
    href: "/dashboard/properties",
  },
  stue: {
    navn: "Stue",
    hva: "Møbler, TV og fellesarealet.",
    href: "/dashboard/properties",
  },
  ute: {
    navn: "Ute",
    hva: "Terrasse, bod, badestamp og uteplass.",
    href: "/dashboard/properties",
  },
  teknikk: {
    navn: "Teknikk",
    hva: "Varme, strøm, vann og elektronikk.",
    href: "/dashboard/properties",
  },
  adgang: {
    navn: "Adgang",
    hva: "Hvordan gjestene kommer seg inn.",
    href: "/dashboard/properties",
  },
  lager: {
    navn: "Lager",
    hva: "Forbruksvarer gjestene bruker opp.",
    href: "/dashboard/lager",
  },
  nokler: {
    navn: "Nøkler",
    hva: "Hvem som har hvilken nøkkel akkurat nå.",
    href: "/dashboard/properties",
  },
  historikk: {
    navn: "Historikk",
    hva: "Alt som har skjedd med boligen, år for år.",
    href: "/dashboard/okonomi/historikk",
  },
  folk: {
    navn: "Folk",
    hva: "Dine faste folk: snekker, brøyting, vaktmester.",
    href: "/dashboard/properties",
  },
  skader: {
    navn: "Skader",
    hva: "Skadekrav mot gjester.",
    href: "/dashboard/skade",
  },
};

const REKKEFOLGE: SoneId[] = [
  "soverom",
  "bad",
  "kjokken",
  "stue",
  "ute",
  "teknikk",
  "adgang",
  "lager",
  "nokler",
  "historikk",
  "folk",
  "skader",
];

/** Plasserer utstyr i et rom ut fra fritekst-lokasjonen, ellers kategorien. */
function soneForUtstyr(
  kategori: string | null,
  lokasjon: string | null,
): SoneId {
  const l = `${lokasjon ?? ""} ${kategori ?? ""}`.toLowerCase();
  if (/sov|seng|bedroom/.test(l)) return "soverom";
  if (/bad|dusj|wc|toalett|bath/.test(l)) return "bad";
  if (/kjøkken|kjokken|kitchen|komfyr|kaffe|oppvask/.test(l)) return "kjokken";
  if (/stue|salong|tv|peis|living/.test(l)) return "stue";
  if (/ute|terrasse|balkong|hage|bod|stamp|boblebad|garasje|uthus/.test(l))
    return "ute";
  return "teknikk";
}

/** «11 år gammel» — gjør husets forfall synlig før noe ryker. */
function alderTekst(kjopt: string | null): string | null {
  if (!kjopt) return null;
  const ar =
    (Date.now() - new Date(`${kjopt}T00:00:00Z`).getTime()) /
    (365.25 * 86400000);
  if (ar < 1) return "ny i år";
  return `${Math.floor(ar)} år gammel`;
}

export async function loadHusplan(
  supabase: SupabaseServer,
  propertyId: string | null,
): Promise<Husplan> {
  const idag = isoDate(new Date());
  const bøtter = new Map<SoneId, SoneTing[]>();
  const varsler = new Map<SoneId, number>();

  const legg = (sone: SoneId, ting: SoneTing) => {
    const liste = bøtter.get(sone) ?? [];
    liste.push(ting);
    bøtter.set(sone, liste);
    if (ting.varsel) varsler.set(sone, (varsler.get(sone) ?? 0) + 1);
  };

  // Utstyret — med alder og garanti, festet til rommet det står i.
  try {
    const { data } = await medBolig(
      supabase
        .from("house_equipment")
        .select("id,name,category,location,brand,purchased_at,warranty_until"),
      propertyId,
    ).order("created_at");
    for (const e of (data ?? []) as {
      id: string;
      name: string;
      category: string | null;
      location: string | null;
      brand: string | null;
      purchased_at: string | null;
      warranty_until: string | null;
    }[]) {
      const garantiUte = !!e.warranty_until && e.warranty_until < idag;
      const deler = [
        e.location,
        e.brand,
        alderTekst(e.purchased_at),
        garantiUte ? "garanti utløpt" : null,
      ].filter(Boolean);
      legg(soneForUtstyr(e.category, e.location), {
        id: `eq-${e.id}`,
        navn: e.name,
        detalj: deler.length > 0 ? deler.join(" · ") : null,
        varsel: garantiUte,
        href: "/dashboard/properties",
      });
    }
  } catch {
    /* modulen finnes ikke ennå */
  }

  // Adgang: hvordan gjesten kommer inn — smartlås og/eller nøkkelboks-tekst.
  try {
    const q = supabase
      .from("properties")
      .select("id,name,access_info,bedrooms,bathrooms");
    const { data } = await (propertyId ? q.eq("id", propertyId) : q);
    for (const p of (data ?? []) as {
      id: string;
      name: string;
      access_info: string | null;
      bedrooms: number | null;
      bathrooms: number | null;
    }[]) {
      legg("adgang", {
        id: `ai-${p.id}`,
        navn: p.access_info ? "Tilkomst er beskrevet" : "Ingen tilkomst lagret",
        detalj: p.access_info
          ? p.access_info.replace(/\s+/g, " ").slice(0, 90)
          : "Gjestene får ingen kode eller nøkkelinfo automatisk",
        varsel: !p.access_info,
        href: `/dashboard/properties/${p.id}`,
      });
    }
  } catch {
    /* ignorer */
  }

  try {
    const { data } = await medBolig(
      supabase.from("smart_locks").select("id,provider,status,property_id"),
      propertyId,
    );
    for (const l of (data ?? []) as {
      id: string;
      provider: string;
      status: string;
      property_id: string;
    }[]) {
      legg("adgang", {
        id: `sl-${l.id}`,
        navn: `Smartlås (${l.provider})`,
        detalj:
          l.status === "connected"
            ? "tilkoblet — koder lages automatisk"
            : `status: ${l.status}`,
        varsel: l.status !== "connected",
        href: `/dashboard/properties/${l.property_id}`,
      });
    }
  } catch {
    /* ignorer */
  }

  // Lageret — alt på eller under terskel lyser.
  try {
    const { data } = await medBolig(
      supabase.from("supplies").select("id,name,current_qty,low_threshold,unit"),
      propertyId,
    ).order("name");
    for (const s of (data ?? []) as {
      id: string;
      name: string;
      current_qty: number;
      low_threshold: number;
      unit: string | null;
    }[]) {
      const lavt = Number(s.current_qty) <= Number(s.low_threshold);
      legg("lager", {
        id: `su-${s.id}`,
        navn: s.name,
        detalj: `${s.current_qty} ${s.unit ?? "stk"}${lavt ? " · må fylles" : ""}`,
        varsel: lavt,
        href: "/dashboard/lager",
      });
    }
  } catch {
    /* ignorer */
  }

  // Nøkkelknippet (sql/064). Uten kjørt migrasjon er skuffen bare tom.
  try {
    const { data } = await medBolig(
      supabase
        .from("property_keys")
        .select("id,label,key_type,copies,holder,property_id"),
      propertyId,
    ).order("created_at");
    for (const k of (data ?? []) as {
      id: string;
      label: string;
      key_type: string;
      copies: number;
      holder: string | null;
      property_id: string;
    }[]) {
      legg("nokler", {
        id: `pk-${k.id}`,
        navn: k.label,
        detalj: k.holder
          ? `hos ${k.holder}${k.copies > 1 ? ` · ${k.copies} stk` : ""}`
          : "ingen vet hvor denne er",
        varsel: !k.holder,
        href: `/dashboard/properties/${k.property_id}`,
      });
    }
  } catch {
    /* migrasjonen er ikke kjørt ennå */
  }

  // Historikken — husets dagbok: kjøp, oppussing, vedlikehold, verdi.
  try {
    const { data } = await medBolig(
      supabase
        .from("property_events")
        .select("id,event_date,title,kind,amount"),
      propertyId,
    )
      .order("event_date", { ascending: false })
      .limit(14);
    for (const e of (data ?? []) as {
      id: string;
      event_date: string;
      title: string;
      kind: string;
      amount: number | null;
    }[]) {
      const ar = e.event_date.slice(0, 4);
      legg("historikk", {
        id: `ev-${e.id}`,
        navn: e.title,
        detalj: [ar, e.kind, e.amount ? `${Math.round(Number(e.amount))} kr` : null]
          .filter(Boolean)
          .join(" · "),
        varsel: false,
        href: "/dashboard/okonomi/historikk",
      });
    }
  } catch {
    /* ignorer */
  }

  // Folkene — eierens faste kontakter for boligen.
  try {
    const { data } = await medBolig(
      supabase.from("property_contacts").select("id,name,role,phone"),
      propertyId,
    ).order("created_at");
    for (const c of (data ?? []) as {
      id: string;
      name: string;
      role: string | null;
      phone: string | null;
    }[]) {
      legg("folk", {
        id: `pc-${c.id}`,
        navn: c.name,
        detalj: [c.role, c.phone].filter(Boolean).join(" · ") || null,
        varsel: false,
        href: "/dashboard/properties",
      });
    }
  } catch {
    /* ignorer */
  }

  // Skadekrav — ubetalte krav lyser.
  try {
    const { data } = await medBolig(
      supabase
        .from("incident_claims")
        .select("id,amount,description,status,created_at"),
      propertyId,
    )
      .order("created_at", { ascending: false })
      .limit(10);
    for (const s of (data ?? []) as {
      id: string;
      amount: number;
      description: string | null;
      status: string;
      created_at: string;
    }[]) {
      legg("skader", {
        id: `ic-${s.id}`,
        navn: s.description?.slice(0, 60) || "Skadekrav",
        detalj: `${Math.round(Number(s.amount))} kr · ${
          s.status === "paid"
            ? "betalt"
            : s.status === "cancelled"
              ? "avlyst"
              : "venter på betaling"
        }`,
        varsel: s.status === "pending",
        href: "/dashboard/skade",
      });
    }
  } catch {
    /* ignorer */
  }

  // Åpne saker hører til huset, ikke ett rom — de vises som et bånd under planen.
  let saker: Sak[] = [];
  try {
    const { data } = await medBolig(
      supabase
        .from("maintenance_requests")
        .select("id,title,priority,status"),
      propertyId,
    )
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(8);
    saker = ((data ?? []) as { id: string; title: string; priority: string }[]).map(
      (m) => ({ id: m.id, tittel: m.title, prioritet: m.priority }),
    );
  } catch {
    /* ignorer */
  }

  // Rom-antall gir planen riktig størrelse selv uten registrert utstyr.
  let soverom: number | null = null;
  let bad: number | null = null;
  try {
    const q = supabase.from("properties").select("bedrooms,bathrooms");
    const { data } = await (propertyId ? q.eq("id", propertyId) : q);
    for (const p of (data ?? []) as {
      bedrooms: number | null;
      bathrooms: number | null;
    }[]) {
      if (p.bedrooms != null) soverom = (soverom ?? 0) + Number(p.bedrooms);
      if (p.bathrooms != null) bad = (bad ?? 0) + Number(p.bathrooms);
    }
  } catch {
    /* ignorer */
  }

  const soner: Sone[] = REKKEFOLGE.map((id) => ({
    id,
    navn: SONE_META[id].navn,
    hva: SONE_META[id].hva,
    ting: bøtter.get(id) ?? [],
    varsler: varsler.get(id) ?? 0,
    href: SONE_META[id].href,
  }));

  return { soner, saker, soverom, bad };
}

// ---------------------------------------------------------------------------
// AKSE 2 — TID
// ---------------------------------------------------------------------------

export type Opphold = {
  id: string;
  gjest: string;
  inn: string;
  ut: string;
  netter: number;
  belop: number | null;
  kilde: string;
  /** Venter på eierens svar (status = requested). */
  venter: boolean;
  bolig: string | null;
};

export type Hull = {
  fra: string;
  til: string;
  netter: number;
  /** Hva de tomme nettene er verdt, i kroner. */
  tap: number;
};

export type Merke = {
  id: string;
  dato: string;
  tekst: string;
  slag: "vask";
  href: string;
};

export type Elv = {
  start: string;
  dager: number;
  opphold: Opphold[];
  hull: Hull[];
  merker: Merke[];
  taptTotalt: number;
  /** Andel netter som er booket i vinduet, 0–1. */
  belegg: number;
  /** Snittprisen vi regnet med, eller null hvis ingen pris er satt. */
  snittNattpris: number | null;
};

type Sesong = { date_from: string; date_to: string; nightly_rate: number };

/**
 * Nattpris for én dato: sesongpris som dekker datoen (sist startende vinner),
 * ellers baseprisen. Speiler regelen i lib/pricing.ts (rateForNight) — den er
 * privat der, og prislogikken er ikke endret.
 */
function nattpris(
  dato: string,
  base: number | null,
  sesonger: Sesong[],
): number | null {
  const dekker = sesonger
    .filter((s) => dato >= s.date_from && dato <= s.date_to)
    .sort((a, b) => a.date_from.localeCompare(b.date_from));
  const s = dekker[dekker.length - 1];
  if (s) return Number(s.nightly_rate);
  return base != null ? Number(base) : null;
}

export async function loadElv(
  supabase: SupabaseServer,
  propertyId: string | null,
  dager = 90,
): Promise<Elv> {
  const start = isoDate(new Date());
  const slutt = addDays(start, dager);
  const tom: Elv = {
    start,
    dager,
    opphold: [],
    hull: [],
    merker: [],
    taptTotalt: 0,
    belegg: 0,
    snittNattpris: null,
  };

  // Prisgrunnlaget — brukes til å regne hva en tom natt koster.
  let base: number | null = null;
  let sesonger: Sesong[] = [];
  try {
    const q = supabase.from("properties").select("base_nightly_rate");
    const { data } = await (propertyId ? q.eq("id", propertyId) : q).limit(1);
    base = ((data ?? []) as { base_nightly_rate: number | null }[])[0]
      ?.base_nightly_rate ?? null;
  } catch {
    /* ingen pris satt — da vises hullene uten kroner */
  }
  try {
    const { data } = await medBolig(
      supabase.from("seasonal_rates").select("date_from,date_to,nightly_rate"),
      propertyId,
    );
    sesonger = (data ?? []) as Sesong[];
  } catch {
    /* ignorer */
  }

  // Oppholdene — båtene i elven. Forespørsler tas med som «venter».
  let opphold: Opphold[] = [];
  try {
    const { data } = await medBolig(
      supabase
        .from("bookings")
        .select(
          "id,guest_name,check_in,check_out,total_price,source,status,property_id",
        ),
      propertyId,
    )
      .in("status", ["confirmed", "completed", "requested"])
      .gte("check_out", start)
      .lte("check_in", slutt)
      .order("check_in");

    let navn = new Map<string, string>();
    try {
      const { data: props } = await supabase.from("properties").select("id,name");
      navn = new Map(
        ((props ?? []) as { id: string; name: string }[]).map((p) => [
          p.id,
          p.name,
        ]),
      );
    } catch {
      /* ignorer */
    }

    opphold = ((data ?? []) as {
      id: string;
      guest_name: string;
      check_in: string;
      check_out: string;
      total_price: number | null;
      source: string;
      status: string;
      property_id: string;
    }[]).map((b) => ({
      id: b.id,
      gjest: b.guest_name,
      inn: b.check_in,
      ut: b.check_out,
      netter: netterMellom(b.check_in, b.check_out),
      belop: b.total_price == null ? null : Number(b.total_price),
      kilde: b.source,
      venter: b.status === "requested",
      bolig: propertyId ? null : (navn.get(b.property_id) ?? null),
    }));
  } catch {
    return tom;
  }

  // Hull = sammenhengende netter uten et bekreftet opphold. Forespørsler regnes
  // IKKE som opptatt — de er ikke penger i hus ennå.
  const opptatt = new Set<string>();
  for (const o of opphold) {
    if (o.venter) continue;
    for (let d = o.inn; d < o.ut; d = addDays(d, 1)) opptatt.add(d);
  }

  const byggHull = (fra: string, til: string): Hull => {
    let tap = 0;
    for (let d = fra; d < til; d = addDays(d, 1)) tap += nattpris(d, base, sesonger) ?? 0;
    return { fra, til, netter: netterMellom(fra, til), tap: Math.round(tap) };
  };

  const hull: Hull[] = [];
  let løpende: string | null = null;
  let prisSum = 0;
  let prisAntall = 0;
  for (let i = 0; i < dager; i++) {
    const d = addDays(start, i);
    const np = nattpris(d, base, sesonger);
    if (np != null) {
      prisSum += np;
      prisAntall++;
    }
    if (!opptatt.has(d)) {
      if (løpende === null) løpende = d;
    } else if (løpende !== null) {
      hull.push(byggHull(løpende, d));
      løpende = null;
    }
  }
  if (løpende !== null) hull.push(byggHull(løpende, addDays(start, dager)));

  // Vask langs bredden.
  const merker: Merke[] = [];
  try {
    const { data } = await medBolig(
      supabase.from("cleaning_tasks").select("id,task_date,status,type"),
      propertyId,
    )
      .gte("task_date", start)
      .lte("task_date", slutt)
      .order("task_date");
    for (const t of (data ?? []) as {
      id: string;
      task_date: string;
      status: string;
      type: string;
    }[]) {
      merker.push({
        id: `ct-${t.id}`,
        dato: t.task_date,
        tekst:
          t.status === "completed"
            ? "Vasket"
            : t.status === "pending"
              ? "Vask (ingen vasker)"
              : "Vask",
        slag: "vask",
        href: "/dashboard/rengjoring",
      });
    }
  } catch {
    /* ignorer */
  }

  const bookedeNetter = Array.from(opptatt).filter(
    (d) => d >= start && d < slutt,
  ).length;

  return {
    start,
    dager,
    opphold,
    hull,
    merker,
    taptTotalt: hull.reduce((s, h) => s + h.tap, 0),
    belegg: dager > 0 ? bookedeNetter / dager : 0,
    snittNattpris: prisAntall > 0 ? Math.round(prisSum / prisAntall) : null,
  };
}

// ---------------------------------------------------------------------------
// Startskjermen — dagens ENE ting
// ---------------------------------------------------------------------------

export type DagensTing = {
  /** Kort merkelapp over overskriften. */
  merke: string;
  overskrift: string;
  under: string | null;
  tone: "ro" | "obs" | "kritisk";
  knappTekst: string;
  knappHref: string;
};

export type HusetNa = {
  /** Første bilde av boligen, eller null. */
  bilde: string | null;
  boligNavn: string | null;
  boligAntall: number;
  ting: DagensTing | null;
  /** Antall andre ting som venter, utover den ene vi viser. */
  restAntall: number;
};

/**
 * Finner den ENE tingen som fortjener skjermen akkurat nå, i streng
 * prioritet: ubesvart forespørsel → kritisk varsel → gjestelenke som ikke er
 * sendt → vask uten vasker → neste innsjekk. Ingenting = ro.
 */
export async function loadHusetNa(
  supabase: SupabaseServer,
): Promise<HusetNa> {
  const idag = isoDate(new Date());

  /** Kjører en spørring uten å kunne velte skjermen. */
  async function trygg<T>(q: PromiseLike<{ data: unknown }>): Promise<T[]> {
    try {
      const { data } = await q;
      return (data ?? []) as T[];
    } catch {
      return [];
    }
  }

  // Alle spørringene i parallell — startskjermen handler om det første
  // sekundet, så ingenting skal vente på noe annet.
  const [boliger, forespørsler, varsler, usendte, vask, neste] = await Promise.all([
    trygg<{ id: string; name: string; images: string[] | null }>(
      supabase.from("properties").select("id,name,images").order("created_at"),
    ),
    trygg<{ id: string; guest_name: string; property_id: string }>(
      supabase
        .from("bookings")
        .select("id,guest_name,property_id")
        .eq("status", "requested")
        .order("created_at"),
    ),
    trygg<{ id: string; title: string }>(
      supabase
        .from("critical_alerts")
        .select("id,title")
        .eq("resolved", false)
        .order("created_at", { ascending: false }),
    ),
    trygg<{ id: string; guest_name: string }>(
      supabase
        .from("bookings")
        .select("id,guest_name,check_in")
        .eq("guest_link_sent", false)
        .not("guest_token", "is", null)
        .not("status", "in", "(cancelled,requested)")
        .gte("check_out", idag)
        .order("check_in"),
    ),
    trygg<{ id: string; task_date: string }>(
      supabase
        .from("cleaning_tasks")
        .select("id,task_date")
        .eq("status", "pending")
        .is("cleaner_id", null)
        .gte("task_date", idag)
        .lte("task_date", addDays(idag, 10))
        .order("task_date"),
    ),
    trygg<{ id: string; guest_name: string; check_in: string; property_id: string }>(
      supabase
        .from("bookings")
        .select("id,guest_name,check_in,property_id")
        .eq("status", "confirmed")
        .gte("check_in", idag)
        .order("check_in")
        .limit(1),
    ),
  ]);

  const bilde =
    boliger.map((b) => b.images?.[0]).find((u): u is string => !!u) ?? null;
  const boligNavn = boliger.length === 1 ? boliger[0].name : null;

  // Streng prioritet: hvem venter mest på deg akkurat nå?
  const kandidater: DagensTing[] = [];

  // 1. En gjest har spurt og står og venter på svar.
  if (forespørsler.length > 0) {
    const r = forespørsler[0];
    kandidater.push({
      merke: "Venter på deg",
      overskrift: `${r.guest_name} har spurt om å få bo hos deg.`,
      under:
        forespørsler.length > 1
          ? `${forespørsler.length} forespørsler venter på svar.`
          : "Svar før gjesten finner noe annet.",
      tone: "kritisk",
      knappTekst: "Svar nå",
      knappHref: `/hjem/opphold/${r.id}`,
    });
  }

  // 2. Penger som ikke har gått som de skulle.
  if (varsler.length > 0) {
    kandidater.push({
      merke: "Trenger deg",
      overskrift: varsler[0].title,
      under:
        varsler.length > 1
          ? `${varsler.length} varsler om betaling eller refusjon.`
          : "Et betalingsvarsel er ikke løst.",
      tone: "kritisk",
      knappTekst: "Se varselet",
      knappHref: "/dashboard",
    });
  }

  // 3. Gjesten mangler lenken sin til innsjekk, WiFi og dørkode.
  if (usendte.length > 0) {
    kandidater.push({
      merke: "Én ting igjen",
      overskrift: `${usendte[0].guest_name} har ikke fått gjestelenken sin.`,
      under: "Innsjekk, WiFi og dørkode — alt på én lenke.",
      tone: "obs",
      knappTekst: "Send lenken",
      knappHref: `/hjem/opphold/${usendte[0].id}`,
    });
  }

  // 4. Vask som nærmer seg uten at noen er satt på.
  if (vask.length > 0) {
    const dager = netterMellom(idag, vask[0].task_date);
    kandidater.push({
      merke: "Snart",
      overskrift:
        dager === 0
          ? "Det skal vaskes i dag, men ingen er satt på."
          : `Det skal vaskes om ${dager} dager, men ingen er satt på.`,
      under: "Sett en vasker, eller finn hjelp i nærheten.",
      tone: "obs",
      knappTekst: "Sett vasker",
      knappHref: "/dashboard/rengjoring",
    });
  }

  // 5. Det hyggelige tilfellet: neste gjest på vei.
  if (neste.length > 0) {
    const dager = netterMellom(idag, neste[0].check_in);
    kandidater.push({
      merke: "Neste gjest",
      overskrift:
        dager === 0
          ? `${neste[0].guest_name} kommer i dag.`
          : dager === 1
            ? `${neste[0].guest_name} kommer i morgen.`
            : `${neste[0].guest_name} kommer om ${dager} dager.`,
      under: "Alt er klart så langt jeg kan se.",
      tone: "ro",
      knappTekst: "Se oppholdet",
      knappHref: `/hjem/opphold/${neste[0].id}`,
    });
  }

  return {
    bilde,
    boligNavn,
    boligAntall: boliger.length,
    ting: kandidater[0] ?? null,
    restAntall: Math.max(0, kandidater.length - 1),
  };
}

// ---------------------------------------------------------------------------
// HUSETS BIOGRAFI — det boligen har vært gjennom
// ---------------------------------------------------------------------------

export type Hendelse = {
  id: string;
  dato: string;
  tittel: string;
  /** Hva slags hendelse: kjøp, oppussing, vedlikehold, finans, verdi, utstyr. */
  slag: string;
  belop: number | null;
};

export type BiografiAr = {
  ar: number;
  inntekt: number;
  kostnad: number;
  netter: number;
  gjester: number;
  hendelser: Hendelse[];
};

export type Biografi = {
  boligNavn: string | null;
  /** Første året vi har spor av — kjøp, hendelse eller booking. */
  forsteAr: number | null;
  totalInntekt: number;
  totalKostnad: number;
  totalNetter: number;
  totalGjester: number;
  snittRating: number | null;
  antallAnmeldelser: number;
  /** Ett sitat fra en gjest, hvis noen har skrevet noe. */
  sitat: { tekst: string; navn: string; rating: number } | null;
  ar: BiografiAr[];
};

/**
 * Samler alt boligen har vært gjennom til én lesbar historie, år for år.
 * Leser property_events, løste maintenance_requests, house_equipment-kjøp,
 * bookings, expenses og property_reviews. Ingenting nytt lagres — dette er
 * hukommelsen som allerede ligger der, satt sammen slik et menneske leser den.
 */
export async function loadBiografi(
  supabase: SupabaseServer,
  propertyId: string | null,
): Promise<Biografi> {
  async function trygg<T>(q: PromiseLike<{ data: unknown }>): Promise<T[]> {
    try {
      const { data } = await q;
      return (data ?? []) as T[];
    } catch {
      return [];
    }
  }

  const [boliger, events, saker, utstyr, bookinger, utgifter, anmeldelser] =
    await Promise.all([
      trygg<{ id: string; name: string }>(
        supabase.from("properties").select("id,name").order("created_at"),
      ),
      trygg<{
        id: string;
        event_date: string;
        title: string;
        kind: string;
        amount: number | null;
      }>(
        medBolig(
          supabase
            .from("property_events")
            .select("id,event_date,title,kind,amount"),
          propertyId,
        ).order("event_date", { ascending: false }),
      ),
      trygg<{ id: string; title: string; cost: number | null; resolved_at: string }>(
        medBolig(
          supabase
            .from("maintenance_requests")
            .select("id,title,cost,resolved_at"),
          propertyId,
        )
          .eq("status", "resolved")
          .not("resolved_at", "is", null)
          .order("resolved_at", { ascending: false }),
      ),
      trygg<{ id: string; name: string; brand: string | null; purchased_at: string }>(
        medBolig(
          supabase
            .from("house_equipment")
            .select("id,name,brand,purchased_at"),
          propertyId,
        ).not("purchased_at", "is", null),
      ),
      trygg<{
        id: string;
        check_in: string;
        check_out: string;
        total_price: number | null;
        nights: number | null;
      }>(
        medBolig(
          supabase
            .from("bookings")
            .select("id,check_in,check_out,total_price,nights"),
          propertyId,
        ).in("status", ["confirmed", "completed"]),
      ),
      trygg<{ id: string; amount: number; expense_date: string }>(
        medBolig(
          supabase.from("expenses").select("id,amount,expense_date"),
          propertyId,
        ),
      ),
      trygg<{
        id: string;
        guest_name: string;
        rating: number;
        comment: string | null;
      }>(
        medBolig(
          supabase
            .from("property_reviews")
            .select("id,guest_name,rating,comment"),
          propertyId,
        ).order("created_at", { ascending: false }),
      ),
    ]);

  const arKart = new Map<number, BiografiAr>();
  const hent = (ar: number): BiografiAr => {
    let rad = arKart.get(ar);
    if (!rad) {
      rad = { ar, inntekt: 0, kostnad: 0, netter: 0, gjester: 0, hendelser: [] };
      arKart.set(ar, rad);
    }
    return rad;
  };

  for (const e of events) {
    hent(Number(e.event_date.slice(0, 4))).hendelser.push({
      id: `ev-${e.id}`,
      dato: e.event_date,
      tittel: e.title,
      slag: e.kind,
      belop: e.amount == null ? null : Number(e.amount),
    });
  }

  for (const s of saker) {
    const dato = s.resolved_at.slice(0, 10);
    hent(Number(dato.slice(0, 4))).hendelser.push({
      id: `mr-${s.id}`,
      dato,
      tittel: s.title,
      slag: "reparasjon",
      belop: s.cost == null ? null : Number(s.cost),
    });
  }

  for (const u of utstyr) {
    hent(Number(u.purchased_at.slice(0, 4))).hendelser.push({
      id: `he-${u.id}`,
      dato: u.purchased_at,
      tittel: [u.name, u.brand].filter(Boolean).join(" · "),
      slag: "utstyr",
      belop: null,
    });
  }

  let totalInntekt = 0;
  let totalNetter = 0;
  let totalGjester = 0;
  for (const b of bookinger) {
    const rad = hent(Number(b.check_in.slice(0, 4)));
    const belop = b.total_price == null ? 0 : Number(b.total_price);
    const netter = b.nights ?? netterMellom(b.check_in, b.check_out);
    rad.inntekt += belop;
    rad.netter += netter;
    rad.gjester += 1;
    totalInntekt += belop;
    totalNetter += netter;
    totalGjester += 1;
  }

  let totalKostnad = 0;
  for (const u of utgifter) {
    const belop = Number(u.amount);
    hent(Number(u.expense_date.slice(0, 4))).kostnad += belop;
    totalKostnad += belop;
  }

  const medKarakter = anmeldelser.filter((a) => a.rating > 0);
  const snittRating =
    medKarakter.length > 0
      ? Math.round(
          (medKarakter.reduce((n, a) => n + a.rating, 0) / medKarakter.length) * 10,
        ) / 10
      : null;
  const medTekst = anmeldelser.find((a) => (a.comment ?? "").trim().length > 20);

  const ar = Array.from(arKart.values()).sort((a, b) => b.ar - a.ar);
  for (const rad of ar) {
    rad.hendelser.sort((a, b) => (a.dato < b.dato ? 1 : -1));
  }

  return {
    boligNavn: boliger.length === 1 ? boliger[0].name : null,
    forsteAr: ar.length > 0 ? ar[ar.length - 1].ar : null,
    totalInntekt,
    totalKostnad,
    totalNetter,
    totalGjester,
    snittRating,
    antallAnmeldelser: medKarakter.length,
    sitat: medTekst
      ? {
          tekst: (medTekst.comment ?? "").trim(),
          navn: medTekst.guest_name,
          rating: medTekst.rating,
        }
      : null,
    ar,
  };
}

// ---------------------------------------------------------------------------
// ETT OPPHOLD — hele gjestens historie som én tråd
// ---------------------------------------------------------------------------

export type OppholdMelding = {
  id: string;
  retning: "inn" | "ut";
  kanal: string;
  tekst: string;
  nar: string;
};

export type OppholdDetalj = {
  id: string;
  gjest: string;
  epost: string | null;
  telefon: string | null;
  antallGjester: number | null;
  beskjed: string | null;
  inn: string;
  ut: string;
  netter: number;
  kilde: string;
  status: string;
  /** venter | kommer | her | ferdig | avlyst */
  fase: "venter" | "kommer" | "her" | "ferdig" | "avlyst";
  /** Døgn til innsjekk (negativt = pågår/passert). */
  dagerTil: number;

  boligId: string;
  boligNavn: string;

  // Penger
  total: number | null;
  tjenestegebyr: number | null;
  depositum: number | null;
  restbelop: number | null;
  restBetalt: boolean;
  betalingsstatus: string | null;
  senUtsjekkBetalt: boolean;
  tidligInnsjekkBetalt: boolean;

  // Tilkomst
  adgangskode: string | null;
  gjestToken: string | null;
  lenkeSendt: boolean;
  lenkeSendtNar: string | null;

  // Rundt oppholdet
  meldinger: OppholdMelding[];
  vask: { id: string; dato: string; status: string } | null;
  anmeldelse: { rating: number; kommentar: string | null } | null;
  skader: { id: string; belop: number; status: string; beskrivelse: string | null }[];
};

/**
 * Samler ALT om ett opphold til én tråd: gjesten, pengene, tilkomsten,
 * samtalen, vasken etterpå, anmeldelsen og et eventuelt skadekrav.
 *
 * Dette fantes fra før — bare spredt over seks sider. Kun lesing; RLS scoper
 * til eierens egne bookinger, så et fremmed opphold gir null.
 */
export async function loadOpphold(
  supabase: SupabaseServer,
  bookingId: string,
): Promise<OppholdDetalj | null> {
  async function trygg<T>(q: PromiseLike<{ data: unknown }>): Promise<T[]> {
    try {
      const { data } = await q;
      return (data ?? []) as T[];
    } catch {
      return [];
    }
  }

  const rader = await trygg<{
    id: string;
    property_id: string;
    guest_name: string;
    guest_email: string | null;
    guest_phone: string | null;
    check_in: string;
    check_out: string;
    nights: number | null;
    num_guests: number | null;
    guest_message: string | null;
    source: string;
    status: string;
    total_price: number | null;
    service_fee: number | null;
    deposit_amount: number | null;
    remaining_amount: number | null;
    remaining_paid: boolean | null;
    payment_status: string | null;
    late_checkout_paid: boolean | null;
    early_checkin_paid: boolean | null;
    access_code: string | null;
    guest_token: string | null;
    guest_link_sent: boolean | null;
    guest_link_sent_at: string | null;
  }>(
    supabase
      .from("bookings")
      .select(
        "id,property_id,guest_name,guest_email,guest_phone,check_in,check_out,nights," +
          "num_guests,guest_message,source,status,total_price,service_fee,deposit_amount," +
          "remaining_amount,remaining_paid,payment_status,late_checkout_paid," +
          "early_checkin_paid,access_code,guest_token,guest_link_sent,guest_link_sent_at",
      )
      .eq("id", bookingId)
      .limit(1),
  );

  const b = rader[0];
  if (!b) return null;

  const [boliger, meldinger, vasker, anmeldelser, skader] = await Promise.all([
    trygg<{ id: string; name: string }>(
      supabase.from("properties").select("id,name").eq("id", b.property_id).limit(1),
    ),
    trygg<{
      id: string;
      direction: string;
      channel: string;
      body: string;
      created_at: string;
    }>(
      supabase
        .from("messages")
        .select("id,direction,channel,body,created_at")
        .eq("booking_id", b.id)
        .order("created_at"),
    ),
    trygg<{ id: string; task_date: string; status: string }>(
      supabase
        .from("cleaning_tasks")
        .select("id,task_date,status")
        .eq("booking_id", b.id)
        .limit(1),
    ),
    trygg<{ rating: number; comment: string | null }>(
      supabase
        .from("property_reviews")
        .select("rating,comment")
        .eq("booking_id", b.id)
        .limit(1),
    ),
    trygg<{
      id: string;
      amount: number;
      status: string;
      description: string | null;
    }>(
      supabase
        .from("incident_claims")
        .select("id,amount,status,description")
        .eq("booking_id", b.id)
        .order("created_at", { ascending: false }),
    ),
  ]);

  const idag = isoDate(new Date());
  const dagerTil = netterMellom(idag, b.check_in);
  const fase: OppholdDetalj["fase"] =
    b.status === "cancelled"
      ? "avlyst"
      : b.status === "requested"
        ? "venter"
        : b.check_out <= idag
          ? "ferdig"
          : b.check_in <= idag
            ? "her"
            : "kommer";

  return {
    id: b.id,
    gjest: b.guest_name,
    epost: b.guest_email,
    telefon: b.guest_phone,
    antallGjester: b.num_guests,
    beskjed: b.guest_message,
    inn: b.check_in,
    ut: b.check_out,
    netter: b.nights ?? netterMellom(b.check_in, b.check_out),
    kilde: b.source,
    status: b.status,
    fase,
    dagerTil,

    boligId: b.property_id,
    boligNavn: boliger[0]?.name ?? "Boligen",

    total: b.total_price == null ? null : Number(b.total_price),
    tjenestegebyr: b.service_fee == null ? null : Number(b.service_fee),
    depositum: b.deposit_amount == null ? null : Number(b.deposit_amount),
    restbelop: b.remaining_amount == null ? null : Number(b.remaining_amount),
    restBetalt: !!b.remaining_paid,
    betalingsstatus: b.payment_status,
    senUtsjekkBetalt: !!b.late_checkout_paid,
    tidligInnsjekkBetalt: !!b.early_checkin_paid,

    adgangskode: b.access_code,
    gjestToken: b.guest_token,
    lenkeSendt: !!b.guest_link_sent,
    lenkeSendtNar: b.guest_link_sent_at,

    meldinger: meldinger.map((m) => ({
      id: m.id,
      retning: m.direction === "incoming" ? "inn" : "ut",
      kanal: m.channel,
      tekst: m.body,
      nar: m.created_at,
    })),
    vask: vasker[0]
      ? { id: vasker[0].id, dato: vasker[0].task_date, status: vasker[0].status }
      : null,
    anmeldelse: anmeldelser[0]
      ? { rating: anmeldelser[0].rating, kommentar: anmeldelser[0].comment }
      : null,
    skader: skader.map((s) => ({
      id: s.id,
      belop: Number(s.amount),
      status: s.status,
      beskrivelse: s.description,
    })),
  };
}
