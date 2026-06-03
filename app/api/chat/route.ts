import type Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { anthropic, DEFAULT_MODEL } from "@/lib/anthropic";

/**
 * Enkel chat-route mot Claude. Tar imot { messages } og strømmer svaret
 * tilbake som ren tekst. Utgangspunkt — utvid med auth, lagring osv.
 */
export async function POST(request: NextRequest) {
  const { messages } = (await request.json()) as {
    messages: Anthropic.MessageParam[];
  };

  if (!Array.isArray(messages)) {
    return Response.json({ error: "messages må være en liste" }, { status: 400 });
  }

  const stream = anthropic.messages.stream({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
