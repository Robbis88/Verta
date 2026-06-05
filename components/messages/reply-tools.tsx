"use client";

import { useActionState, useState } from "react";

import {
  draftGuestReply,
  draftReviewReply,
  logConversation,
  type ReplyState,
} from "@/app/dashboard/meldinger/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PropertyOption = { id: string; name: string };

const initial: ReplyState = {};

const CHANNELS = [
  ["airbnb", "Airbnb"],
  ["booking", "Booking.com"],
  ["whatsapp", "WhatsApp"],
  ["sms", "SMS"],
  ["email", "E-post"],
  ["other", "Annet"],
] as const;

const selectClass =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Kopiert ✓" : "Kopier"}
    </Button>
  );
}

export function GuestReplyTool({ properties }: { properties: PropertyOption[] }) {
  const [state, action, pending] = useActionState(draftGuestReply, initial);
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [channel, setChannel] = useState("airbnb");
  const [guestMessage, setGuestMessage] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Svar på gjestemelding</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={action} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Eiendom</Label>
              <select
                name="property_id"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className={selectClass}
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Kanal</Label>
              <select
                name="channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className={selectClass}
              >
                {CHANNELS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guest_message">Gjestens melding</Label>
            <Textarea
              id="guest_message"
              name="guest_message"
              rows={4}
              required
              value={guestMessage}
              onChange={(e) => setGuestMessage(e.target.value)}
              placeholder="Lim inn det gjesten skrev…"
            />
          </div>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Tenker…" : "Foreslå svar"}
            </Button>
          </div>
        </form>

        {state.reply && (
          <div className="flex flex-col gap-3 border-t pt-4">
            <Label>Forslag (rediger fritt før du sender)</Label>
            <Textarea readOnly rows={5} value={state.reply} />
            <div className="flex items-center gap-2">
              <CopyButton text={state.reply} />
              <form action={logConversation}>
                <input type="hidden" name="property_id" value={propertyId} />
                <input type="hidden" name="channel" value={channel} />
                <input type="hidden" name="incoming" value={guestMessage} />
                <input type="hidden" name="outgoing" value={state.reply} />
                <Button type="submit" variant="ghost" size="sm">
                  Logg samtale
                </Button>
              </form>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ReviewReplyTool({
  properties,
}: {
  properties: PropertyOption[];
}) {
  const [state, action, pending] = useActionState(draftReviewReply, initial);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Svar på anmeldelse</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={action} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Eiendom (valgfritt)</Label>
              <select name="property_id" className={selectClass} defaultValue="">
                <option value="">—</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Stjerner</Label>
              <select name="rating" className={selectClass} defaultValue="5">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} ★
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="review">Anmeldelsen</Label>
            <Textarea
              id="review"
              name="review"
              rows={4}
              required
              placeholder="Lim inn gjestens anmeldelse…"
            />
          </div>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Tenker…" : "Foreslå svar"}
            </Button>
          </div>
        </form>

        {state.reply && (
          <div className="flex flex-col gap-3 border-t pt-4">
            <Label>Forslag (rediger fritt før du sender)</Label>
            <Textarea readOnly rows={5} value={state.reply} />
            <CopyButton text={state.reply} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
