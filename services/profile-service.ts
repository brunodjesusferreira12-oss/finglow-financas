import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/finance";

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  return data as Profile | null;
}
