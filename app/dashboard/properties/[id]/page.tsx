import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import {
  deleteProperty,
  updateProperty,
  uploadPropertyImage,
  deletePropertyImage,
  savePublicListing,
  regeneratePublicListing,
  replyToReview,
  suggestReviewReplyAction,
} from "../actions";
import { PublicListingEditor } from "@/components/properties/public-listing-editor";
import { PropertyMap } from "@/components/properties/property-map";
import { ImageManager } from "@/components/properties/image-manager";
import {
  connectSmartLock,
  disconnectSmartLock,
} from "../smartlock-actions";
import {
  createOwnerBooking,
  approveBooking,
  rejectBooking,
} from "../booking-actions";
import { PropertyForm } from "@/components/properties/property-form";
import { DeletePropertyButton } from "@/components/properties/delete-property-button";
import { BookingAddForm } from "@/components/bookings/booking-add-form";
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button";
import { CopyButton } from "@/components/shared/copy-button";
import { SmartLockCode } from "@/components/smartlock/smartlock-code";
import { AvailabilityCalendar } from "@/components/calendar/availability-calendar";
import { addIcalUrl, removeIcalUrl, syncIcal } from "../ical-actions";
import { bookedDateSet } from "@/lib/availability";
import { formatNok } from "@/lib/utils";
import type { IcalUrl } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Booking, Property } from "@/lib/types";

type SmartLock = {
  id: string;
  status: string;
  device_id: string;
  provider: string;
};

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lock?: string; godkjenn?: string }>;
}) {
  const { id } = await params;
  const { lock: lockResult, godkjenn } = await searchParams;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (!property) notFound();
  const p = property as Property;

  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("*")
    .eq("property_id", id)
    .order("check_in", { ascending: false });
  const bookings = (bookingsData ?? []) as Booking[];
  const requests = bookings.filter((b) => b.status === "requested");
  const activeBookings = bookings.filter((b) => b.status !== "requested");

  const { data: reviewsData } = await supabase
    .from("property_reviews")
    .select("id,guest_name,rating,comment,owner_reply,created_at")
    .eq("property_id", id)
    .order("created_at", { ascending: false });
  const reviews = (reviewsData ?? []) as {
    id: string;
    guest_name: string;
    rating: number;
    comment: string | null;
    owner_reply: string | null;
    created_at: string;
  }[];

  const profile = await getCurrentProfile();
  const isPremium = profile?.plan === "premium";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const bookingUrl = `${siteUrl}/bo/${p.slug}`;
  const { data: lockData } = await supabase
    .from("smart_locks")
    .select("id,status,device_id,provider")
    .eq("property_id", id)
    .maybeSingle();
  const lock = lockData as SmartLock | null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{p.name}</h1>
        <Link
          href="/dashboard/properties"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Tilbake
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Del bookingsiden</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p className="text-muted-foreground">
            Dette er den offentlige siden gjestene bruker for å booke og betale.
            Del lenken på e-post, SMS eller sosiale medier.
          </p>

          <div className="flex flex-col gap-2 rounded-lg border border-hairline p-3">
            <span className="text-xs font-medium text-muted-foreground">
              Bookinglenke
            </span>
            <div className="flex items-center justify-between gap-2">
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate font-medium text-navy underline"
              >
                {bookingUrl}
              </a>
              <CopyButton text={bookingUrl} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm">
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                Forhåndsvis siden
              </a>
            </Button>
            <CopyButton
              text={`${bookingUrl}?kilde=instagram`}
              label="Kopier Instagram-lenke"
            />
            <CopyButton
              text={`${bookingUrl}?kilde=facebook`}
              label="Kopier Facebook-lenke"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Bruk Instagram-/Facebook-lenkene når du deler på de kanalene, så ser
            du hvor bookingene kommer fra (og riktig provisjon beregnes).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bilder</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageManager
            propertyId={p.id}
            images={p.images ?? []}
            uploadAction={uploadPropertyImage}
            deleteAction={deletePropertyImage}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kart / beliggenhet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {p.lat != null && p.lng != null ? (
            <>
              <p className="font-medium text-emerald-600">
                ✓ Plassert på kartet — vises på den offentlige siden.
              </p>
              <PropertyMap lat={p.lat} lng={p.lng} />
            </>
          ) : (
            <p className="text-amber-600">
              ⚠ Vi fant ikke{" "}
              {p.address ? (
                <>«{p.address}»</>
              ) : (
                "noen adresse"
              )}{" "}
              på kartet. Skriv en <strong>fullstendig norsk adresse</strong>{" "}
              (gate, husnummer og poststed — f.eks. «Storgata 12, 5003 Bergen»)
              i «Rediger» under og lagre. Da plasseres den automatisk via
              Kartverket, og kartet dukker opp på den offentlige siden.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Offentlig annonsetekst</CardTitle>
        </CardHeader>
        <CardContent>
          <PublicListingEditor
            propertyId={p.id}
            listing={p.public_listing ?? ""}
            saveAction={savePublicListing}
            regenerateAction={regeneratePublicListing}
            publicUrl={`${siteUrl}/bo/${p.slug}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rediger</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyForm
            action={updateProperty}
            submitLabel="Lagre endringer"
            defaults={{
              id: p.id,
              name: p.name,
              address: p.address,
              description: p.description,
              bedrooms: p.bedrooms,
              bathrooms: p.bathrooms,
              max_guests: p.max_guests,
              base_nightly_rate: p.base_nightly_rate,
              cleaning_fee: p.cleaning_fee,
              access_info: p.access_info,
              wifi_name: p.wifi_name,
              wifi_password: p.wifi_password,
              house_rules: p.house_rules,
              checkout_info: p.checkout_info,
              booking_mode: p.booking_mode,
              amenities: p.amenities,
              beds: p.beds,
              sleeping_arrangements: p.sleeping_arrangements,
              check_in_time: p.check_in_time,
              check_out_time: p.check_out_time,
              video_url: p.video_url,
              market_value: p.market_value,
              loan_amount: p.loan_amount,
              interest_rate: p.interest_rate,
              monthly_principal: p.monthly_principal,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legg til booking</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingAddForm action={createOwnerBooking.bind(null, p.id)} />
        </CardContent>
      </Card>

      {godkjenn === "konflikt" && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Datoene ble opptatt av en annen booking før du rakk å godkjenne.
          Forespørselen står fortsatt åpen.
        </p>
      )}

      {requests.length > 0 && (
        <Card className="border-gold">
          <CardHeader>
            <CardTitle>Forespørsler ({requests.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {requests.map((b) => (
              <div
                key={b.id}
                className="flex flex-col gap-2 rounded-lg border border-hairline p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{b.guest_name}</span>
                  <span className="text-muted-foreground">
                    {b.check_in} → {b.check_out}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {b.guest_email && <span>{b.guest_email}</span>}
                  {b.num_guests != null && <span>{b.num_guests} gjester</span>}
                  {b.total_price != null && (
                    <span>{formatNok(Number(b.total_price))} totalt</span>
                  )}
                </div>
                {b.guest_message && (
                  <p className="whitespace-pre-line rounded bg-muted/40 p-2 text-xs text-foreground">
                    {b.guest_message}
                  </p>
                )}
                <div className="flex gap-2">
                  <form action={approveBooking}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="property_id" value={p.id} />
                    <Button type="submit" size="sm">
                      Godkjenn
                    </Button>
                  </form>
                  <form action={rejectBooking}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="property_id" value={p.id} />
                    <Button type="submit" size="sm" variant="outline">
                      Avslå
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bookinger ({activeBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activeBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen bookinger ennå.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {activeBookings.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="flex-1">{b.guest_name}</span>
                  <Badge>{b.source}</Badge>
                  <span className="w-28 text-right text-muted-foreground">
                    {b.check_in} → {b.check_out}
                  </span>
                  <span className="w-24 text-right">
                    {b.total_price ? formatNok(Number(b.total_price)) : "—"}
                  </span>
                  <span className="w-40 text-right text-xs">
                    {b.status === "approved" ? (
                      <span className="text-amber-600">venter depositum</span>
                    ) : b.payment_status === "paid" ? (
                      <span className="text-emerald-600">
                        {b.remaining_amount != null &&
                        Number(b.remaining_amount) > 0 &&
                        !b.remaining_paid
                          ? `depositum betalt · rest ${formatNok(Number(b.remaining_amount))}`
                          : "betalt"}
                      </span>
                    ) : b.payment_status === "refunded" ? (
                      <span className="text-muted-foreground">refundert</span>
                    ) : null}
                  </span>
                  {b.status !== "cancelled" && b.guest_token && (
                    <a
                      href={`/gjest/${b.guest_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground underline hover:text-foreground"
                    >
                      Gjesteside
                    </a>
                  )}
                  {b.status === "cancelled" ? (
                    <span className="w-16 text-right text-xs text-muted-foreground">
                      avbrutt
                    </span>
                  ) : (
                    <CancelBookingButton id={b.id} propertyId={p.id} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anmeldelser ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen anmeldelser ennå. Gjester kan legge igjen anmeldelse fra
              gjestesiden etter oppholdet.
            </p>
          ) : (
            reviews.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-2 rounded-lg border border-hairline p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.guest_name}</span>
                  <span className="text-gold">
                    {"★".repeat(r.rating)}
                    <span className="text-ink/25">
                      {"★".repeat(5 - r.rating)}
                    </span>
                  </span>
                </div>
                {r.comment && <p className="text-ink">{r.comment}</p>}
                <form
                  action={replyToReview}
                  className="flex flex-col gap-2 border-t border-hairline pt-2"
                >
                  <input type="hidden" name="review_id" value={r.id} />
                  <input type="hidden" name="property_id" value={p.id} />
                  <textarea
                    name="owner_reply"
                    rows={2}
                    defaultValue={r.owner_reply ?? ""}
                    key={r.owner_reply ?? ""}
                    placeholder="Skriv et svar til gjesten…"
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="sm" variant="outline">
                      Lagre svar
                    </Button>
                  </div>
                </form>
                <form action={suggestReviewReplyAction}>
                  <input type="hidden" name="review_id" value={r.id} />
                  <input type="hidden" name="property_id" value={p.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    Foreslå svar med AI
                  </Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tilgjengelighet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <AvailabilityCalendar
            bookedDates={[...bookedDateSet(bookings)]}
            fromISO={new Date().toISOString().slice(0, 10)}
            months={3}
          />
          <div className="flex flex-col gap-1 border-t pt-4 text-sm">
            <span className="font-medium">Kalendersynk (iCal)</span>
            <span className="text-muted-foreground">
              Lim denne lenken inn i Airbnb/Booking for å blokkere
              Verta-bookede datoer:
            </span>
            <code className="mt-1 break-all rounded bg-muted px-2 py-1 text-xs">
              {(process.env.NEXT_PUBLIC_SITE_URL ?? "")}/api/calendar/{p.slug}
            </code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importer kalender (iCal)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p className="text-muted-foreground">
            Lim inn iCal-eksportlenken fra Airbnb eller Booking.com, så
            importeres bookingene deres hit og blokkerer datoene.
          </p>

          {(p.ical_urls ?? []).length > 0 && (
            <ul className="flex flex-col divide-y">
              {(p.ical_urls as IcalUrl[]).map((u) => (
                <li
                  key={u.url}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="truncate">
                    <span className="font-medium">{u.source}</span> ·{" "}
                    <span className="text-muted-foreground">{u.url}</span>
                  </span>
                  <form action={removeIcalUrl}>
                    <input type="hidden" name="property_id" value={p.id} />
                    <input type="hidden" name="url" value={u.url} />
                    <Button type="submit" variant="ghost" size="sm">
                      Fjern
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <form action={addIcalUrl} className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="property_id" value={p.id} />
            <input
              name="url"
              type="url"
              required
              placeholder="https://www.airbnb.no/calendar/ical/…"
              className="flex h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <select
              name="source"
              defaultValue="airbnb"
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="airbnb">Airbnb</option>
              <option value="booking">Booking.com</option>
            </select>
            <Button type="submit" variant="outline">
              Legg til
            </Button>
          </form>

          {(p.ical_urls ?? []).length > 0 && (
            <form action={syncIcal}>
              <input type="hidden" name="property_id" value={p.id} />
              <Button type="submit">Synk nå</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Smartlås</CardTitle>
        </CardHeader>
        <CardContent>
          {lockResult === "connected" && (
            <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Smartlåsen er koblet til. ✓
            </p>
          )}
          {lockResult === "error" && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              Vi fikk ikke koblet til låsen. Prøv på nytt.
            </p>
          )}
          {!isPremium ? (
            <p className="text-sm text-muted-foreground">
              Smartlås er en Premium-funksjon.{" "}
              <Link href="/onboarding/plan" className="underline">
                Oppgrader til Premium
              </Link>{" "}
              for å koble til smartlås.
            </p>
          ) : lock && lock.status !== "pending" ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-sm">
                <Badge>{lock.status}</Badge>
                <span className="text-muted-foreground">
                  {lock.provider} · {lock.device_id}
                </span>
              </div>
              <SmartLockCode />
              <form action={disconnectSmartLock}>
                <input type="hidden" name="id" value={lock.id} />
                <input type="hidden" name="property_id" value={p.id} />
                <Button type="submit" variant="outline">
                  Koble fra
                </Button>
              </form>
            </div>
          ) : (
            <form action={connectSmartLock} className="flex flex-col gap-3">
              <input type="hidden" name="property_id" value={p.id} />
              <p className="text-sm text-muted-foreground">
                Koble til smartlåsen din (Nuki, Igloohome eller Salto) for
                automatiske adgangskoder ved booking.{" "}
                <Link href="/dashboard/smartlas-guide" className="underline">
                  Hvilken lås bør jeg kjøpe?
                </Link>
              </p>
              <div>
                <Button type="submit">Koble til smartlås</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <DeletePropertyButton action={deleteProperty} id={p.id} />
    </div>
  );
}
