import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { OkonomiNav } from "@/components/okonomi/okonomi-nav";

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
    <div className="flex flex-col gap-6">
      <Suspense fallback={<div className="h-24" />}>
        <OkonomiNav properties={properties} />
      </Suspense>
      {children}
    </div>
  );
}
