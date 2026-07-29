import { formatNok } from "@/lib/utils";
import {
  Felt,
  Flate,
  Handling,
  Kort,
  Merke,
  Velg,
} from "@/components/hus";
import {
  addEquipment,
  deleteEquipment,
  addRentalItem,
  deleteRentalItem,
  refundRentalOrder,
} from "../../actions";

/**
 * Utstyr og utleie — modul 9. Seksjon av eiendomssiden, kun presentasjon.
 * Alle feltnavn er uendret, så actionene ser samme FormData som før.
 */

export type Utstyr = {
  id: string;
  name: string;
  category: string | null;
  location: string | null;
  brand: string | null;
  model: string | null;
  warranty_until: string | null;
  notes: string | null;
};

export type Leieting = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  price_extra_day: number | null;
  quantity: number;
};

export type Leieordre = {
  id: string;
  guest_name: string;
  quantity: number;
  days: number;
  amount: number;
  status: string;
};

const KATEGORIER = [
  { verdi: "", tekst: "Kategori …" },
  { verdi: "TV", tekst: "TV" },
  { verdi: "Kjøkken", tekst: "Kjøkken" },
  { verdi: "Klima", tekst: "Klima (AC/varmepumpe)" },
  { verdi: "Vaskemaskin", tekst: "Vaskemaskin" },
  { verdi: "Underholdning", tekst: "Underholdning" },
  { verdi: "Oppvarming", tekst: "Oppvarming" },
  { verdi: "Annet", tekst: "Annet" },
];

/** Fjern-knapp som går igjen i alle listene her. */
function Fjern({
  action,
  id,
  propertyId,
  tekst = "Fjern",
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  propertyId: string;
  tekst?: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="property_id" value={propertyId} />
      <Handling type="submit" vekt="naken">
        {tekst}
      </Handling>
    </form>
  );
}

export function Inventar({
  propertyId,
  equipment,
  todayIso,
  rentalItems,
  rentalOrders,
}: {
  propertyId: string;
  equipment: Utstyr[];
  todayIso: string;
  rentalItems: Leieting[];
  rentalOrders: Leieordre[];
}) {
  return (
    <>
      <Flate
        tittel="Utstyrs-liste"
        hva="Hva som finnes i boligen, hvor det er, og hvordan det brukes."
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-hus-dempet">
            Da kan AI-assistenten i gjesteguiden forklare gjestene hvordan hver
            ting brukes — også på deres eget språk. Begynn med det viktigste: TV,
            AC, kaffemaskin, vaskemaskin.
          </p>

          {equipment.length > 0 && (
            <ul className="flex flex-col gap-2">
              {equipment.map((e) => (
                <li key={e.id}>
                  <Kort>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm text-hus-blekk">
                          <span>
                            {e.name}
                            {e.location && (
                              <span className="text-hus-svak"> · {e.location}</span>
                            )}
                          </span>
                          {e.warranty_until && e.warranty_until >= todayIso && (
                            <Merke tone="god">Garanti</Merke>
                          )}
                        </p>
                        {(e.brand || e.model) && (
                          <p className="mt-1 text-xs text-hus-svak">
                            {[e.brand, e.model].filter(Boolean).join(" ")}
                          </p>
                        )}
                        {e.notes && (
                          <p className="mt-1 text-xs text-hus-dempet">{e.notes}</p>
                        )}
                      </div>
                      <Fjern
                        action={deleteEquipment}
                        id={e.id}
                        propertyId={propertyId}
                      />
                    </div>
                  </Kort>
                </li>
              ))}
            </ul>
          )}

          <form action={addEquipment} className="flex flex-col gap-4">
            <input type="hidden" name="property_id" value={propertyId} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Felt
                navn="name"
                merke="Navn"
                required
                placeholder="F.eks. TV i stuen"
              />
              <Velg
                navn="category"
                merke="Kategori"
                defaultValue=""
                valg={KATEGORIER}
              />
              <Felt navn="location" merke="Sted" placeholder="F.eks. Stue" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Felt navn="brand" merke="Merke" placeholder="Samsung" />
              <Felt navn="model" merke="Modell" placeholder="UE55TU8000" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Felt navn="purchased_at" merke="Kjøpt" type="date" />
              <Felt navn="warranty_until" merke="Garanti til" type="date" />
            </div>
            <Felt
              navn="notes"
              merke="Notater"
              placeholder="F.eks. «Fjernkontroll i skuffen», «Filter byttes hver 6. mnd»"
            />
            <div>
              <Handling type="submit" vekt="gull">
                Legg til utstyr
              </Handling>
            </div>
          </form>
        </div>
      </Flate>

      <Flate
        tittel="Utleie av utstyr"
        hva="Sykler, ski og kajakk gjestene kan leie og betale for i gjesteguiden."
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-hus-dempet">
            Legg dem ut med døgnpris, så velger gjestene antall døgn og betaler
            rett i gjesteguiden. Verta beholder 10 % — resten går til deg.
          </p>

          {rentalItems.length > 0 && (
            <ul className="flex flex-col gap-2">
              {rentalItems.map((it) => (
                <li key={it.id}>
                  <Kort>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-hus-blekk">
                          {it.name}
                        </p>
                        {it.description && (
                          <p className="truncate text-xs text-hus-svak">
                            {it.description}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="whitespace-nowrap text-right text-sm tabular-nums text-hus-gull-lys">
                          {formatNok(Number(it.price))}/døgn
                          {it.price_extra_day != null && (
                            <span className="block text-xs text-hus-svak">
                              +{formatNok(Number(it.price_extra_day))} per ekstra
                              døgn
                            </span>
                          )}
                        </span>
                        <Fjern
                          action={deleteRentalItem}
                          id={it.id}
                          propertyId={propertyId}
                        />
                      </div>
                    </div>
                  </Kort>
                </li>
              ))}
            </ul>
          )}

          <form action={addRentalItem} className="flex flex-col gap-4">
            <input type="hidden" name="property_id" value={propertyId} />
            <Felt
              navn="name"
              merke="Navn"
              required
              placeholder="F.eks. Slalåmski"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Felt
                navn="price"
                merke="Pris per døgn (kr, minst 25)"
                type="number"
                min={25}
                step="1"
                required
                placeholder="100"
              />
              <Felt
                navn="price_extra_day"
                merke="Pris per ekstra døgn (valgfritt)"
                type="number"
                min={0}
                step="1"
                placeholder="70"
              />
            </div>
            <Felt
              navn="description"
              merke="Kort beskrivelse (valgfritt)"
              placeholder="Str. 150–170, hjelmer følger med"
            />
            <div>
              <Handling type="submit" vekt="gull">
                Legg til utstyr
              </Handling>
            </div>
          </form>

          {rentalOrders.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-hus-linje pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-hus-svak">
                Betalte leier
              </p>
              <ul className="flex flex-col gap-2">
                {rentalOrders.map((o) => (
                  <li key={o.id}>
                    <Kort>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-hus-blekk">
                            {o.guest_name}
                          </p>
                          <p className="text-xs tabular-nums text-hus-svak">
                            {o.quantity} stk · {o.days} døgn ·{" "}
                            {formatNok(Number(o.amount))}
                          </p>
                        </div>
                        {o.status === "refunded" ? (
                          <Merke>Refundert</Merke>
                        ) : (
                          <Fjern
                            action={refundRentalOrder}
                            id={o.id}
                            propertyId={propertyId}
                            tekst="Refunder"
                          />
                        )}
                      </div>
                    </Kort>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Flate>
    </>
  );
}
