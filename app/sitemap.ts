import type { MetadataRoute } from "next";

import { createAdminClient } from "@/lib/supabase/admin";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/hytter`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/login`, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Offentlige eiendomssider. Best-effort: faller tilbake til statiske ruter
  // hvis databasen ikke er tilgjengelig (f.eks. ved build uten env).
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("properties")
      .select("slug,updated_at")
      .eq("listed", true);
    const propertyRoutes: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
      url: `${siteUrl}/bo/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "daily",
      priority: 0.7,
    }));
    return [...staticRoutes, ...propertyRoutes];
  } catch {
    return staticRoutes;
  }
}
