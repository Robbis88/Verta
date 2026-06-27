"use client";

import { useEffect } from "react";

/**
 * Registrerer service workeren (offline-fallback + app-shell-cache).
 * Kun i produksjon — i dev ville en SW caches gi forvirrende stale-treff.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Stille feil — appen fungerer uten service worker.
    });
  }, []);

  return null;
}
