import { fallbackNews, type NewsItem } from "@/lib/news-data";
import { getSupabase, isSupabaseConfigured, withTimeout } from "@/lib/supabase";

export type { NewsItem } from "@/lib/news-data";
export { fallbackNews } from "@/lib/news-data";

type RawNewsRow = Record<string, unknown>;

function pickString(row: RawNewsRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function normalizeRow(row: RawNewsRow): NewsItem | null {
  const id =
    typeof row.id === "string" ? row.id : row.id != null ? String(row.id) : `news-${Date.now()}`;
  const created_at =
    typeof row.created_at === "string"
      ? row.created_at
      : typeof row.published_at === "string"
        ? row.published_at
        : new Date().toISOString();

  const title_en = pickString(row, ["title_en", "title", "titleEn", "heading"]);
  const title_ar = pickString(row, ["title_ar", "title_arabic", "titleAr"]);
  const content_en = pickString(row, [
    "content_en",
    "content",
    "body",
    "body_en",
    "description_en",
    "description",
    "excerpt_en",
    "excerpt",
  ]);
  const content_ar = pickString(row, ["content_ar", "body_ar", "contentAr", "description_ar"]);

  if (!title_en && !title_ar && !content_en && !content_ar) return null;

  const cover_image =
    typeof row.cover_image === "string" && row.cover_image.trim() ? row.cover_image.trim() : null;

  return {
    id,
    created_at,
    title_en: title_en || title_ar || "Announcement",
    title_ar: title_ar || title_en || "إعلان",
    content_en: content_en || content_ar || "",
    content_ar: content_ar || content_en || "",
    cover_image,
    category: typeof row.category === "string" ? row.category : null,
  };
}

export type FetchNewsResult = {
  items: NewsItem[];
  source: "supabase" | "fallback";
  error?: string;
};

const NEWS_TABLES = ["news_posts", "news", "announcements"] as const;

export async function fetchNews(): Promise<FetchNewsResult> {
  if (!isSupabaseConfigured()) {
    return { items: fallbackNews, source: "fallback" };
  }

  const supabase = getSupabase();
  let lastError: string | undefined;

  // نتذكّر الجدول الذي نجح سابقاً لتفادي محاولات فاشلة بطيئة
  let tables: readonly string[] = NEWS_TABLES;
  try {
    const known =
      typeof window !== "undefined" ? window.localStorage.getItem("alnahsi_news_table") : null;
    if (known && (NEWS_TABLES as readonly string[]).includes(known)) {
      tables = [known, ...NEWS_TABLES.filter((t) => t !== known)];
    }
  } catch {
    /* ignore */
  }

  for (const table of tables) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from(table)
          .select("*")
          .or("status.eq.published,status.is.null")
          .order("created_at", { ascending: false }),
        4_000,
        `Loading ${table}`,
      );

      if (error) {
        const missing =
          error.code === "42P01" ||
          error.code === "PGRST205" ||
          error.message.toLowerCase().includes("does not exist") ||
          error.message.toLowerCase().includes("could not find");
        if (missing) continue;
        lastError = error.message;
        continue;
      }

      const items = (data ?? [])
        .map((row) => normalizeRow(row as RawNewsRow))
        .filter((item): item is NewsItem => item !== null);

      if (items.length > 0) {
        return { items, source: "supabase" };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Could not load news";
      break;
    }
  }

  return {
    items: fallbackNews,
    source: "fallback",
    error: lastError,
  };
}
