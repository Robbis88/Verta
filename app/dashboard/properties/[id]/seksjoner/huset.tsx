import { Felt, feltKlasse, Flate, Handling, Kort, Velg } from "@/components/hus";
import {
  addKey,
  updateKeyHolder,
  deleteKey,
  addContact,
  deleteContact,
  addLocalLink,
  deleteLocalLink,
} from "../../actions";

/**
 * Nøkler, kontakter og lokale lenker — modul 9. Seksjon av eiendomssiden, kun
 * presentasjon. Alle feltnavn og actions er uendret.
 */

export type Nokkel = {
  id: string;
  label: string;
  key_type: string;
  copies: number;
  holder: string | null;
  notes: string | null;
  updated_at: string;
};

export type Kontakt = {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export type LokalLenke = {
  id: string;
  title: string;
  url: string;
  description: string | null;
};

const KEY_TYPE_LABELS: Record<string, string> = {
  fysisk: "Fysisk nøkkel",
  nokkelboks: "Nøkkelboks",
  kort: "Kort",
  brikke: "Brikke",
  kode: "Kode",
  annet: "Annet",
};

const KEY_TYPE_VALG = [
  { verdi: "fysisk", tekst: "Fysisk nøkkel" },
  { verdi: "nokkelboks", tekst: "Nøkkelboks" },
  { verdi: "kort", tekst: "Kort" },
  { verdi: "brikke", tekst: "Brikke" },
  { verdi: "kode", tekst: "Kode" },
  { verdi: "annet", tekst: "Annet" },
];

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

export function Huset({
  propertyId,
  keys,
  contacts,
  localLinks,
}: {
  propertyId: string;
  keys: Nokkel[];
  contacts: Kontakt[];
  localLinks: LokalLenke[];
}) {
  return (
    <>
      <Flate
        tittel="Nøkkelknippet"
        hva="Hvem har hvilken nøkkel akkurat nå? Kun synlig for deg."
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-hus-dempet">
            Nøkler vandrer — til vaskeren, til naboen, til håndverkeren — og det
            er alltid den ene du ikke finner. Her står det.
          </p>

          {keys.length > 0 && (
            <ul className="flex flex-col gap-2">
              {keys.map((k) => (
                <li key={k.id}>
                  <Kort>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm text-hus-blekk">
                            {k.label}
                            <span className="text-hus-svak">
                              {" "}
                              · {KEY_TYPE_LABELS[k.key_type] ?? k.key_type}
                              {k.copies > 1 && ` · ${k.copies} stk`}
                            </span>
                          </p>
                          <p
                            className={
                              k.holder
                                ? "mt-1 text-xs text-hus-dempet"
                                : "mt-1 text-xs text-hus-obs"
                            }
                          >
                            {k.holder
                              ? `Hos ${k.holder}`
                              : "Ingen vet hvor denne er"}
                          </p>
                          {k.notes && (
                            <p className="mt-1 text-xs text-hus-svak">
                              {k.notes}
                            </p>
                          )}
                        </div>
                        <form action={deleteKey}>
                          <input type="hidden" name="id" value={k.id} />
                          <input
                            type="hidden"
                            name="property_id"
                            value={propertyId}
                          />
                          <Handling type="submit" vekt="naken">
                            Fjern
                          </Handling>
                        </form>
                      </div>

                      <form
                        action={updateKeyHolder}
                        className="flex flex-wrap items-end gap-3"
                      >
                        <input type="hidden" name="id" value={k.id} />
                        <input
                          type="hidden"
                          name="property_id"
                          value={propertyId}
                        />
                        {/* Rått felt her fordi id-en må være unik per nøkkel,
                            mens name må forbli «holder» for actionen. */}
                        <div className="flex min-w-48 flex-1 flex-col gap-2">
                          <label
                            htmlFor={`holder-${k.id}`}
                            className="text-[11px] font-medium uppercase tracking-[0.14em] text-hus-svak"
                          >
                            Hvem har den nå?
                          </label>
                          <input
                            id={`holder-${k.id}`}
                            name="holder"
                            defaultValue={k.holder ?? ""}
                            placeholder="Maria, nøkkelboks, naboen"
                            className={feltKlasse}
                          />
                        </div>
                        <Handling type="submit" vekt="stille">
                          Flytt
                        </Handling>
                      </form>
                    </div>
                  </Kort>
                </li>
              ))}
            </ul>
          )}

          <form action={addKey} className="flex flex-col gap-4">
            <input type="hidden" name="property_id" value={propertyId} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Felt
                navn="label"
                merke="Nøkkel"
                required
                placeholder="Hovednøkkel, Bod, Reserve"
              />
              <Velg
                navn="key_type"
                merke="Type"
                defaultValue="fysisk"
                valg={KEY_TYPE_VALG}
              />
              <Felt
                navn="copies"
                merke="Antall"
                type="number"
                min={1}
                defaultValue={1}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Felt
                navn="holder"
                merke="Hvem har den nå?"
                placeholder="Maria, nøkkelboks, naboen"
              />
              <Felt
                navn="notes"
                merke="Notat (valgfritt)"
                placeholder="F.eks. «Merket med rød tape»"
              />
            </div>
            <div>
              <Handling type="submit" vekt="gull">
                Legg til
              </Handling>
            </div>
          </form>
        </div>
      </Flate>

      <Flate
        tittel="Faste kontakter"
        hva="Dine folk — snekker, rørlegger, vaktmester, brøyting. Kun synlig for deg."
      >
        <div className="flex flex-col gap-4">
          {contacts.length > 0 && (
            <ul className="flex flex-col gap-2">
              {contacts.map((c) => {
                const wa = c.phone
                  ? c.phone.replace(/[^\d]/g, "").replace(/^00/, "")
                  : "";
                return (
                  <li key={c.id}>
                    <Kort>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-hus-blekk">
                              {c.name}
                              {c.role && (
                                <span className="text-hus-svak"> · {c.role}</span>
                              )}
                            </p>
                            {c.notes && (
                              <p className="mt-1 text-xs text-hus-dempet">
                                {c.notes}
                              </p>
                            )}
                          </div>
                          <form action={deleteContact}>
                            <input type="hidden" name="id" value={c.id} />
                            <input
                              type="hidden"
                              name="property_id"
                              value={propertyId}
                            />
                            <Handling type="submit" vekt="naken">
                              Fjern
                            </Handling>
                          </form>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {c.phone && (
                            <Snarvei href={`tel:${c.phone}`}>Ring</Snarvei>
                          )}
                          {c.phone && (
                            <Snarvei href={`sms:${c.phone}`}>SMS</Snarvei>
                          )}
                          {wa && (
                            <Snarvei href={`https://wa.me/${wa}`} nyFane>
                              WhatsApp
                            </Snarvei>
                          )}
                          {c.email && (
                            <Snarvei href={`mailto:${c.email}`}>E-post</Snarvei>
                          )}
                        </div>
                      </div>
                    </Kort>
                  </li>
                );
              })}
            </ul>
          )}

          <form action={addContact} className="flex flex-col gap-4">
            <input type="hidden" name="property_id" value={propertyId} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Felt navn="name" merke="Navn" required placeholder="Ola Hansen" />
              <Felt navn="role" merke="Rolle" placeholder="Brøyting" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Felt navn="phone" merke="Telefon" placeholder="+47 …" />
              <Felt
                navn="email"
                merke="E-post (valgfritt)"
                type="email"
                placeholder="ola@eksempel.no"
              />
            </div>
            <Felt
              navn="notes"
              merke="Notat"
              placeholder="F.eks. «Ring før 20:00»"
            />
            <p className="text-xs text-hus-svak">
              For WhatsApp: skriv nummeret med landskode (+47), så virker
              WhatsApp-knappen.
            </p>
            <div>
              <Handling type="submit" vekt="gull">
                Legg til kontakt
              </Handling>
            </div>
          </form>
        </div>
      </Flate>

      <Flate
        tittel="Lokale lenker"
        hva="Vises i gjesteguiden — matlevering, nærbutikk, lokal utleie."
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-hus-dempet">
            Praktisk for gjestene, mindre spørsmål til deg.
          </p>

          {localLinks.length > 0 && (
            <ul className="flex flex-col gap-2">
              {localLinks.map((l) => (
                <li key={l.id}>
                  <Kort>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-sm text-hus-gull-lys underline"
                        >
                          {l.title}
                        </a>
                        {l.description && (
                          <p className="truncate text-xs text-hus-svak">
                            {l.description}
                          </p>
                        )}
                      </div>
                      <form action={deleteLocalLink}>
                        <input type="hidden" name="id" value={l.id} />
                        <input
                          type="hidden"
                          name="property_id"
                          value={propertyId}
                        />
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

          <form action={addLocalLink} className="flex flex-col gap-4">
            <input type="hidden" name="property_id" value={propertyId} />
            <Felt
              navn="title"
              merke="Tittel"
              required
              placeholder="Meny hjemlevering"
            />
            <Felt navn="url" merke="Lenke" required placeholder="meny.no" />
            <Felt
              navn="description"
              merke="Kort beskrivelse (valgfritt)"
              placeholder="Leverer til døra innen to timer"
            />
            <div>
              <Handling type="submit" vekt="gull">
                Legg til lenke
              </Handling>
            </div>
          </form>
        </div>
      </Flate>
    </>
  );
}
