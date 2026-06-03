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
      <header className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 print:hidden">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/dashboard" className="font-semibold">
            Verta
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Oversikt
          </Link>
          <Link
            href="/dashboard/properties"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Eiendommer
          </Link>
          <Link
            href="/dashboard/boosts"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Boost
          </Link>
          <Link
            href="/dashboard/commissions"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Provisjon
          </Link>
          <Link
            href="/dashboard/tax"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skatt
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Innstillinger
          </Link>
          {isAdmin(profile?.email) && (
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-muted-foreground sm:inline">
            {profile?.email}
          </span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground"
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
