import { generateTasksForAll } from "@/lib/cleaning";

/**
 * Daglig cron (se vercel.json). Auto-oppretter turnover-oppgaver fra kommende
 * bookinger for alle eiendommer. Beskyttet med CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await generateTasksForAll();
  return Response.json(result);
}
