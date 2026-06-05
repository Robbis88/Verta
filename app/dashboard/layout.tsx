import Link from "next/link";

import { getCurrentProfile, requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const profile = await getCurrentProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-col gap-2 border-b border-white/10 bg-navy px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6 print:hidden">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            href="/dashboard"
            className="mr-1 text-lg font-bold tracking-tight text-gold"
          >
            Verta
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-white/70 hover:text-white"
          >
            Oversikt
          </Link>
          <Link
            href="/dashboard/properties"
            className="text-sm text-white/70 hover:text-white"
          >
            Eiendommer
          </Link>
          <Link
            href="/dashboard/meldinger"
            className="text-sm text-white/70 hover:text-white"
          >
            Meldinger
          </Link>
          <Link
            href="/dashboard/varsler"
            className="text-sm text-white/70 hover:text-white"
          >
            Varsler
          </Link>
          <Link
            href="/dashboard/boosts"
            className="text-sm text-white/70 hover:text-white"
          >
            Boost
          </Link>
          <Link
            href="/dashboard/commissions"
            className="text-sm text-white/70 hover:text-white"
          >
            Provisjon
          </Link>
          <Link
            href="/dashboard/tax"
            className="text-sm text-white/70 hover:text-white"
          >
            Skatt
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-sm text-white/70 hover:text-white"
          >
            Innstillinger
          </Link>
          {isAdmin(profile?.email) && (
            <Link
              href="/admin"
              className="text-sm font-medium text-gold-light hover:text-gold"
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-white/60 sm:inline">
            {profile?.email}
          </span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-white/70 hover:text-white"
            >
              Logg ut
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-6">{children}</main>
    </div>
  );
}
