import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * يقرأ أفراد الشجرة من العرض الآمن `tree_public`،
 * ويعود تلقائياً إلى الجدول الأساسي إن لم تُطبَّق ترقية الخصوصية بعد.
 */
export async function fetchTreeRows<T = Record<string, unknown>>(
  columns = "*",
): Promise<{ rows: T[]; error?: string }> {
  if (!isSupabaseConfigured()) return { rows: [] };
  const sb = getSupabase();

  const view = await sb.from("tree_public").select(columns);
  if (!view.error) return { rows: (view.data ?? []) as T[] };

  const missing =
    view.error.code === "42P01" ||
    view.error.code === "PGRST205" ||
    view.error.message.toLowerCase().includes("does not exist") ||
    view.error.message.toLowerCase().includes("not find");

  if (!missing) return { rows: [], error: view.error.message };

  const raw = await sb.from("family_members").select(columns);
  if (raw.error) return { rows: [], error: raw.error.message };
  return { rows: (raw.data ?? []) as T[] };
}
