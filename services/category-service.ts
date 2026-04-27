import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Category, TransactionType } from "@/types/finance";

export async function getCategories(userId: string, type?: TransactionType): Promise<Category[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("categories").select("*").eq("user_id", userId).order("name");

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    const message = error.code === "PGRST205"
      ? "A API do Supabase ainda não reconhece a tabela categories no schema cache. Rode `select pg_notification_queue_usage();` e depois `NOTIFY pgrst, 'reload schema';` no SQL Editor."
      : `Não foi possível carregar as categorias. Detalhe: ${error.message}`;

    console.error("Erro ao carregar categorias:", error);
    throw new Error(message);
  }

  return (data as Category[] | null) ?? [];
}
