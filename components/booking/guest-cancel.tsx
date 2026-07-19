"use client";

import { useState, useTransition } from "react";

import type { GuestCancelResult } from "@/app/gjest/[token]/actions";
import { Button } from "@/components/ui/button";

/**
 * Avbestill-knapp på gjestesiden. Viser hvilken refusjon som gjelder nå,
 * krever en bekreftelse, og kaller server-actionen.
 */
type CancelLabels = {
  confirmQ: string;
  yes: string;
  cancelling: string;
  undo: string;
  button: string;
};

const DEFAULT_LABELS: CancelLabels = {
  confirmQ: "Er du sikker på at du vil avbestille?",
  yes: "Ja, avbestill",
  cancelling: "Avbestiller…",
  undo: "Angre",
  button: "Avbestill oppholdet",
};

export function GuestCancel({
  cancelAction,
  refundNote,
  policyLines,
  labels = DEFAULT_LABELS,
}: {
  cancelAction: () => Promise<GuestCancelResult>;
  refundNote: string;
  policyLines: string[];
  labels?: CancelLabels;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (done) {
    return (
      <p className="text-sm leading-relaxed text-ink" role="status">
        {done}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink">{refundNote}</p>
      <ul className="list-disc pl-5 text-xs leading-relaxed text-ink/70">
        {policyLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {confirming ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-navy">{labels.confirmQ}</p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await cancelAction();
                  setDone(res.message);
                })
              }
            >
              {pending ? labels.cancelling : labels.yes}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              {labels.undo}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setConfirming(true)}
        >
          {labels.button}
        </Button>
      )}
    </div>
  );
}
