import { requireUser } from "@/lib/auth";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center p-6">
      {children}
    </div>
  );
}
