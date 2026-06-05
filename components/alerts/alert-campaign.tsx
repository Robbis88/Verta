"use client";

import { useActionState, useState } from "react";

import {
  generateCampaign,
  type CampaignState,
} from "@/app/dashboard/varsler/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initial: CampaignState = {};

export function AlertCampaign({ alertId }: { alertId: string }) {
  const [state, action, pending] = useActionState(generateCampaign, initial);
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <form action={action}>
        <input type="hidden" name="alert_id" value={alertId} />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Lager kampanje…" : "Lag kampanje"}
        </Button>
      </form>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state.campaign && (
        <div className="flex flex-col gap-2">
          <Textarea readOnly rows={10} value={state.campaign} />
          <div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={async () => {
                await navigator.clipboard.writeText(state.campaign ?? "");
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Kopiert ✓" : "Kopier"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
