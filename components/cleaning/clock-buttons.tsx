"use client";

import { useState } from "react";

import { clockInTask, clockOutTask } from "@/app/vasker/[token]/actions";
import { Button } from "@/components/ui/button";

/** Henter posisjon én gang; gir null hvis bruker avslår eller GPS mangler. */
function getPosition(): Promise<{ lat: number | null; lng: number | null }> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ lat: null, lng: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  });
}

export function ClockButtons({
  token,
  taskId,
  clockedIn,
  clockedOut,
}: {
  token: string;
  taskId: string;
  clockedIn: boolean;
  clockedOut: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function stemple(action: typeof clockInTask) {
    setBusy(true);
    const { lat, lng } = await getPosition();
    const fd = new FormData();
    fd.set("token", token);
    fd.set("task_id", taskId);
    if (lat != null) fd.set("lat", String(lat));
    if (lng != null) fd.set("lng", String(lng));
    await action(fd);
    setBusy(false);
  }

  if (clockedOut) {
    return <p className="text-sm text-ink/50">Stemplet ut ✓</p>;
  }

  return (
    <div className="flex gap-2">
      {!clockedIn ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => stemple(clockInTask)}
        >
          {busy ? "Henter posisjon…" : "Stemple inn"}
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          className="bg-gold text-navy hover:bg-gold/90"
          disabled={busy}
          onClick={() => stemple(clockOutTask)}
        >
          {busy ? "Henter posisjon…" : "Stemple ut (fullfør)"}
        </Button>
      )}
    </div>
  );
}
