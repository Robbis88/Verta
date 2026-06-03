import Anthropic from "@anthropic-ai/sdk";

/**
 * Delt Anthropic-klient. Bruk kun på serveren (API-nøkkelen må aldri
 * eksponeres til nettleseren).
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/** Standardmodell for Verta. Endre etter behov. */
export const DEFAULT_MODEL = "claude-sonnet-4-6";
