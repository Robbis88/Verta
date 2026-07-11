import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatNok } from "@/lib/utils";
import { ClaimForm } from "@/components/claims/claim-form";
import { createIncidentClaim, createClaimPhotoUpload } from "./actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  pending: "Venter på betaling",
  paid: "Betalt",
  cancelled: "Kansellert",
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meld skade</h1>
        <Link
          href={`/dashboard/properties/${booking.property_id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Tilbake
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {property?.name ?? "Eiendom"} · {booking.guest_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Opphold {booking.check_in} → {booking.check_out}. Send gjesten et krav
          for skade utover normal slitasje.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nytt skadekrav</CardTitle>
        </CardHeader>
        <CardContent>
          <ClaimForm
            bookingId={bookingId}
            createAction={createIncidentClaim}
            uploadAction={createClaimPhotoUpload}
          />
        </CardContent>
      </Card>

      {claims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tidligere krav</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-hairline">
              {claims.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    {c.created_at.slice(0, 10)}
                  </span>
                  <span className="font-medium text-navy">
                    {formatNok(Number(c.amount))}
                  </span>
                  <span
                    className={
                      c.status === "paid"
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }
                  >
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
