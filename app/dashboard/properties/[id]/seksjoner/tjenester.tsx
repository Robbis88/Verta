import { Felt, Flate, Handling, Kort, Merke, Velg } from "@/components/hus";
import {
  addService,
  deleteService,
  setServiceRequestStatus,
} from "../../actions";

/**
 * Tjenester — modul 9. Seksjon av eiendomssiden, kun presentasjon. Både
 * videresendingslenkene (WhatsApp/SMS/e-post) og actionene er uendret.
 */

export type Tjeneste = {
  id: string;
  name: string;
  kind: string;
  schedule_days: string | null;
  provider_name: string | null;
  provider_phone: string | null;
  provider_email: string | null;
  note: string | null;
};

export type Foresporsel = {
  id: string;
  service_id: string | null;
  service_name: string;
  guest_name: string;
  guest_contact: string | null;
  desired_date: string | null;
  message: string | null;
};

/** Liten kontaktlenke — samme uttrykk som «naken» handling. */
function Snarvei({
  href,
  nyFane = false,
  children,
}: {
  href: string;
  nyFane?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={nyFane ? "_blank" : undefined}
      rel={nyFane ? "noopener noreferrer" : undefined}
      className="inline-flex items-center rounded-full border border-hus-linje px-3 py-1 text-xs text-hus-dempet no-underline transition-colors hover:border-hus-linje-sterk hover:text-hus-blekk"
    >
      {children}
    </a>
  );
}

export function Tjenester({
  propertyId,
  propertyName,
  propertyAddress,
  services,
  serviceById,
  serviceRequests,
}: {
  propertyId: string;
  propertyName: string;
  propertyAddress: string | null;
  services: Tjeneste[];
  serviceById: Map<string, Tjeneste>;
  serviceRequests: Foresporsel[];
}) {
  return (
    <>
      {serviceRequests.length > 0 && (
        <Flate
          tittel="Tjeneste-forespørsler"
          hva="Gjester har bedt om disse. Videresend til leverandøren med ett trykk."
        >
          <div className="flex flex-col gap-3">
            {serviceRequests.map((r) => {
              const svc = r.service_id ? serviceById.get(r.service_id) : null;
              const wa = svc?.provider_phone
                ? svc.provider_phone.replace(/[^\d]/g, "").replace(/^00/, "")
                : "";
              const msg = encodeURIComponent(
                `Hei! ${r.service_name} ønskes på ${propertyName}${
                  propertyAddress ? `, ${propertyAddress}` : ""
                }${r.desired_date ? `. Ønsket: ${r.desired_date}` : ""}.`,
              );
              return (
                <Kort key={r.id}>
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm text-hus-blekk">
                        {r.service_name}
                        <span className="text-hus-svak"> · {r.guest_name}</span>
                      </p>
                      {r.desired_date && (
                        <p className="mt-1 text-xs text-hus-svak">
                          Ønsket: {r.desired_date}
                        </p>
                      )}
                      {r.message && (
                        <p className="mt-1 text-xs text-hus-dempet">
                          «{r.message}»
                        </p>
                      )}
                      {r.guest_contact && (
                        <p className="mt-1 text-xs text-hus-svak">
                          Gjest: {r.guest_contact}
                        </p>
                      )}
                    </div>

                    {svc && (svc.provider_phone || svc.provider_email) && (
                      <div className="flex flex-wrap gap-2">
                        {wa && (
                          <Snarvei href={`https://wa.me/${wa}?text=${msg}`} nyFane>
                            WhatsApp {svc.provider_name ?? "leverandør"}
                          </Snarvei>
                        )}
                        {svc.provider_phone && (
                          <Snarvei href={`sms:${svc.provider_phone}?&body=${msg}`}>
                            SMS
                          </Snarvei>
                        )}
                        {svc.provider_email && (
                          <Snarvei
                            href={`mailto:${svc.provider_email}?subject=${encodeURIComponent(
                              r.service_name,
                            )}&body=${msg}`}
                          >
                            E-post
                          </Snarvei>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <form action={setServiceRequestStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="property_id" value={propertyId} />
                        <input type="hidden" name="status" value="handled" />
                        <Handling type="submit" vekt="gull">
                          Markér håndtert
                        </Handling>
                      </form>
                      <form action={setServiceRequestStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="property_id" value={propertyId} />
                        <input type="hidden" name="status" value="declined" />
                        <Handling type="submit" vekt="stille">
                          Avslå
                        </Handling>
                      </form>
                    </div>
                  </div>
                </Kort>
              );
            })}
          </div>
        </Flate>
      )}

      <Flate
        tittel="Tjenester"
        hva="Pool-rensing, badstamp, brøyting, vask underveis."
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-hus-dempet">
            Faste tjenester får AI-en til å svare gjestene med tidsplanen.
            På-bestilling-tjenester lar gjesten be om hjelp — du videresender til
            leverandøren med ett trykk.
          </p>

          {services.length > 0 && (
            <ul className="flex flex-col gap-2">
              {services.map((s) => (
                <li key={s.id}>
                  <Kort>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm text-hus-blekk">
                          {s.name}
                          <Merke tone={s.kind === "scheduled" ? "gull" : "ro"}>
                            {s.kind === "scheduled" ? "Fast" : "På bestilling"}
                          </Merke>
                        </p>
                        {s.kind === "scheduled" && s.schedule_days && (
                          <p className="mt-1 text-xs text-hus-gull-lys">
                            {s.schedule_days}
                          </p>
                        )}
                        {(s.provider_name || s.provider_phone) && (
                          <p className="mt-1 text-xs text-hus-svak">
                            {[s.provider_name, s.provider_phone]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                      <form action={deleteService}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="property_id" value={propertyId} />
                        <Handling type="submit" vekt="naken">
                          Fjern
                        </Handling>
                      </form>
                    </div>
                  </Kort>
                </li>
              ))}
            </ul>
          )}

          <form action={addService} className="flex flex-col gap-4">
            <input type="hidden" name="property_id" value={propertyId} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Felt
                navn="name"
                merke="Navn"
                required
                placeholder="Pool-rensing"
              />
              <Velg
                navn="kind"
                merke="Type"
                defaultValue="on_demand"
                valg={[
                  { verdi: "on_demand", tekst: "På bestilling" },
                  { verdi: "scheduled", tekst: "Fast tidsplan" },
                ]}
              />
            </div>
            <Felt
              navn="schedule_days"
              merke="Faste dager (kun for fast)"
              placeholder="Onsdag, Fredag"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Felt
                navn="provider_name"
                merke="Leverandør"
                placeholder="Navn"
              />
              <Felt
                navn="provider_phone"
                merke="Telefon"
                placeholder="+47 …"
              />
            </div>
            <Felt
              navn="provider_email"
              merke="Leverandør e-post"
              type="email"
              placeholder="Auto-varsel ved forespørsel"
            />
            <Felt
              navn="note"
              merke="Notat vist til gjest (valgfritt)"
              placeholder="F.eks. «Bestilles senest dagen før»"
            />
            <div>
              <Handling type="submit" vekt="gull">
                Legg til tjeneste
              </Handling>
            </div>
          </form>
        </div>
      </Flate>
    </>
  );
}
