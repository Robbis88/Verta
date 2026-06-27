import { createAdminClient } from "@/lib/supabase/admin";

export const CLEANING_PHOTOS_BUCKET = "cleaning-photos";

const SIGNED_URL_TTL = 60 * 60; // 1 time

/**
 * Lager kortlevde signerte URL-er for private vaskebilder. All Storage-tilgang
 * går via service-role, så bucketen kan stå helt privat.
 */
export async function signedPhotoUrls(
  paths: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (paths.length === 0) return out;

  const supabase = createAdminClient();
  const { data } = await supabase.storage
    .from(CLEANING_PHOTOS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL);

  for (const item of data ?? []) {
    if (item.path && item.signedUrl) out.set(item.path, item.signedUrl);
  }
  return out;
}
