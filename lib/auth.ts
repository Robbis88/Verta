import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/types";

/** Henter innlogget Supabase-bruker, eller null. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Som getCurrentUser, men redirecter til /login hvis ikke innlogget. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Henter brukerprofilen (public.users) for innlogget bruker. */
export async function getCurrentProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id,email,name,phone,plan,extra_properties_count,stripe_customer_id")
    .eq("id", user.id)
    .single();

  return (data as UserProfile) ?? null;
}
