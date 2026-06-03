import Link from "next/link";

import { getCurrentProfile, requireUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const profile = await getCurrentProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3 print:hidden">
        <nav className="flex items-center gap-6">
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
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{profile?.email}</span>
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
