import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { acceptInvite } from "./actions";
import { Button } from "@/components/ui/button";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("team_members")
    .select("member_email,owner_user_id,accepted_at")
    .eq("invite_token", token)
    .maybeSingle();
  if (!invite) notFound();

  const { data: owner } = await admin
    .from("users")
    .select("name,email")
    .eq("id", invite.owner_user_id)
    .single();
  const ownerLabel = owner?.name || owner?.email || "En Verta-bruker";

  const user = await getCurrentUser();
  const userEmail = (user?.email ?? "").trim().toLowerCase();
  const inviteEmail = invite.member_email.trim().toLowerCase();

  return (
    <main className="flex min-h-screen items-center justify-center bg-cloud p-6">
      <div className="w-full max-w-md rounded-xl border border-hairline bg-white p-8 text-center">
        <p className="text-sm text-gold">Invitasjon</p>
        <h1 className="mt-1 text-2xl font-bold text-navy">
          Bli co-host i Verta
        </h1>
        <p className="mt-3 text-sm text-ink">
          <strong>{ownerLabel}</strong> har invitert deg til å hjelpe med
          driften av eiendommene sine.
        </p>

        <div className="mt-6">
          {invite.accepted_at ? (
            <p className="text-sm text-emerald-600">
              Invitasjonen er allerede akseptert.{" "}
              <Link href="/dashboard" className="underline">
                Gå til dashbordet
              </Link>
            </p>
          ) : !user ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-ink/70">
                Logg inn med <strong>{invite.member_email}</strong> for å godta.
              </p>
              <Button asChild className="bg-gold text-navy hover:bg-gold/90">
                <Link href="/login">Logg inn</Link>
              </Button>
            </div>
          ) : userEmail !== inviteEmail ? (
            <p className="text-sm text-destructive">
              Denne invitasjonen er for {invite.member_email}, men du er logget
              inn som {user.email}. Logg inn med riktig konto.
            </p>
          ) : (
            <form action={acceptInvite}>
              <input type="hidden" name="token" value={token} />
              <Button type="submit" className="bg-gold text-navy hover:bg-gold/90">
                Godta invitasjon
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
