import { getSupabase, isSupabaseConfigured, withTimeout } from "@/lib/supabase";
import { uploadImage } from "@/lib/contributions";
import { sanitizeHtml } from "@/lib/sanitize-html";

export type BlogPost = {
  id: string;
  author_id: string;
  author_name: string | null;
  member_id: string | null;
  title: string;
  body: string;
  cover_image: string | null;
  status: "draft" | "published";
  visibility: "family" | "public";
  created_at: string;
  updated_at: string;
};

export type BlogResult = {
  posts: BlogPost[];
  /** الجدول لم يُنشأ بعد — يحتاج تطبيق الترحيل من لوحة التحكم */
  needsMigration: boolean;
  error?: string;
};

const MISSING_TABLE_CODES = ["42P01", "PGRST205"];

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code && MISSING_TABLE_CODES.includes(error.code)) return true;
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("does not exist") || msg.includes("could not find");
}

function normalize(row: Record<string, unknown>): BlogPost {
  return {
    id: String(row.id ?? ""),
    author_id: String(row.author_id ?? ""),
    author_name: typeof row.author_name === "string" ? row.author_name : null,
    member_id: typeof row.member_id === "string" ? row.member_id : null,
    title: typeof row.title === "string" ? row.title : "",
    body: typeof row.body === "string" ? row.body : "",
    cover_image:
      typeof row.cover_image === "string" && row.cover_image.trim() ? row.cover_image : null,
    status: row.status === "draft" ? "draft" : "published",
    visibility: row.visibility === "public" ? "public" : "family",
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
  };
}

/** آخر التدوينات المنشورة — ما تسمح به سياسات الصلاحيات للمستخدم الحالي */
export async function fetchBlogFeed(limit = 30): Promise<BlogResult> {
  if (!isSupabaseConfigured()) return { posts: [], needsMigration: false };

  try {
    const { data, error } = await withTimeout(
      getSupabase()
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(limit),
      10_000,
      "تحميل المدونات",
    );

    if (error) {
      if (isMissingTable(error)) return { posts: [], needsMigration: true };
      return { posts: [], needsMigration: false, error: error.message };
    }

    return {
      posts: (data ?? []).map((r) => normalize(r as Record<string, unknown>)),
      needsMigration: false,
    };
  } catch (err) {
    return {
      posts: [],
      needsMigration: false,
      error: err instanceof Error ? err.message : "تعذّر تحميل المدونات",
    };
  }
}

/** تدوينات كاتب واحد — تشمل المسودات إذا كان هو صاحبها */
export async function fetchPostsByAuthor(authorId: string): Promise<BlogResult> {
  if (!isSupabaseConfigured()) return { posts: [], needsMigration: false };

  try {
    const { data, error } = await withTimeout(
      getSupabase()
        .from("blog_posts")
        .select("*")
        .eq("author_id", authorId)
        .order("created_at", { ascending: false }),
      10_000,
      "تحميل تدوينات الكاتب",
    );

    if (error) {
      if (isMissingTable(error)) return { posts: [], needsMigration: true };
      return { posts: [], needsMigration: false, error: error.message };
    }

    return {
      posts: (data ?? []).map((r) => normalize(r as Record<string, unknown>)),
      needsMigration: false,
    };
  } catch (err) {
    return {
      posts: [],
      needsMigration: false,
      error: err instanceof Error ? err.message : "تعذّر تحميل التدوينات",
    };
  }
}

export async function fetchPost(id: string): Promise<{ post: BlogPost | null; error?: string }> {
  if (!isSupabaseConfigured()) return { post: null };

  try {
    const { data, error } = await withTimeout(
      getSupabase().from("blog_posts").select("*").eq("id", id).maybeSingle(),
      10_000,
      "تحميل التدوينة",
    );
    if (error) return { post: null, error: error.message };
    return { post: data ? normalize(data as Record<string, unknown>) : null };
  } catch (err) {
    return { post: null, error: err instanceof Error ? err.message : "تعذّر تحميل التدوينة" };
  }
}

export type BlogDraft = {
  id?: string;
  title: string;
  body: string;
  cover_image: string | null;
  status: "draft" | "published";
  visibility: "family" | "public";
};

export async function savePost(
  draft: BlogDraft,
  author: { id: string; name: string | null },
): Promise<{ id?: string; error?: string }> {
  const payload = {
    author_id: author.id,
    author_name: author.name,
    title: draft.title.trim(),
    body: sanitizeHtml(draft.body),
    cover_image: draft.cover_image,
    status: draft.status,
    visibility: draft.visibility,
    updated_at: new Date().toISOString(),
  };

  const query = draft.id
    ? getSupabase().from("blog_posts").update(payload).eq("id", draft.id).select("id").maybeSingle()
    : getSupabase().from("blog_posts").insert(payload).select("id").maybeSingle();

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { id: (data as { id?: string } | null)?.id };
}

export async function deletePost(id: string): Promise<string | null> {
  const { error } = await getSupabase().from("blog_posts").delete().eq("id", id);
  return error ? error.message : null;
}

/** الرفع موحّد في contributions.ts — نُصدّره هنا حفاظاً على نقاط الاستدعاء */
export async function uploadBlogImage(
  file: File,
  userId: string,
): Promise<{ url?: string; error?: string; savedBytes?: number }> {
  return uploadImage(file, userId, "blog-images");
}

export { verifyImageUrl } from "@/lib/contributions";

/** ملخّص قصير للعرض في البطاقات */
export function excerpt(body: string, max = 160): string {
  const clean = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}
