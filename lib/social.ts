/** Sosiale kanaler Verta kan koble til, med publiseringsevne. */
export type Capability = "auto" | "ads";

export type Platform = {
  key: string;
  label: string;
  capability: Capability;
  note: string;
};

export const PLATFORMS: Platform[] = [
  { key: "facebook", label: "Facebook", capability: "auto", note: "Auto-publisering via Meta Graph API" },
  { key: "instagram", label: "Instagram", capability: "auto", note: "Auto-publisering via Meta Graph API" },
  { key: "youtube", label: "YouTube", capability: "auto", note: "Video/Shorts via YouTube Data API" },
  { key: "linkedin", label: "LinkedIn", capability: "auto", note: "Auto-publisering via LinkedIn API" },
  { key: "pinterest", label: "Pinterest", capability: "auto", note: "Auto-publisering via Pinterest API" },
  { key: "google_business", label: "Google Business", capability: "auto", note: "Lokale innlegg via Google Business API" },
  { key: "tiktok", label: "TikTok", capability: "ads", note: "Annonser (organisk API krever godkjenning)" },
  { key: "snapchat", label: "Snapchat", capability: "ads", note: "Kun annonser (ingen organisk API)" },
];

export function platformLabel(key: string): string {
  return PLATFORMS.find((p) => p.key === key)?.label ?? key;
}
