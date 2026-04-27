import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

function buildErrorRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL("/login?error=Link%20invalido%20ou%20expirado.", request.url));
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  const redirectUrl = new URL(next, request.url);
  redirectUrl.searchParams.delete("token_hash");
  redirectUrl.searchParams.delete("type");
  redirectUrl.searchParams.delete("code");
  redirectUrl.searchParams.delete("next");

  const response = NextResponse.redirect(redirectUrl);

  if (!code && !(tokenHash && type)) {
    return buildErrorRedirect(request);
  }

  const supabase = createRouteSupabaseClient(request, response);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return buildErrorRedirect(request);
    }

    return response;
  }

  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash as string,
  });

  if (error) {
    return buildErrorRedirect(request);
  }

  return response;
}
