import { permanentRedirect } from "next/navigation";

/**
 * Gammel offentlig URL. Den nye boligvisningen bor på /bo/[slug]. Vi sender
 * gamle/delte lenker videre med 308 (permanent) og beholder query-parametre
 * som ?kilde=, ?betalt= og ?avbrutt=.
 */
export default async function LegacyPropertyRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") qs.set(key, value);
  }
  const query = qs.toString();

  permanentRedirect(`/bo/${slug}${query ? `?${query}` : ""}`);
}
