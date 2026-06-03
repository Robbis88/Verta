import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { deleteProperty, updateProperty } from "../actions";
import {
  connectSmartLock,
  disconnectSmartLock,
} from "../smartlock-actions";
import { createOwnerBooking } from "../booking-actions";
import { PropertyForm } from "@/components/properties/property-form";
import { DeletePropertyButton } from "@/components/properties/delete-property-button";
import { BookingAddForm } from "@/components/bookings/booking-add-form";
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button";
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const profile = await getCurrentProfile();
  const isPremium = profile?.plan === "premium";
  const { data: lockData } = await supabase
    .from("smart_locks")
    .select("id,status,device_id,provider")
    .eq("property_id", id)
    .maybeSingle();
  const lock = lockData as SmartLock | null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{p.name}</h1>
          <p className="text-sm text-muted-foreground">
            Offentlig lenke: /properties/{p.slug}
          </p>
        </div>
        <Link
          href="/dashboard/properties"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Tilbake
        </Link>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Bookinger ({bookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen bookinger ennå.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {bookings.map((b) => (
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
          {!isPremium ? (
            <p className="text-sm text-muted-foreground">
              Smartlås er en Premium-funksjon.{" "}
              <Link href="/onboarding/plan" className="underline">
                Oppgrader til Premium
              </Link>{" "}
              for å koble til Nuki-lås.
            </p>
          ) : lock ? (
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
                Koble til en Nuki-lås for automatiske adgangskoder ved booking.
              </p>
              <div>
                <Button type="submit">Koble til Nuki</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <DeletePropertyButton action={deleteProperty} id={p.id} />
    </div>
  );
}
