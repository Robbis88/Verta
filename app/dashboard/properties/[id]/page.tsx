import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import {
  deleteProperty,
  updateProperty,
  savePublicListing,
  regeneratePublicListing,
  createVideoUpload,
  setPropertyVideo,
  removePropertyVideo,
} from "../actions";
import { PublicListingEditor } from "@/components/properties/public-listing-editor";
import { VideoUploader } from "@/components/properties/video-uploader";
import { PropertyMap } from "@/components/properties/property-map";
import { PropertyForm } from "@/components/properties/property-form";
import { DeletePropertyButton } from "@/components/properties/delete-property-button";
import { bookedDateSet } from "@/lib/availability";
import { Beskjed, Flate, Handling, Side, Situasjon } from "@/components/hus";
import { Deling } from "./seksjoner/deling";
import { Inventar } from "./seksjoner/inventar";
import { Tjenester } from "./seksjoner/tjenester";
import { Huset } from "./seksjoner/huset";
import { Bookinger } from "./seksjoner/bookinger";
import { Anmeldelser } from "./seksjoner/anmeldelser";
import { Kalender } from "./seksjoner/kalender";
import type { Utstyr, Leieting, Leieordre } from "./seksjoner/inventar";
import type { Tjeneste, Foresporsel } from "./seksjoner/tjenester";
import type { Nokkel, Kontakt, LokalLenke } from "./seksjoner/huset";
import type { Anmeldelse } from "./seksjoner/anmeldelser";
import type { SmartLock } from "./seksjoner/kalender";
import type { IcalUrl } from "@/lib/types";
import type { Booking, Property } from "@/lib/types";

/**
 * Én eiendom — modul 9 i UI-refaktoren.
 *
 * Var 1 706 linjer i én fil. Datahentingen ligger fortsatt her, uendret;
 * markupen er delt i seksjoner under ./seksjoner/. Ingen spørring, ingen
 * action og ingen feltnavn er rørt — bare hvem som tegner hva.
 */
export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lock?: string; godkjenn?: string; krav?: string }>;
}) {
  const { id } = await params;
  const { lock: lockResult, godkjenn, krav } = await searchParams;
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
  const reviews = (reviewsData ?? []) as Anmeldelse[];

  const { data: rentalData } = await supabase
    .from("rental_items")
    .select("id,name,description,price,price_extra_day,quantity")
    .eq("property_id", id)
    .order("created_at");
  const rentalItems = (rentalData ?? []) as Leieting[];

  const { data: paidRentalData } = await supabase
    .from("rental_orders")
    .select("id,guest_name,quantity,days,amount,status,created_at")
    .eq("property_id", id)
    .in("status", ["paid", "refunded"])
    .order("created_at", { ascending: false });
  const rentalOrders = (paidRentalData ?? []) as Leieordre[];

  const { data: equipmentData } = await supabase
    .from("house_equipment")
    .select("id,name,category,location,brand,model,warranty_until,notes")
    .eq("property_id", id)
    .order("created_at");
  const equipment = (equipmentData ?? []) as Utstyr[];
  const todayIso = new Date().toISOString().slice(0, 10);

  const { data: serviceData } = await supabase
    .from("property_services")
    .select(
      "id,name,kind,schedule_days,provider_name,provider_phone,provider_email,note",
    )
    .eq("property_id", id)
    .order("created_at");
  const services = (serviceData ?? []) as Tjeneste[];
  const serviceById = new Map(services.map((s) => [s.id, s]));

  const { data: serviceReqData } = await supabase
    .from("property_service_requests")
    .select("id,service_id,service_name,guest_name,guest_contact,desired_date,message,created_at")
    .eq("property_id", id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const serviceRequests = (serviceReqData ?? []) as Foresporsel[];

  const { data: contactData } = await supabase
    .from("property_contacts")
    .select("id,name,role,phone,email,notes")
    .eq("property_id", id)
    .order("created_at");
  const contacts = (contactData ?? []) as Kontakt[];

  // Nøkkelknippet (sql/064). Tåler at migrasjonen ikke er kjørt ennå — da er
  // lista tom og seksjonen forklarer hva som mangler.
  const { data: keyData } = await supabase
    .from("property_keys")
    .select("id,label,key_type,copies,holder,notes,updated_at")
    .eq("property_id", id)
    .order("created_at");
  const keys = (keyData ?? []) as Nokkel[];

  const { data: linkData } = await supabase
    .from("local_links")
    .select("id,title,url,description")
    .eq("property_id", id)
    .order("created_at");
  const localLinks = (linkData ?? []) as LokalLenke[];

  await getCurrentProfile();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const bookingUrl = `${siteUrl}/bo/${p.slug}`;
  const { data: lockData } = await supabase
    .from("smart_locks")
    .select("id,status,device_id,provider")
    .eq("property_id", id)
    .maybeSingle();
  const lock = lockData as SmartLock | null;

  const kommende = activeBookings.filter(
    (b) => b.status !== "cancelled" && b.check_out >= todayIso,
  ).length;

  return (
    <Side>
      <Situasjon
        merke="Eiendom"
        tittel={p.name}
        under={
          requests.length > 0
            ? `${requests.length} forespørsel${requests.length > 1 ? "er" : ""} venter på svar fra deg.`
            : kommende > 0
              ? `${kommende} kommende opphold er bekreftet.`
              : "Ingen kommende opphold akkurat nå."
        }
        handling={
          <Handling href="/dashboard/properties" vekt="stille">
            ← Tilbake
          </Handling>
        }
      />

      {godkjenn === "konflikt" && (
        <Beskjed tone="obs">
          Datoene ble opptatt av en annen booking før du rakk å godkjenne.
          Forespørselen står fortsatt åpen.
        </Beskjed>
      )}
      {krav === "sendt" && (
        <Beskjed>
          Skadekravet er sendt til gjesten på e-post. Du får varsel når det
          betales.
        </Beskjed>
      )}

      <Deling
        propertyId={p.id}
        images={p.images ?? []}
        bookingUrl={bookingUrl}
        guideUrl={`${siteUrl}/guide/${p.guide_token}`}
      />

      <Bookinger
        propertyId={p.id}
        siteUrl={siteUrl}
        requests={requests}
        activeBookings={activeBookings}
        lateCheckoutPrice={p.late_checkout_price ?? null}
        earlyCheckinPrice={p.early_checkin_price ?? null}
      />

      <Kalender
        propertyId={p.id}
        slug={p.slug}
        siteUrl={siteUrl}
        bookedDates={[...bookedDateSet(bookings)]}
        fromISO={todayIso}
        icalUrls={(p.ical_urls ?? []) as IcalUrl[]}
        lock={lock}
        lockResult={lockResult}
      />

      <Inventar
        propertyId={p.id}
        equipment={equipment}
        todayIso={todayIso}
        rentalItems={rentalItems}
        rentalOrders={rentalOrders}
      />

      <Tjenester
        propertyId={p.id}
        propertyName={p.name}
        propertyAddress={p.address ?? null}
        services={services}
        serviceById={serviceById}
        serviceRequests={serviceRequests}
      />

      <Huset
        propertyId={p.id}
        keys={keys}
        contacts={contacts}
        localLinks={localLinks}
      />

      <Anmeldelser propertyId={p.id} reviews={reviews} />

      <Flate
        tittel="Video"
        hva="En kort video vises som bakgrunn øverst på den offentlige siden."
      >
        <VideoUploader
          propertyId={p.id}
          videoUrl={p.video_url ?? null}
          createUpload={createVideoUpload}
          setVideo={setPropertyVideo}
          removeVideo={removePropertyVideo}
        />
      </Flate>

      <Flate
        tittel="Kart / beliggenhet"
        hva="Vises som et omtrentlig område, aldri eksakt adresse."
      >
        {p.lat != null && p.lng != null ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-hus-god">
              Plassert på kartet — vises på den offentlige siden.
            </p>
            <PropertyMap lat={p.lat} lng={p.lng} />
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-hus-obs">
            Vi fant ikke {p.address ? <>«{p.address}»</> : "noen adresse"} på
            kartet. Skriv en fullstendig norsk adresse (gate, husnummer og
            poststed — f.eks. «Storgata 12, 5003 Bergen») under «Rediger» og
            lagre. Da plasseres den automatisk via Kartverket, og kartet dukker
            opp på den offentlige siden.
          </p>
        )}
      </Flate>

      <Flate
        tittel="Offentlig annonsetekst"
        hva="Teksten gjestene leser før de bestemmer seg."
      >
        <PublicListingEditor
          propertyId={p.id}
          listing={p.public_listing ?? ""}
          saveAction={savePublicListing}
          regenerateAction={regeneratePublicListing}
          publicUrl={bookingUrl}
        />
      </Flate>

      <Flate tittel="Rediger" hva="Alt Verta vet om boligen.">
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
            appliances_info: p.appliances_info,
            booking_mode: p.booking_mode,
            amenities: p.amenities,
            beds: p.beds,
            sleeping_arrangements: p.sleeping_arrangements,
            check_in_time: p.check_in_time,
            check_out_time: p.check_out_time,
            video_url: p.video_url,
            listed: p.listed,
            market_value: p.market_value,
            loan_amount: p.loan_amount,
            interest_rate: p.interest_rate,
            monthly_principal: p.monthly_principal,
          }}
        />
      </Flate>

      <Flate
        tittel="Faresone"
        hva="Sletting fjerner eiendommen og alt som hører til — permanent."
      >
        <DeletePropertyButton action={deleteProperty} id={p.id} />
      </Flate>
    </Side>
  );
}
