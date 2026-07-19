"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

type ChatLabels = {
  empty: string;
  placeholder: string;
  rateLimit: string;
  error: string;
};

const DEFAULT_LABELS: ChatLabels = {
  empty:
    "Spør om hva som helst — WiFi, hvordan ting funker, tips i området. Svar kommer på ditt språk.",
  placeholder: "Skriv et spørsmål…",
  rateLimit: "For mange meldinger akkurat nå. Prøv igjen om litt.",
  error: "Beklager, jeg fikk ikke svart nå. Prøv «Kontakt verten» under.",
};

/**
 * AI-concierge for gjesteguiden. Streamer svar fra /api/guide/[token]/chat,
 * på gjestens eget språk. UI-tekstene kan oversettes via `labels`.
 */
export function GuideChat({
  token,
  labels = DEFAULT_LABELS,
}: {
  token: string;
  labels?: ChatLabels;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);

    // Legg til en tom assistent-melding vi fyller etter hvert.
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`/api/guide/${token}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      // Rate limit / for lang melding o.l. kommer som JSON med en beskjed.
      if (res.status === 429 || res.status === 413) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: data?.error ?? labels.rateLimit,
          };
          return copy;
        });
        setBusy(false);
        return;
      }
      if (!res.ok || !res.body) throw new Error("nettverk");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: labels.error,
        };
        return copy;
      });
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-hairline bg-white">
      <div
        ref={scrollRef}
        className="flex max-h-80 min-h-40 flex-col gap-3 overflow-y-auto p-4"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-ink/50">{labels.empty}</p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "self-end rounded-2xl rounded-br-sm bg-navy px-3.5 py-2 text-sm text-white"
                  : "self-start whitespace-pre-line rounded-2xl rounded-bl-sm bg-cloud px-3.5 py-2 text-sm text-navy"
              }
            >
              {m.content || "…"}
            </div>
          ))
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-hairline p-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={labels.placeholder}
          className="h-10 flex-1 bg-transparent px-2 text-sm focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex size-9 items-center justify-center rounded-full bg-gold text-navy disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
