import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatNok } from "@/lib/utils";
import { ClaimForm } from "@/components/claims/claim-form";
import { createIncidentClaim, createClaimPhotoUpload } from "./actions";
import {
  Flate,
  Handling,
  Liste,
  Rad,
  Side,
  Situasjon,
} from "@/components/hus";

/**
 * Meld skade — modul 7. Kun presentasjon; samme spørringer og samme actions.
 */

const STATUS_LABEL: Record<string, string> = {
  pending: "Venter på betaling",
  paid: "Betalt",
  cancelled: "Kansellert",
};

/** Betalt krav er penger inn — derfor gull, ikke grønt. */
const STATUS_TONE: Record<string, "ro" | "obs" | "gull"> = {
  pending: "obs",
  paid: "gull",
  cancelled: "ro",
};

export default async function SkadePage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  await requireUser();
  const { bookingId } = await params;
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id,property_id,guest_name,check_in,check_out")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) notFound();

  const [{ data: property }, { data: claimsData }] = await Promise.all([
    supabase
      .from("properties")
      .select("name")
      .eq("id", booking.property_id)
      .single(),
    supabase
      .from("incident_claims")
      .select("id,amount,status,created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false }),
  ]);
  const claims = (claimsData ?? []) as {
    id: string;
    amount: number;
    status: string;
    created_at: string;
  }[];

  return (
    <Side>
      <Situasjon
        merke="Skade"
        tittel={`${booking.guest_name} bodde i ${property?.name ?? "boligen"} ${booking.check_in} → ${booking.check_out}.`}
        under="Send et krav for skade utover normal slitasje. Gjesten får kravet på e-post med bildene, og kortet belastes først når de betaler."
        handling={
          <Handling href={`/dashboard/properties/${booking.property_id}`} vekt="stille">
            ← Tilbake
          </Handling>
        }
      />

      <Flate
        tittel="Nytt skadekrav"
        hva="Beløp, en kort beskrivelse og bilder som viser hva som skjedde."
      >
        <ClaimForm
          bookingId={bookingId}
          createAction={createIncidentClaim}
          uploadAction={createClaimPhotoUpload}
        />
      </Flate>

      {claims.length > 0 && (
        <Flate tittel="Tidligere krav" hva="Alt du har sendt for dette oppholdet.">
          <Liste>
            {claims.map((c) => (
              <Rad
                key={c.id}
                nar={c.created_at.slice(0, 10)}
                hva={STATUS_LABEL[c.status] ?? c.status}
                verdi={formatNok(Number(c.amount))}
                tone={STATUS_TONE[c.status] ?? "ro"}
              />
            ))}
          </Liste>
        </Flate>
      )}
    </Side>
  );
}
