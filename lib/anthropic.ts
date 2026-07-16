import Anthropic from "@anthropic-ai/sdk";

/**
 * Delt Anthropic-klient. Bruk kun på serveren (API-nøkkelen må aldri
 * eksponeres til nettleseren).
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Standardmodell for tekstgenerering som lages én gang og caches (annonsetekst,
 * områdebeskrivelse, reiseguide). Her teller kvaliteten, og kostnaden er
 * neglisjerbar siden resultatet caches.
 */
export const DEFAULT_MODEL = "claude-sonnet-4-6";

/**
 * Billig modell for høyvolums, interaktive kall (gjeste-concierge, portal-chat).
 * Haiku 4.5 er ~5× billigere enn Sonnet og god nok til chat/oppslag — dette
 * holder «alt inkludert»-prisen bærekraftig.
 */
export const CHAT_MODEL = "claude-haiku-4-5-20251001";
