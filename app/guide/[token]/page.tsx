import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { getTravelGuide } from "@/lib/listing";
import { getNearbyPois, type Poi } from "@/lib/pois";
import { NearbyPois } from "@/components/public/nearby-pois";
import { PropertyMap } from "@/components/properties/property-map";
import { GuideChat } from "@/components/guide/guide-chat";
import { Button } from "@/components/ui/button";
import { formatNok } from "@/lib/utils";
import { RentForm } from "@/components/guide/rent-form";
import { contactHost, rentItem, subscribeFromGuide } from "./actions";

export const metadata: Metadata = { title: "Gjesteguide — Verta" };

type Guide = {
  id: string;
  name: string;
  address: string | null;
  wifi_name: string | null;
  wifi_password: string | null;
  access_info: string | null;
  appliances_info: string | null;
  house_rules: string | null;
  checkout_info: string | null;
  lat: number | null;
  lng: number | null;
  travel_guide: string | null;
  nearby_pois: Poi[] | null;
};

export default async function GuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{
    sendt?: string;
    leid?: string;
    leiefeil?: string;
    nyhetsbrev?: string;
  }>;
}) {
  const { token } = await params;
  const { sendt, leid, leiefeil, nyhetsbrev } = await searchParams;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("properties")
    .select(
      "id,name,address,wifi_name,wifi_password,access_info,appliances_info,house_rules,checkout_info,lat,lng,travel_guide,nearby_pois",
    )
    .eq("guide_token", token)
    .maybeSingle();
  if (!data) notFound();
  const g = data as Guide;

  const { data: itemsData } = await supabase
    .from("rental_items")
    .select("id,name,description,price,price_extra_day")
    .eq("property_id", g.id)
    .eq("active", true)
    .order("created_at");
  const rentalItems = (itemsData ?? []) as {
    id: string;
    name: string;
    description: string | null;
    price: number;
    price_extra_day: number | null;
  }[];

  const { data: linkData } = await supabase
    .from("local_links")
    .select("id,title,url,description")
    .eq("property_id", g.id)
    .order("created_at");
  const localLinks = (linkData ?? []) as {
    id: string;
    title: string;
    url: string;
    description: string | null;
  }[];

  const [travelGuide, pois] = await Promise.all([
    getTravelGuide({
      id: g.id,
      name: g.name,
      address: g.address,
      travel_guide: g.travel_guide,
    }),
    getNearbyPois({
      id: g.id,
      lat: g.lat,
      lng: g.lng,
      nearby_pois: g.nearby_pois,
    }),
  ]);

  return (
    <main className="min-h-screen bg-cloud">
      <header className="bg-navy px-6 py-10 text-center text-white">
        <p className="text-sm text-gold-light">Gjesteguide</p>
        <h1 className="mt-1 text-2xl font-bold">{g.name}</h1>
        {g.address && <p className="mt-1 text-sm text-white/70">{g.address}</p>}
      </header>

      <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
        {/* AI-concierge */}
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gold">
            <Sparkles className="size-4" />
            Spør om hva som helst
          </h2>
          <GuideChat token={token} />
        </section>

        {(g.wifi_name || g.wifi_password) && (
          <Section title="WiFi">
            {g.wifi_name && <Row label="Nettverk" value={g.wifi_name} />}
            {g.wifi_password && <Row label="Passord" value={g.wifi_password} />}
          </Section>
        )}

        {g.access_info && (
          <Section title="Slik kommer du inn">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {g.access_info}
            </p>
          </Section>
        )}

        {g.appliances_info && (
          <Section title="Slik funker det">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {g.appliances_info}
            </p>
          </Section>
        )}

        {g.house_rules && (
          <Section title="Husregler">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {g.house_rules}
            </p>
          </Section>
        )}

        {g.checkout_info && (
          <Section title="Ved utsjekk">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {g.checkout_info}
            </p>
          </Section>
        )}

        {travelGuide && (
          <Section title="Tips i området">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {travelGuide}
            </p>
          </Section>
        )}

        {(pois.length > 0 || (g.lat != null && g.lng != null)) && (
          <Section title="I nærheten">
            {pois.length > 0 && (
              <div className="mb-4">
                <NearbyPois pois={pois} />
              </div>
            )}
            {g.lat != null && g.lng != null && (
              <PropertyMap lat={g.lat} lng={g.lng} />
            )}
          </Section>
        )}

        {localLinks.length > 0 && (
          <Section title="Lokalt & levering">
            <div className="flex flex-col gap-2">
              {localLinks.map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg border border-hairline px-3 py-2.5 transition hover:border-gold/50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-navy">
                      {l.title}
                    </span>
                    {l.description && (
                      <span className="block truncate text-xs text-ink/60">
                        {l.description}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-gold">→</span>
                </a>
              ))}
            </div>
            {/* JURIDISK: praktisk ansvarsfraskrivelse — bør gjennomgås av jurist. */}
            <p className="mt-3 text-xs text-ink/50">
              Bestiller du levering (f.eks. matvarer), husk at varer kan bli satt
              igjen ved døren dersom du ikke er der ved leveringen — f.eks. ved
              forsinket fly, buss eller tog. Verten og Verta har ikke ansvar for
              varer som blir stående. Levering skjer på eget ansvar.
            </p>
          </Section>
        )}

        {rentalItems.length > 0 && (
          <Section title="Lei utstyr">
            {leid && (
              <p className="text-sm text-emerald-700">
                Takk! Utstyret er leid. Verten er varslet. 🎉
              </p>
            )}
            {leiefeil && (
              <p className="text-sm text-amber-700">
                Beklager, leien kunne ikke fullføres. Prøv igjen, eller kontakt
                verten.
              </p>
            )}
            {rentalItems.map((it) => (
              <div
                key={it.id}
                className="border-t border-hairline pt-3 first:border-t-0 first:pt-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-navy">{it.name}</span>
                  <span className="whitespace-nowrap text-right text-sm font-semibold text-gold">
                    {formatNok(Number(it.price))}/døgn
                    {it.price_extra_day != null && (
                      <span className="block text-xs font-normal text-ink/50">
                        +{formatNok(Number(it.price_extra_day))} per ekstra døgn
                      </span>
                    )}
                  </span>
                </div>
                {it.description && (
                  <p className="mt-0.5 text-sm text-ink/60">{it.description}</p>
                )}
                <RentForm
                  item={{
                    id: it.id,
                    name: it.name,
                    price: Number(it.price),
                    priceExtraDay:
                      it.price_extra_day != null
                        ? Number(it.price_extra_day)
                        : null,
                  }}
                  action={rentItem.bind(null, token)}
                />
              </div>
            ))}
          </Section>
        )}

        {/* Kontakt verten (eskalering) */}
        <Section title="Kontakt verten">
          {sendt ? (
            <p className="text-sm text-emerald-700">
              Meldingen er sendt til verten. Du får svar så snart som mulig. ✅
            </p>
          ) : (
            <form
              action={contactHost.bind(null, token)}
              className="flex flex-col gap-3"
            >
              <p className="text-sm text-ink/70">
                Får du ikke hjelp av assistenten over? Send verten en melding.
              </p>
              <textarea
                name="message"
                required
                rows={3}
                placeholder="F.eks: Varmepumpen virker ikke selv om jeg har prøvd alt."
                className="rounded-lg border border-hairline bg-white px-3 py-2 text-sm shadow-sm"
              />
              <input
                name="contact"
                placeholder="Din e-post eller telefon (så verten kan svare)"
                className="h-10 rounded-lg border border-hairline bg-white px-3 text-sm shadow-sm"
              />
              <Button type="submit">Send til verten</Button>
            </form>
          )}
        </Section>

        <Section title="Hold deg oppdatert">
          {nyhetsbrev ? (
            <p className="text-sm text-emerald-700">
              Takk! Du er meldt på. Du kan melde deg av når som helst via lenken i
              e-posten. ✅
            </p>
          ) : (
            <form
              action={subscribeFromGuide.bind(null, token)}
              className="flex flex-col gap-2"
            >
              <p className="text-sm text-ink/70">
                Få tips og tilbud fra Verta på e-post. Meld deg av når som helst.
              </p>
              <input
                name="name"
                placeholder="Navn (valgfritt)"
                className="h-9 rounded-lg border border-hairline bg-white px-2 text-sm shadow-sm"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Din e-post"
                className="h-9 rounded-lg border border-hairline bg-white px-2 text-sm shadow-sm"
              />
              <label className="flex items-start gap-2 text-xs text-ink/60">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  Ja, Verta kan sende meg nyhetsbrev på e-post. Jeg kan melde meg
                  av når som helst.
                </span>
              </label>
              <Button type="submit" size="sm" className="self-start">
                Meld meg på
              </Button>
            </form>
          )}
        </Section>

        <p className="mt-2 text-center text-xs text-ink/50">Levert av Verta</p>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-hairline bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-ink/60">{label}</span>
      <span className="text-right font-medium text-navy">{value}</span>
    </div>
  );
}
