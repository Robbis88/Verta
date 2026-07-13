import { NextResponse } from "next/server";

/**
 * Onboarding-lenken utløp. Send vaskeren tilbake til portalen, der hen kan
 * starte «Koble utbetaling» på nytt.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  return NextResponse.redirect(
    `${origin}/vasker/${token ?? ""}?utbetaling=fortsett`,
  );
}
