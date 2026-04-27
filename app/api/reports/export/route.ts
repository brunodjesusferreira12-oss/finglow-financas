import { NextResponse, type NextRequest } from "next/server";

import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { buildTransactionsCsv } from "@/services/report-service";
import { listFinancialEntries } from "@/services/financial-entry-service";

export async function GET(request: NextRequest) {
  const response = new NextResponse(null);
  const supabase = createRouteSupabaseClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const typeParam = url.searchParams.get("type");
  const categoryId = url.searchParams.get("categoryId") ?? undefined;
  const type = typeParam === "income" || typeParam === "expense" ? typeParam : undefined;

  const transactions = await listFinancialEntries(
    user.id,
    {
      from,
      to,
      type,
      categoryId,
      sortBy: "transaction_date",
      sortOrder: "desc",
    },
    1000,
  );

  const csv = buildTransactionsCsv(transactions);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="relatorio-financeiro.csv"',
    },
  });
}
