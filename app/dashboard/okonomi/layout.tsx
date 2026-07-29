import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { OkonomiNav } from "@/components/okonomi/okonomi-nav";
import { Side } from "@/components/hus";

/**
 * Skallet rundt Eiendomsøkonomi — modul 6. `Side` legges her, så alle seks
 * undersidene arver husflaten uten å gjenta den. Ingen datalogikk endret.
 */
export default async function OkonomiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id,name")
    .order("created_at", { ascending: true });
  const properties = (data ?? []) as { id: string; name: string }[];

  return (
    <Side bred>
      <Suspense fallback={<div className="h-24" />}>
        <OkonomiNav properties={properties} />
      </Suspense>
      {children}
    </Side>
  );
}
