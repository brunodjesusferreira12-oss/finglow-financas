"use client";

import { createBrowserClient } from "@supabase/ssr";

import { assertPublicEnv, env } from "@/lib/env";
import type { Database } from "@/types/database";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createBrowserSupabaseClient() {
  if (browserClient) return browserClient;

  assertPublicEnv();

  browserClient = createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
  return browserClient;
}
