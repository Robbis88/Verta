import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Sparkles } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { getTravelGuide } from "@/lib/listing";
import { getNearbyPois, type Poi } from "@/lib/pois";
import { NearbyPois } from "@/components/public/nearby-pois";
import { PropertyMap } from "@/components/properties/property-map";
import { GuideChat } from "@/components/guide/guide-chat";
import { Button } from "@/components/ui/button";
import { formatNok } from "@/lib/utils";
import {
  resolveGuestLang,
  guestT,
  formatMoneyLang,
  nokSuffix,
} from "@/lib/guest-i18n";
import { translateOwnerContent } from "@/lib/translate";
import { LanguageSwitcher } from "@/components/guest/language-switcher";
import { RentForm } from "@/components/guide/rent-form";
import {
  contactHost,
  rentItem,
  subscribeFromGuide,
  requestService,
} from "./actions";

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
    lang?: string;
    sendt?: string;
    leid?: string;
    leiefeil?: string;
    nyhetsbrev?: string;
    tjeneste?: string;
    tjenestefeil?: string;
  }>;
}) {
  const { token } = await params;
  const { lang: langParam, sendt, leid, leiefeil, nyhetsbrev, tjeneste, tjenestefeil } =
    await searchParams;

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

  const h = await headers();
  const lang = resolveGuestLang(langParam, h.get("accept-language"));
  const t = guestT(lang);
  const money = (n: number) => formatMoneyLang(n, lang);

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

  const { data: serviceData } = await supabase
    .from("property_services")
    .select("id,name,kind,schedule_days,note")
    .eq("property_id", g.id)
    .eq("active", true)
    .order("created_at");
  const services = (serviceData ?? []) as {
    id: string;
    name: string;
    kind: string;
    schedule_days: string | null;
    note: string | null;
  }[];
  const scheduledServices = services.filter((s) => s.kind === "scheduled");
  const onDemandServices = services.filter((s) => s.kind !== "scheduled");

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

  // AI-oversett all eier-fritekst til gjestens språk (norsk = uendret, cachet).
  const trFields: Record<string, string | null> = {
    access_info: g.access_info,
    appliances_info: g.appliances_info,
    house_rules: g.house_rules,
    checkout_info: g.checkout_info,
    travel_guide: travelGuide,
  };
  for (const it of rentalItems) {
    trFields[`ritem:${it.id}:name`] = it.name;
    trFields[`ritem:${it.id}:desc`] = it.description;
  }
  for (const s of services) {
    trFields[`svc:${s.id}:name`] = s.name;
    trFields[`svc:${s.id}:note`] = s.note;
    trFields[`svc:${s.id}:days`] = s.schedule_days;
  }
  for (const l of localLinks) {
    trFields[`link:${l.id}:title`] = l.title;
    trFields[`link:${l.id}:desc`] = l.description;
  }
  const tr = await translateOwnerContent(g.id, lang, trFields);
  const T = (key: string, fallback: string | null) => tr[key] ?? fallback;

  const rentLabels = {
    days: t("numDays"),
    quantity: t("numQty"),
    name: t("yourName"),
    contact: t("rentContactOptional"),
    total: t("totalLabel"),
    submit: t("rentAndPay"),
    currencySuffix: nokSuffix(lang),
  };
  const chatLabels = {
    empty: t("chatEmpty"),
    placeholder: t("chatPlaceholder"),
    rateLimit: t("chatRateLimit"),
    error: t("chatError"),
  };

  return (
    <main className="min-h-screen bg-cloud">
      <header className="bg-navy px-6 py-10 text-center text-white">
        <p className="text-sm text-gold-light">{t("guideEyebrow")}</p>
        <h1 className="mt-1 text-2xl font-bold">{g.name}</h1>
        {g.address && <p className="mt-1 text-sm text-white/70">{g.address}</p>}
        <LanguageSwitcher current={lang} />
      </header>

      <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
        {/* AI-concierge */}
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gold">
            <Sparkles className="size-4" />
            {t("guideAsk")}
          </h2>
          <GuideChat token={token} labels={chatLabels} />
        </section>

        {(g.wifi_name || g.wifi_password) && (
          <Section title={t("wifi")}>
            {g.wifi_name && <Row label={t("network")} value={g.wifi_name} />}
            {g.wifi_password && (
              <Row label={t("password")} value={g.wifi_password} />
            )}
          </Section>
        )}

        {g.access_info && (
          <Section title={t("howToGetIn")}>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {T("access_info", g.access_info)}
            </p>
          </Section>
        )}

        {g.appliances_info && (
          <Section title={t("howItWorks")}>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {T("appliances_info", g.appliances_info)}
            </p>
          </Section>
        )}

        {g.house_rules && (
          <Section title={t("houseRules")}>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {T("house_rules", g.house_rules)}
            </p>
          </Section>
        )}

        {g.checkout_info && (
          <Section title={t("atCheckout")}>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {T("checkout_info", g.checkout_info)}
            </p>
          </Section>
        )}

        {travelGuide && (
          <Section title={t("tipsArea")}>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {T("travel_guide", travelGuide)}
            </p>
          </Section>
        )}

        {(pois.length > 0 || (g.lat != null && g.lng != null)) && (
          <Section title={t("nearby")}>
            {pois.length > 0 && (
              <div className="mb-4">
                <NearbyPois
                  pois={pois}
                  catLabels={{
                    Dagligvare: t("poiGrocery"),
                    Servering: t("poiDining"),
                    Lading: t("poiCharging"),
                    Utsikt: t("poiView"),
                  }}
                />
              </div>
            )}
            {g.lat != null && g.lng != null && (
              <PropertyMap lat={g.lat} lng={g.lng} />
            )}
          </Section>
        )}

        {services.length > 0 && (
          <Section title={t("services")}>
            {tjeneste && (
              <p className="text-sm text-emerald-700">{t("serviceSent")}</p>
            )}
            {tjenestefeil && (
              <p className="text-sm text-amber-700">{t("serviceError")}</p>
            )}

            {scheduledServices.map((s) => (
              <div
                key={s.id}
                className="border-t border-hairline pt-3 first:border-t-0 first:pt-0"
              >
                <p className="font-medium text-navy">
                  {T(`svc:${s.id}:name`, s.name)}
                </p>
                {s.schedule_days && (
                  <p className="text-sm text-gold">
                    {t("scheduledPrefix")}{" "}
                    {T(`svc:${s.id}:days`, s.schedule_days)}
                  </p>
                )}
                {s.note && (
                  <p className="mt-0.5 text-sm text-ink/60">
                    {T(`svc:${s.id}:note`, s.note)}
                  </p>
                )}
              </div>
            ))}

            {onDemandServices.map((s) => (
              <details
                key={s.id}
                className="border-t border-hairline pt-3 first:border-t-0 first:pt-0"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-2 font-medium text-navy">
                  <span>{T(`svc:${s.id}:name`, s.name)}</span>
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-normal text-gold">
                    {t("requestBadge")}
                  </span>
                </summary>
                {s.note && (
                  <p className="mt-1 text-sm text-ink/60">
                    {T(`svc:${s.id}:note`, s.note)}
                  </p>
                )}
                <form
                  action={requestService.bind(null, token)}
                  className="mt-2 flex flex-col gap-2"
                >
                  <input type="hidden" name="service_id" value={s.id} />
                  <input
                    name="guest_name"
                    required
                    placeholder={t("yourName")}
                    className="h-9 rounded-lg border border-hairline bg-white px-2 text-sm shadow-sm"
                  />
                  <input
                    name="desired_date"
                    placeholder={t("desiredDate")}
                    className="h-9 rounded-lg border border-hairline bg-white px-2 text-sm shadow-sm"
                  />
                  <input
                    name="guest_contact"
                    placeholder={t("contactOptional")}
                    className="h-9 rounded-lg border border-hairline bg-white px-2 text-sm shadow-sm"
                  />
                  <textarea
                    name="message"
                    rows={2}
                    placeholder={t("shortDesc")}
                    className="rounded-lg border border-hairline bg-white px-2 py-1.5 text-sm shadow-sm"
                  />
                  <Button type="submit" size="sm" className="self-start">
                    {t("sendRequest")}
                  </Button>
                </form>
              </details>
            ))}
          </Section>
        )}

        {localLinks.length > 0 && (
          <Section title={t("localDelivery")}>
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
                      {T(`link:${l.id}:title`, l.title)}
                    </span>
                    {l.description && (
                      <span className="block truncate text-xs text-ink/60">
                        {T(`link:${l.id}:desc`, l.description)}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-gold">→</span>
                </a>
              ))}
            </div>
            {/* JURIDISK: praktisk ansvarsfraskrivelse — bør gjennomgås av jurist. */}
            <p className="mt-3 text-xs text-ink/50">{t("deliveryDisclaimer")}</p>
          </Section>
        )}

        {rentalItems.length > 0 && (
          <Section title={t("rentEquipment")}>
            {leid && (
              <p className="text-sm text-emerald-700">{t("rentSuccess")}</p>
            )}
            {leiefeil && (
              <p className="text-sm text-amber-700">{t("rentError")}</p>
            )}
            {rentalItems.map((it) => (
              <div
                key={it.id}
                className="border-t border-hairline pt-3 first:border-t-0 first:pt-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-navy">
                    {T(`ritem:${it.id}:name`, it.name)}
                  </span>
                  <span className="whitespace-nowrap text-right text-sm font-semibold text-gold">
                    {money(Number(it.price))}
                    {t("perNight")}
                    {it.price_extra_day != null && (
                      <span className="block text-xs font-normal text-ink/50">
                        +{formatNok(Number(it.price_extra_day))}{" "}
                        {t("perExtraDay")}
                      </span>
                    )}
                  </span>
                </div>
                {it.description && (
                  <p className="mt-0.5 text-sm text-ink/60">
                    {T(`ritem:${it.id}:desc`, it.description)}
                  </p>
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
                  labels={rentLabels}
                />
              </div>
            ))}
          </Section>
        )}

        {/* Kontakt verten (eskalering) */}
        <Section title={t("contactHostTitle")}>
          {sendt ? (
            <p className="text-sm text-emerald-700">{t("contactSent")}</p>
          ) : (
            <form
              action={contactHost.bind(null, token)}
              className="flex flex-col gap-3"
            >
              <p className="text-sm text-ink/70">{t("contactPrompt")}</p>
              <textarea
                name="message"
                required
                rows={3}
                placeholder={t("contactMsgPlaceholder")}
                className="rounded-lg border border-hairline bg-white px-3 py-2 text-sm shadow-sm"
              />
              <input
                name="contact"
                placeholder={t("contactReplyPlaceholder")}
                className="h-10 rounded-lg border border-hairline bg-white px-3 text-sm shadow-sm"
              />
              <Button type="submit">{t("sendToHost")}</Button>
            </form>
          )}
        </Section>

        <Section title={t("stayUpdated")}>
          {nyhetsbrev ? (
            <p className="text-sm text-emerald-700">{t("newsletterThanks")}</p>
          ) : (
            <form
              action={subscribeFromGuide.bind(null, token)}
              className="flex flex-col gap-2"
            >
              <p className="text-sm text-ink/70">{t("newsletterPrompt")}</p>
              <input
                name="name"
                placeholder={t("namePlaceholder")}
                className="h-9 rounded-lg border border-hairline bg-white px-2 text-sm shadow-sm"
              />
              <input
                name="email"
                type="email"
                required
                placeholder={t("emailPlaceholder")}
                className="h-9 rounded-lg border border-hairline bg-white px-2 text-sm shadow-sm"
              />
              <label className="flex items-start gap-2 text-xs text-ink/60">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  className="mt-0.5 h-4 w-4"
                />
                <span>{t("newsletterConsent")}</span>
              </label>
              <Button type="submit" size="sm" className="self-start">
                {t("subscribe")}
              </Button>
            </form>
          )}
        </Section>

        <p className="mt-2 text-center text-xs text-ink/50">{t("poweredBy")}</p>
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
