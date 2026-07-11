import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatNok } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { payClaim } from "./actions";

export const metadata: Metadata = { title: "Skadekrav — Verta" };

type Claim = {
  id: string;
  amount: number;
  description: string | null;
  photos: string[] | null;
  status: string;
  property_id: string;
};

export default async function KravPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ betalt?: string; feil?: string }>;
}) {
  const { token } = await params;
  const { betalt, feil } = await searchParams;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("incident_claims")
    .select("id,amount,description,photos,status,property_id")
    .eq("claim_token", token)
    .maybeSingle();
  if (!data) notFound();
  const claim = data as Claim;

  const { data: property } = await supabase
    .from("properties")
    .select("name")
    .eq("id", claim.property_id)
    .single();

  const paid = claim.status === "paid" || betalt === "1";
  const photos = claim.photos ?? [];

  return (
    <main className="min-h-screen bg-cloud">
      <header className="bg-navy px-6 py-10 text-center text-white">
        <p className="text-sm text-gold-light">{property?.name ?? "Verta"}</p>
        <h1 className="mt-1 text-2xl font-bold">Skadekrav</h1>
      </header>

      <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
        {paid ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <p className="text-lg font-semibold text-emerald-800">
              Kravet er betalt ✅
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              Takk. Beløpet på {formatNok(Number(claim.amount))} er mottatt.
            </p>
          </div>
        ) : (
          <>
            {feil && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Betalingen kunne ikke startes akkurat nå. Prøv igjen litt senere.
              </p>
            )}

            <section className="rounded-xl border border-hairline bg-white p-5">
              <p className="text-sm text-ink/60">Krav</p>
              <p className="mt-1 text-3xl font-bold text-navy">
                {formatNok(Number(claim.amount))}
              </p>
              {claim.description && (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">
                  {claim.description}
                </p>
              )}
              {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {photos.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt="Skadebilde"
                        className="aspect-square w-full rounded-md object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </section>

            <form action={payClaim.bind(null, token)}>
              <Button type="submit" size="lg" className="w-full">
                Betal {formatNok(Number(claim.amount))}
              </Button>
            </form>
            <p className="text-center text-xs text-ink/60">
              Betaling håndteres sikkert av Stripe.
            </p>
          </>
        )}

        <p className="mt-2 text-center text-xs text-ink/60">Levert av Verta</p>
      </div>
    </main>
  );
}
