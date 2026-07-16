import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { unsubscribe } from "./actions";

export const metadata: Metadata = { title: "Avmelding — Verta" };

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ avmeldt?: string }>;
}) {
  const { token } = await params;
  const { avmeldt } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-cloud px-6">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-white p-8 text-center shadow-sm">
        {avmeldt ? (
          <>
            <h1 className="text-xl font-bold text-navy">Du er meldt av</h1>
            <p className="mt-2 text-sm text-ink/70">
              Du vil ikke lenger motta nyhetsbrev fra Verta. Ombestemmer du deg,
              kan du melde deg på igjen når som helst.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-navy">Meld deg av nyhetsbrev</h1>
            <p className="mt-2 text-sm text-ink/70">
              Trykk under for å slutte å motta nyhetsbrev fra Verta.
            </p>
            <form action={unsubscribe.bind(null, token)} className="mt-5">
              <Button type="submit">Meld meg av</Button>
            </form>
          </>
        )}
        <p className="mt-6 text-xs text-ink/50">Levert av Verta</p>
      </div>
    </main>
  );
}
