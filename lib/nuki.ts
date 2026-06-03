/**
 * Nuki smartlås. Aktiveres når en API-token finnes; til da dev-stub.
 * Ekte Nuki-OAuth + per-booking kodegenerering med SMS kobles på senere.
 */
export const nukiEnabled = Boolean(process.env.NUKI_API_TOKEN);

/** Genererer en tilfeldig 6-sifret adgangskode. */
export function generateAccessCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, "0");
}
