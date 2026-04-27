import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { assertPublicEnv, env } from "@/lib/env";
import type { Database } from "@/types/database";

type CookieToSet = {
  name: string;
  value: string;
  options?: {
    domain?: string;
    path?: string;
    maxAge?: number;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
  };
};

export async function createServerSupabaseClient() {
  assertPublicEnv();

  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components nao podem gravar cookies diretamente em todos os cenarios.
        }
      },
    },
  });
}
