import { Flate, Handling, Kort, Omrade, Tomt } from "@/components/hus";
import { replyToReview, suggestReviewReplyAction } from "../../actions";

/**
 * Anmeldelser — modul 9. Seksjon av eiendomssiden, kun presentasjon. Samme
 * actions (replyToReview: review_id, property_id, owner_reply).
 */

export type Anmeldelse = {
  id: string;
  guest_name: string;
  rating: number;
  comment: string | null;
  owner_reply: string | null;
  created_at: string;
};

function Stjerner({ antall }: { antall: number }) {
  return (
    <span className="text-hus-gull-lys" aria-label={`${antall} av 5 stjerner`}>
      {"★".repeat(antall)}
      <span className="text-hus-svak">{"★".repeat(5 - antall)}</span>
    </span>
  );
}

export function Anmeldelser({
  propertyId,
  reviews,
}: {
  propertyId: string;
  reviews: Anmeldelse[];
}) {
  return (
    <Flate
      tittel={`Anmeldelser (${reviews.length})`}
      hva="Svar rolig — svaret leses av alle som vurderer å booke."
    >
      {reviews.length === 0 ? (
        <Tomt
          tittel="Ingen anmeldelser ennå."
          hva="Gjester kan legge igjen anmeldelse fra gjestesiden etter oppholdet."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <Kort key={r.id}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-hus-blekk">{r.guest_name}</span>
                  <Stjerner antall={r.rating} />
                </div>
                {r.comment && (
                  <p className="text-sm leading-relaxed text-hus-dempet">
                    {r.comment}
                  </p>
                )}

                <form
                  action={replyToReview}
                  className="flex flex-col gap-3 border-t border-hus-linje pt-3"
                >
                  <input type="hidden" name="review_id" value={r.id} />
                  <input type="hidden" name="property_id" value={propertyId} />
                  <Omrade
                    navn="owner_reply"
                    merke="Ditt svar"
                    rows={2}
                    defaultValue={r.owner_reply ?? ""}
                    key={r.owner_reply ?? ""}
                    placeholder="Skriv et svar til gjesten …"
                  />
                  <div>
                    <Handling type="submit" vekt="stille">
                      Lagre svar
                    </Handling>
                  </div>
                </form>

                <form action={suggestReviewReplyAction}>
                  <input type="hidden" name="review_id" value={r.id} />
                  <input type="hidden" name="property_id" value={propertyId} />
                  <Handling type="submit" vekt="naken">
                    Foreslå svar med AI
                  </Handling>
                </form>
              </div>
            </Kort>
          ))}
        </div>
      )}
    </Flate>
  );
}
