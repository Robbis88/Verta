"use client";

import { useActionState, useState } from "react";

import {
  generateCampaign,
  type CampaignState,
} from "@/app/dashboard/varsler/actions";
import { Handling, Kvittering, Omrade } from "@/components/hus";

const initial: CampaignState = {};

/**
 * Ferdig kampanjetekst for et varsel. Kun presentasjon er endret — samme
 * `generateCampaign`, samme `alert_id`-felt, samme kopier-til-utklippstavle.
 */
export function AlertCampaign({ alertId }: { alertId: string }) {
  const [state, action, pending] = useActionState(generateCampaign, initial);
  const [kopiert, setKopiert] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <form action={action}>
        <input type="hidden" name="alert_id" value={alertId} />
        <Handling type="submit" vekt="stille" disabled={pending}>
          {pending ? "Skriver kampanjen …" : "Lag kampanje"}
        </Handling>
      </form>

      <Kvittering feil={state.error} />

      {state.campaign && (
        <div className="flex flex-col gap-3">
          <Omrade
            navn="kampanje"
            merke="Ferdig tekst"
            readOnly
            rows={10}
            value={state.campaign}
          />
          <div>
            <Handling
              vekt="naken"
              onClick={async () => {
                await navigator.clipboard.writeText(state.campaign ?? "");
                setKopiert(true);
                setTimeout(() => setKopiert(false), 1500);
              }}
            >
              {kopiert ? "Kopiert ✓" : "Kopier"}
            </Handling>
          </div>
        </div>
      )}
    </div>
  );
}
