"use client";

import { useActionState, useState } from "react";

import {
  draftGuestReply,
  draftReviewReply,
  logConversation,
  type ReplyState,
} from "@/app/dashboard/meldinger/actions";
import { Flate, Handling, Kvittering, Omrade, Velg } from "@/components/hus";
import { Kopier } from "@/components/hus/kopier";

type PropertyOption = { id: string; name: string };

const initial: ReplyState = {};

const CHANNELS = [
  { verdi: "airbnb", tekst: "Airbnb" },
  { verdi: "booking", tekst: "Booking.com" },
  { verdi: "whatsapp", tekst: "WhatsApp" },
  { verdi: "sms", tekst: "SMS" },
  { verdi: "email", tekst: "E-post" },
  { verdi: "other", tekst: "Annet" },
];

/**
 * Svarverktøyene — modul 5 i UI-refaktoren. Kun presentasjon.
 *
 * Samme actions og samme felter: draftGuestReply (property_id, channel,
 * guest_message), draftReviewReply (property_id, rating, review) og
 * logConversation (property_id, channel, incoming, outgoing).
 */

export function GuestReplyTool({ properties }: { properties: PropertyOption[] }) {
  const [state, action, pending] = useActionState(draftGuestReply, initial);
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [channel, setChannel] = useState("airbnb");
  const [guestMessage, setGuestMessage] = useState("");

  return (
    <Flate
      tittel="Svar på gjestemelding"
      hva="Verta svarer på gjestens språk, med fakta fra din bolig."
    >
      <form action={action} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Velg
            navn="property_id"
            merke="Eiendom"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            valg={properties.map((p) => ({ verdi: p.id, tekst: p.name }))}
          />
          <Velg
            navn="channel"
            merke="Kanal"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            valg={CHANNELS}
          />
        </div>
        <Omrade
          navn="guest_message"
          merke="Gjestens melding"
          rows={4}
          required
          value={guestMessage}
          onChange={(e) => setGuestMessage(e.target.value)}
          placeholder="Lim inn det gjesten skrev …"
        />
        <Kvittering feil={state.error} />
        <div>
          <Handling type="submit" vekt="gull" disabled={pending}>
            {pending ? "Tenker …" : "Foreslå svar"}
          </Handling>
        </div>
      </form>

      {state.reply && (
        <div className="mt-5 flex flex-col gap-3 border-t border-hus-linje pt-5">
          <Omrade
            navn="forslag_gjest"
            merke="Forslag — rediger fritt før du sender"
            readOnly
            rows={5}
            value={state.reply}
          />
          <div className="flex items-center gap-2">
            <Kopier tekst={state.reply} merke="Kopier" />
            <form action={logConversation}>
              <input type="hidden" name="property_id" value={propertyId} />
              <input type="hidden" name="channel" value={channel} />
              <input type="hidden" name="incoming" value={guestMessage} />
              <input type="hidden" name="outgoing" value={state.reply} />
              <Handling type="submit" vekt="naken">
                Logg samtalen
              </Handling>
            </form>
          </div>
        </div>
      )}
    </Flate>
  );
}

export function ReviewReplyTool({
  properties,
}: {
  properties: PropertyOption[];
}) {
  const [state, action, pending] = useActionState(draftReviewReply, initial);

  return (
    <Flate
      tittel="Svar på anmeldelse"
      hva="Takker ved fem stjerner, spør om hva som kunne vært bedre ved færre."
    >
      <form action={action} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Velg
            navn="property_id"
            merke="Eiendom (valgfritt)"
            defaultValue=""
            valg={[
              { verdi: "", tekst: "—" },
              ...properties.map((p) => ({ verdi: p.id, tekst: p.name })),
            ]}
          />
          <Velg
            navn="rating"
            merke="Stjerner"
            defaultValue="5"
            valg={[5, 4, 3, 2, 1].map((n) => ({
              verdi: String(n),
              tekst: `${n} ★`,
            }))}
          />
        </div>
        <Omrade
          navn="review"
          merke="Anmeldelsen"
          rows={4}
          required
          placeholder="Lim inn gjestens anmeldelse …"
        />
        <Kvittering feil={state.error} />
        <div>
          <Handling type="submit" vekt="gull" disabled={pending}>
            {pending ? "Tenker …" : "Foreslå svar"}
          </Handling>
        </div>
      </form>

      {state.reply && (
        <div className="mt-5 flex flex-col gap-3 border-t border-hus-linje pt-5">
          <Omrade
            navn="forslag_anmeldelse"
            merke="Forslag — rediger fritt før du sender"
            readOnly
            rows={5}
            value={state.reply}
          />
          <div>
            <Kopier tekst={state.reply} merke="Kopier" />
          </div>
        </div>
      )}
    </Flate>
  );
}
