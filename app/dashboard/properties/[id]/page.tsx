import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { deleteProperty, updateProperty } from "../actions";
import { PropertyForm } from "@/components/properties/property-form";
import { DeletePropertyButton } from "@/components/properties/delete-property-button";
import { formatNok } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Booking, Property } from "@/lib/types";

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
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span>{b.guest_name}</span>
                  <span className="text-muted-foreground">
                    {b.check_in} → {b.check_out}
                  </span>
                  <span>{b.total_price ? formatNok(Number(b.total_price)) : "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <DeletePropertyButton action={deleteProperty} id={p.id} />
    </div>
  );
}
